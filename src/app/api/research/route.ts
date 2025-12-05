import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardXP } from "@/lib/gamification";
import { checkAndFilterContent, getMentalHealthResources } from "@/lib/safety-mode";
import { FREE_TIER_LIMITS, XPAwardResult } from "@/types";

const SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1/paper/search";

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  authors: Array<{ name: string }>;
  citationCount: number;
  url: string;
  openAccessPdf?: { url: string } | null;
}

function generateCitation(paper: SemanticScholarPaper, format: string): string {
  const authors = paper.authors.map((a) => a.name);
  const year = paper.year || "n.d.";
  const title = paper.title;

  const formatAuthors = (authors: string[], style: "apa" | "mla" | "chicago") => {
    if (authors.length === 0) return "Unknown Author";
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) {
      return style === "apa"
        ? `${authors[0]} & ${authors[1]}`
        : `${authors[0]} and ${authors[1]}`;
    }
    return style === "apa"
      ? `${authors[0]} et al.`
      : `${authors[0]}, et al.`;
  };

  switch (format) {
    case "apa":
      return `${formatAuthors(authors, "apa")} (${year}). ${title}. Semantic Scholar. https://www.semanticscholar.org/paper/${paper.paperId}`;
    case "mla":
      return `${formatAuthors(authors, "mla")}. "${title}." Semantic Scholar, ${year}, www.semanticscholar.org/paper/${paper.paperId}.`;
    case "chicago":
      return `${formatAuthors(authors, "chicago")}. "${title}." Semantic Scholar (${year}). https://www.semanticscholar.org/paper/${paper.paperId}.`;
    default:
      return `${formatAuthors(authors, "apa")} (${year}). ${title}.`;
  }
}

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
        .eq("feature", "research")
        .eq("period", currentPeriod)
        .single();

      if (usage && usage.count >= FREE_TIER_LIMITS.research) {
        return NextResponse.json(
          {
            error: `Free tier limit reached (${FREE_TIER_LIMITS.research}/month). Upgrade to Premium for unlimited research.`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const { query, limit = 10, year } = body;

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        { error: "Search query must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Safety Mode: Check and filter the search query
    const safetyCheck = await checkAndFilterContent(user.id, query, "research");

    if (!safetyCheck.allowed) {
      const response: Record<string, unknown> = {
        error: safetyCheck.blockedReason || safetyCheck.filterResult?.message,
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

    // Build Semantic Scholar query
    const params = new URLSearchParams({
      query: query.trim(),
      limit: Math.min(limit, 20).toString(),
      fields: "paperId,title,abstract,year,authors,citationCount,url,openAccessPdf",
    });

    if (year) {
      params.append("year", year.toString());
    }

    const response = await fetch(`${SEMANTIC_SCHOLAR_API}?${params}`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Semantic Scholar API error");
    }

    const data = await response.json();

    // Format papers with citations
    const papers = (data.data || []).map((paper: SemanticScholarPaper) => ({
      id: paper.paperId,
      title: paper.title,
      authors: paper.authors.map((a) => a.name),
      year: paper.year,
      abstract: paper.abstract || "No abstract available.",
      citationCount: paper.citationCount || 0,
      url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
      pdfUrl: paper.openAccessPdf?.url || null,
      citations: {
        apa: generateCitation(paper, "apa"),
        mla: generateCitation(paper, "mla"),
        chicago: generateCitation(paper, "chicago"),
      },
    }));

    // Update usage count
    const currentPeriod = new Date().toISOString().slice(0, 7);
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature: "research",
      p_period: currentPeriod,
    });

    // Award XP for research query
    let xpResult: XPAwardResult | null = null;
    try {
      xpResult = await awardXP(user.id, 'research_query', {
        description: `Searched for "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`,
        referenceType: 'research',
        metadata: { query, resultsCount: papers.length },
      });
    } catch (xpError) {
      console.error('Error awarding XP:', xpError);
    }

    return NextResponse.json({
      papers,
      total: data.total || papers.length,
      query,
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
    console.error("Research search error:", error);
    return NextResponse.json(
      { error: "Failed to search papers. Please try again." },
      { status: 500 }
    );
  }
}
