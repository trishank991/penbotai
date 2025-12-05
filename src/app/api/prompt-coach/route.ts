import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithGroq, generatePromptAnalysisPrompt } from "@/lib/ai/groq";
import { awardXP, checkAndAwardBadges, updateHighScore } from "@/lib/gamification";
import { checkAndFilterContent, getMentalHealthResources } from "@/lib/safety-mode";
import { FREE_TIER_LIMITS, PromptAnalysis, XPAwardResult } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Parse request body first to check content
    const body = await request.json();
    const { prompt, targetAI } = body;

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Prompt must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Safety Mode: Check and filter content
    const safetyCheck = await checkAndFilterContent(user.id, prompt, "prompt_coach");

    if (!safetyCheck.allowed) {
      // Content was blocked or user doesn't have access
      const response: Record<string, unknown> = {
        error: safetyCheck.blockedReason || safetyCheck.filterResult?.message,
        blocked: true,
        safetyMode: true,
      };

      // If self-harm related, include mental health resources
      if (safetyCheck.filterResult?.categories.includes("self_harm")) {
        response.mentalHealthResources = getMentalHealthResources();
        response.message =
          "We care about your wellbeing. If you're going through a difficult time, please reach out to someone who can help.";
      }

      // Include suggestion for rephrasing
      if (safetyCheck.filterResult?.suggestedRephrase) {
        response.suggestion = safetyCheck.filterResult.suggestedRephrase;
      }

      return NextResponse.json(response, { status: 403 });
    }

    // Get user profile to check plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const isPremium = profile?.plan === "premium" || profile?.plan === "university";

    // Check usage limits for free tier
    if (!isPremium) {
      const currentPeriod = new Date().toISOString().slice(0, 7);

      const { data: usage } = await supabase
        .from("usage")
        .select("count")
        .eq("user_id", user.id)
        .eq("feature", "prompt_coach")
        .eq("period", currentPeriod)
        .single();

      if (usage && usage.count >= FREE_TIER_LIMITS.prompt_coach) {
        return NextResponse.json(
          {
            error: `Free tier limit reached (${FREE_TIER_LIMITS.prompt_coach}/month). Upgrade to Premium for unlimited analyses.`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    // Generate analysis with Groq
    const messages = generatePromptAnalysisPrompt(prompt, targetAI);
    const responseText = await generateWithGroq(messages, {
      temperature: 0.3,
    });

    // Parse JSON response
    let analysis: PromptAnalysis;
    try {
      // Try to extract JSON from markdown code blocks first, then fallback to raw JSON
      const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonText = codeBlockMatch?.[1] || responseText.match(/\{[\s\S]*\}/)?.[0];

      if (!jsonText) {
        throw new Error("No JSON found in response");
      }
      analysis = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse analysis:", responseText);
      return NextResponse.json(
        { error: "Failed to analyze prompt. Please try again." },
        { status: 500 }
      );
    }

    // Save to database
    const { error: saveError } = await supabase.from("prompts").insert({
      user_id: user.id,
      original_prompt: prompt,
      score: analysis.score,
      feedback: analysis,
      improved_prompt: analysis.improvedPrompt || null,
      ai_model: targetAI || null,
    });

    if (saveError) {
      console.error("Error saving prompt:", saveError);
    }

    // Update usage count
    const currentPeriod = new Date().toISOString().slice(0, 7);
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature: "prompt_coach",
      p_period: currentPeriod,
    });

    // Award XP for completing prompt analysis
    let xpResult: XPAwardResult | null = null;
    try {
      xpResult = await awardXP(user.id, 'prompt_analyze', {
        description: `Analyzed prompt (score: ${analysis.score})`,
        referenceType: 'prompt',
        metadata: { score: analysis.score, targetAI },
      });

      // Check for high score (90+ is excellent)
      if (analysis.score >= 90) {
        const highScoreResult = await updateHighScore(user.id, 'prompt', analysis.score);
        if (highScoreResult.isNewHighScore) {
          const bonusXP = await awardXP(user.id, 'high_score', {
            description: `New prompt high score: ${analysis.score}!`,
            referenceType: 'prompt',
            checkBadges: false,
            updateStreak: false,
          });
          xpResult.xpAwarded += bonusXP.xpAwarded;
          xpResult.totalXP = bonusXP.totalXP;
        }
      }

      // Check for score-based badges
      const additionalBadges = await checkAndAwardBadges(user.id, 'prompt_analyze', {
        referenceType: 'prompt',
        score: analysis.score,
      });
      xpResult.newBadges.push(...additionalBadges);
    } catch (xpError) {
      console.error('Error awarding XP:', xpError);
    }

    return NextResponse.json({
      ...analysis,
      xp: xpResult ? {
        xpAwarded: xpResult.xpAwarded,
        totalXP: xpResult.totalXP,
        leveledUp: xpResult.leveledUp,
        newLevel: xpResult.newLevel,
        newBadges: xpResult.newBadges,
        streakUpdate: xpResult.streakUpdate,
      } : null,
    });
  } catch (error) {
    console.error("Prompt analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze prompt. Please try again." },
      { status: 500 }
    );
  }
}

// Get user's prompt history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data: prompts, error } = await supabase
      .from("prompts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}
