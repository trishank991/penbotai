import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPlagiarism } from "@/lib/plagiarism";
import { FREE_TIER_LIMITS } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Check plan and usage limits
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const isPremium = profile?.plan === "premium" || profile?.plan === "university";

    if (!isPremium) {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const { data: usage } = await supabase
        .from("usage")
        .select("count")
        .eq("user_id", user.id)
        .eq("feature", "plagiarism")
        .eq("period", currentPeriod)
        .single();

      if (usage && usage.count >= FREE_TIER_LIMITS.plagiarism) {
        return NextResponse.json(
          {
            error: `Free tier limit reached (${FREE_TIER_LIMITS.plagiarism}/month). Upgrade to Premium for unlimited plagiarism checks.`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const { text } = body;

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Text must be at least 50 characters for accurate analysis" },
        { status: 400 }
      );
    }

    if (text.length > 50000) {
      return NextResponse.json(
        { error: "Text must be less than 50,000 characters" },
        { status: 400 }
      );
    }

    // Run plagiarism check
    const result = await checkPlagiarism(text);

    // Update usage count
    const currentPeriod = new Date().toISOString().slice(0, 7);
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature: "plagiarism",
      p_period: currentPeriod,
    });

    return NextResponse.json({
      overallScore: result.overallScore,
      aiGeneratedScore: result.aiGeneratedScore,
      matches: result.matches,
      summary: result.summary,
      suggestions: result.suggestions,
      stats: {
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
        matchCount: result.matches.length,
      },
    });
  } catch (error) {
    console.error("Plagiarism check error:", error);
    return NextResponse.json(
      { error: "Failed to check for plagiarism. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's plagiarism check history (for future use)
export async function GET() {
  try {
    const supabase = await createClient();

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

    // Get current usage
    const currentPeriod = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("feature", "plagiarism")
      .eq("period", currentPeriod)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const isPremium = profile?.plan === "premium" || profile?.plan === "university";

    return NextResponse.json({
      usage: {
        current: usage?.count || 0,
        limit: isPremium ? "unlimited" : FREE_TIER_LIMITS.plagiarism,
        remaining: isPremium ? "unlimited" : FREE_TIER_LIMITS.plagiarism - (usage?.count || 0),
      },
    });
  } catch (error) {
    console.error("Get plagiarism usage error:", error);
    return NextResponse.json(
      { error: "Failed to get usage data." },
      { status: 500 }
    );
  }
}
