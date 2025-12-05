import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_TIER_LIMITS } from "@/types";

const LANGUAGETOOL_API = "https://api.languagetool.org/v2/check";

// Supported English variants for grammar checking
type EnglishVariant =
  | 'en-US'   // American English
  | 'en-GB'   // British English
  | 'en-AU'   // Australian English
  | 'en-CA'   // Canadian English
  | 'en-NZ'   // New Zealand English
  | 'en-ZA'   // South African English
  | 'en-IN';  // Indian English

// Regional English configuration
const ENGLISH_VARIANTS: Record<EnglishVariant, {
  name: string;
  flag: string;
  description: string;
  examples: {
    spelling: string[];
    vocabulary: string[];
  };
}> = {
  'en-US': {
    name: 'American English',
    flag: '🇺🇸',
    description: 'Standard American English spelling and grammar',
    examples: {
      spelling: ['color', 'center', 'organize', 'analyze'],
      vocabulary: ['apartment', 'elevator', 'sidewalk', 'truck'],
    },
  },
  'en-GB': {
    name: 'British English',
    flag: '🇬🇧',
    description: 'Standard British English spelling and grammar',
    examples: {
      spelling: ['colour', 'centre', 'organise', 'analyse'],
      vocabulary: ['flat', 'lift', 'pavement', 'lorry'],
    },
  },
  'en-AU': {
    name: 'Australian English',
    flag: '🇦🇺',
    description: 'Australian English spelling (follows British conventions)',
    examples: {
      spelling: ['colour', 'centre', 'organise', 'analyse'],
      vocabulary: ['flat', 'lift', 'footpath', 'ute'],
    },
  },
  'en-CA': {
    name: 'Canadian English',
    flag: '🇨🇦',
    description: 'Canadian English (mix of British and American)',
    examples: {
      spelling: ['colour', 'center', 'organize', 'analyse'],
      vocabulary: ['apartment', 'elevator', 'sidewalk', 'truck'],
    },
  },
  'en-NZ': {
    name: 'New Zealand English',
    flag: '🇳🇿',
    description: 'New Zealand English spelling (follows British conventions)',
    examples: {
      spelling: ['colour', 'centre', 'organise', 'analyse'],
      vocabulary: ['flat', 'lift', 'footpath', 'truck'],
    },
  },
  'en-ZA': {
    name: 'South African English',
    flag: '🇿🇦',
    description: 'South African English spelling (follows British conventions)',
    examples: {
      spelling: ['colour', 'centre', 'organise', 'analyse'],
      vocabulary: ['flat', 'lift', 'pavement', 'bakkie'],
    },
  },
  'en-IN': {
    name: 'Indian English',
    flag: '🇮🇳',
    description: 'Indian English spelling (follows British conventions)',
    examples: {
      spelling: ['colour', 'centre', 'organise', 'analyse'],
      vocabulary: ['flat', 'lift', 'footpath', 'lorry'],
    },
  },
};

// Map our English variants to LanguageTool language codes
const LANGUAGETOOL_LANGUAGE_MAP: Record<EnglishVariant, string> = {
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  'en-AU': 'en-AU',
  'en-CA': 'en-CA',
  'en-NZ': 'en-NZ',
  'en-ZA': 'en-ZA',
  'en-IN': 'en-GB', // LanguageTool doesn't have en-IN, use en-GB as closest
};

// Validate that the language is a supported English variant
function isValidEnglishVariant(lang: string): lang is EnglishVariant {
  return lang in ENGLISH_VARIANTS;
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
      .select("plan, preferred_english_variant")
      .eq("id", user.id)
      .single();

    const isPremium = profile?.plan === "premium" || profile?.plan === "university";

    if (!isPremium) {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const { data: usage } = await supabase
        .from("usage")
        .select("count")
        .eq("user_id", user.id)
        .eq("feature", "grammar")
        .eq("period", currentPeriod)
        .single();

      if (usage && usage.count >= FREE_TIER_LIMITS.grammar) {
        return NextResponse.json(
          {
            error: `Free tier limit reached (${FREE_TIER_LIMITS.grammar}/month). Upgrade to Premium for unlimited grammar checks.`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const { text } = body;

    // Use provided language or user's preferred variant or default to en-US
    let language: EnglishVariant = body.language || profile?.preferred_english_variant || 'en-US';

    // Validate the language
    if (!isValidEnglishVariant(language)) {
      language = 'en-US';
    }

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { error: "Text must be at least 5 characters" },
        { status: 400 }
      );
    }

    // Get the LanguageTool language code
    const ltLanguage = LANGUAGETOOL_LANGUAGE_MAP[language];

    // Call LanguageTool API with the regional variant
    const params = new URLSearchParams({
      text,
      language: ltLanguage,
      enabledOnly: "false",
    });

    const response = await fetch(LANGUAGETOOL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error("LanguageTool API error");
    }

    const data = await response.json();

    // Update usage count
    const currentPeriod = new Date().toISOString().slice(0, 7);
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature: "grammar",
      p_period: currentPeriod,
    });

    const matches = Array.isArray(data.matches) ? data.matches : [];

    // Categorize issues by type for better UI
    const categorizedMatches = matches.map((match: any) => {
      const category = match.rule.category?.name || "General";
      const isSpellingVariant =
        match.rule.id.includes("MORFOLOGIK") ||
        match.rule.id.includes("SPELLING") ||
        category.toLowerCase().includes("typo") ||
        category.toLowerCase().includes("spelling");

      // Check if this might be a regional spelling difference
      const isRegionalSpelling = isSpellingVariant && (
        match.rule.id.includes("EN_GB") ||
        match.rule.id.includes("EN_US") ||
        match.rule.id.includes("EN_AU") ||
        match.rule.id.includes("EN_CA")
      );

      return {
        message: match.message,
        offset: match.offset,
        length: match.length,
        replacements: (match.replacements || []).slice(0, 5).map((r: any) => r.value),
        rule: {
          id: match.rule.id,
          description: match.rule.description,
          category: category,
          issueType: match.rule.issueType || "other",
        },
        context: match.context,
        isSpellingVariant,
        isRegionalSpelling,
        shortMessage: match.shortMessage || match.message,
      };
    });

    // Calculate statistics
    const stats = {
      errorCount: matches.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      characterCount: text.length,
      byCategory: categorizedMatches.reduce((acc: Record<string, number>, match: any) => {
        const cat = match.rule.category;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {}),
      spellingErrors: categorizedMatches.filter((m: any) => m.isSpellingVariant).length,
      grammarErrors: categorizedMatches.filter((m: any) => !m.isSpellingVariant).length,
    };

    // Get variant info for display
    const variantInfo = ENGLISH_VARIANTS[language];

    return NextResponse.json({
      matches: categorizedMatches,
      language: {
        code: language,
        name: variantInfo.name,
        flag: variantInfo.flag,
        detectedLanguage: data.language?.detectedLanguage?.name || null,
      },
      stats,
    });
  } catch (error) {
    console.error("Grammar check error:", error);
    return NextResponse.json(
      { error: "Failed to check grammar. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint to return supported English variants
export async function GET() {
  const variants = Object.entries(ENGLISH_VARIANTS).map(([code, info]) => {
    const variantInfo = info as {
      name: string;
      flag: string;
      description: string;
      examples: { spelling: string[]; vocabulary: string[] };
    };
    return {
      code,
      name: variantInfo.name,
      flag: variantInfo.flag,
      description: variantInfo.description,
      examples: variantInfo.examples,
    };
  });

  return NextResponse.json({ variants });
}
