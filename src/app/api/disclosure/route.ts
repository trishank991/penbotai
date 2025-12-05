import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithGroq, generateDisclosurePrompt } from "@/lib/ai/groq";
import { awardXP, checkAndAwardBadges } from "@/lib/gamification";
import { checkAndFilterContent, getMentalHealthResources } from "@/lib/safety-mode";
import { FREE_TIER_LIMITS, XPAwardResult } from "@/types";

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

    // Parse request body
    const body = await request.json();
    const { aiTools, purpose, description, promptsUsed, outputUsage, template } = body;

    // Validate required fields
    if (!aiTools?.length || !purpose || !description || !outputUsage || !template) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Safety Mode: Check and filter content (combine all text fields)
    const combinedContent = [purpose, description, outputUsage, ...(promptsUsed || [])].join(" ");
    const safetyCheck = await checkAndFilterContent(user.id, combinedContent, "disclosure");

    if (!safetyCheck.allowed) {
      const response: Record<string, unknown> = {
        error: safetyCheck.blockedReason || safetyCheck.filterResult?.message || "Content blocked by safety filter",
        blocked: true,
        safetyMode: true,
      };

      if (safetyCheck.filterResult?.categories.includes("self_harm")) {
        response.mentalHealthResources = getMentalHealthResources();
      }

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
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

      const { data: usage } = await supabase
        .from("usage")
        .select("count")
        .eq("user_id", user.id)
        .eq("feature", "disclosure")
        .eq("period", currentPeriod)
        .single();

      if (usage && usage.count >= FREE_TIER_LIMITS.disclosure) {
        return NextResponse.json(
          {
            error: `Free tier limit reached (${FREE_TIER_LIMITS.disclosure}/month). Upgrade to Premium for unlimited disclosures.`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    // Generate disclosure with Groq
    const messages = generateDisclosurePrompt({
      aiTools,
      purpose,
      description,
      promptsUsed,
      outputUsage,
      template,
    });

    const disclosure = await generateWithGroq(messages, {
      temperature: 0.5, // Lower temperature for consistent, professional output
    });

    // Save to database
    const { error: saveError } = await supabase.from("disclosures").insert({
      user_id: user.id,
      ai_tools: aiTools,
      purpose,
      description,
      prompts_used: promptsUsed || null,
      output_usage: outputUsage,
      formatted_disclosure: disclosure,
      template,
    });

    if (saveError) {
      console.error("Error saving disclosure:", saveError);
      // Don't count against usage if save failed
      return NextResponse.json(
        { error: "Failed to save disclosure. Please try again." },
        { status: 500 }
      );
    }

    // Update usage count
    const currentPeriod = new Date().toISOString().slice(0, 7);
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature: "disclosure",
      p_period: currentPeriod,
    });

    // Award XP for generating disclosure
    let xpResult: XPAwardResult | null = null;
    try {
      xpResult = await awardXP(user.id, 'disclosure_generate', {
        description: `Generated ${template.toUpperCase()} disclosure for ${purpose}`,
        referenceType: 'disclosure',
        metadata: { template, purpose, aiTools },
      });

      // Check for badges (guard against null/undefined return)
      const additionalBadges = await checkAndAwardBadges(user.id, 'disclosure_generate', {
        referenceType: 'disclosure',
      });
      if (additionalBadges?.length) {
        xpResult.newBadges.push(...additionalBadges);
      }
    } catch (xpError) {
      console.error('Error awarding XP:', xpError);
    }

    return NextResponse.json({
      disclosure,
      format: template,
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
    console.error("Disclosure generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate disclosure. Please try again." },
      { status: 500 }
    );
  }
}

// Get user's disclosure history
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
    // Validate and cap limit/offset to prevent NaN and excessive data fetching
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10") || 10));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0") || 0);

    const { data: disclosures, error } = await supabase
      .from("disclosures")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({ disclosures });
  } catch (error) {
    console.error("Error fetching disclosures:", error);
    return NextResponse.json(
      { error: "Failed to fetch disclosures" },
      { status: 500 }
    );
  }
}
