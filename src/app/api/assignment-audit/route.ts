import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateWithGroq,
  generateAssignmentAuditPrompt,
  calculateTextStats,
  detectCitations,
  calculateRelevanceScore,
} from "@/lib/ai/groq";
import {
  awardXP,
  checkAndAwardBadges,
  updateHighScore,
} from "@/lib/gamification";
import { checkAndFilterContent, getMentalHealthResources } from "@/lib/safety-mode";
import {
  FREE_TIER_LIMITS,
  AssignmentAuditInput,
  AssignmentAuditResult,
  ContextEvidence,
  IntegrityEvidence,
  DetailsEvidence,
  InsightEvidence,
  GapItem,
  ImprovementItem,
  IssueItem,
  RequirementsAnalysis,
  XPAwardResult,
} from "@/types";

// Validate and sanitize the AI response to match our types
function validateAndSanitizeAuditResponse(raw: Record<string, unknown>): Partial<AssignmentAuditResult> {
  const clamp = (val: unknown, min: number, max: number): number => {
    const num = typeof val === 'number' ? val : 0;
    return Math.max(min, Math.min(max, num));
  };

  const sanitizeContextEvidence = (ev: unknown): ContextEvidence => {
    const e = ev && typeof ev === 'object' ? ev as Record<string, unknown> : {};
    return {
      strengths: Array.isArray(e.strengths) ? e.strengths.filter((s): s is string => typeof s === 'string') : [],
      gaps: Array.isArray(e.gaps) ? e.gaps.filter((s): s is string => typeof s === 'string') : [],
      citationsFound: typeof e.citationsFound === 'number' ? e.citationsFound : 0,
      backgroundProvided: !!e.backgroundProvided,
      audienceClarity: !!e.audienceClarity,
    };
  };

  const sanitizeIntegrityEvidence = (ev: unknown): IntegrityEvidence => {
    const e = ev && typeof ev === 'object' ? ev as Record<string, unknown> : {};
    return {
      logicalFlow: !!e.logicalFlow,
      contradictions: Array.isArray(e.contradictions)
        ? e.contradictions.map((c: unknown) => {
            const item = c && typeof c === 'object' ? c as Record<string, unknown> : {};
            return {
              statement1: String(item.statement1 || ''),
              statement2: String(item.statement2 || ''),
              location: String(item.location || ''),
            };
          })
        : [],
      unsupportedClaims: Array.isArray(e.unsupportedClaims)
        ? e.unsupportedClaims.map((c: unknown) => {
            const item = c && typeof c === 'object' ? c as Record<string, unknown> : {};
            return {
              claim: String(item.claim || ''),
              location: String(item.location || ''),
            };
          })
        : [],
      transitionQuality: ['poor', 'adequate', 'strong'].includes(String(e.transitionQuality))
        ? (e.transitionQuality as 'poor' | 'adequate' | 'strong')
        : 'adequate',
    };
  };

  const sanitizeDetailsEvidence = (ev: unknown): DetailsEvidence => {
    const e = ev && typeof ev === 'object' ? ev as Record<string, unknown> : {};
    return {
      specificExamples: typeof e.specificExamples === 'number' ? e.specificExamples : 0,
      vagueStatements: Array.isArray(e.vagueStatements)
        ? e.vagueStatements.map((v: unknown) => {
            const item = v && typeof v === 'object' ? v as Record<string, unknown> : {};
            return {
              text: String(item.text || ''),
              location: String(item.location || ''),
              suggestion: String(item.suggestion || ''),
            };
          })
        : [],
      dataPoints: typeof e.dataPoints === 'number' ? e.dataPoints : 0,
      concreteLanguage: !!e.concreteLanguage,
    };
  };

  const sanitizeInsightEvidence = (ev: unknown): InsightEvidence => {
    const e = ev && typeof ev === 'object' ? ev as Record<string, unknown> : {};
    return {
      originalArguments: Array.isArray(e.originalArguments)
        ? e.originalArguments.filter((s): s is string => typeof s === 'string')
        : [],
      genericStatements: Array.isArray(e.genericStatements)
        ? e.genericStatements.map((g: unknown) => {
            const item = g && typeof g === 'object' ? g as Record<string, unknown> : {};
            return {
              text: String(item.text || ''),
              location: String(item.location || ''),
            };
          })
        : [],
      analysisDepth: ['shallow', 'moderate', 'deep'].includes(String(e.analysisDepth))
        ? (e.analysisDepth as 'shallow' | 'moderate' | 'deep')
        : 'shallow',
      criticalThinking: !!e.criticalThinking,
      synthesisPresent: !!e.synthesisPresent,
    };
  };

  const sanitizeGapAnalysis = (gaps: unknown): GapItem[] => {
    if (!Array.isArray(gaps)) return [];
    return gaps.map((g: unknown) => {
      const item = g && typeof g === 'object' ? g as Record<string, unknown> : {};
      return {
        gap: String(item.gap || ''),
        priority: ['high', 'medium', 'low'].includes(String(item.priority))
          ? (item.priority as 'high' | 'medium' | 'low')
          : 'medium',
        fixTimeMinutes: typeof item.fixTimeMinutes === 'number' ? item.fixTimeMinutes : 30,
        gradeImpact: String(item.gradeImpact || '+0 points'),
        howToFix: String(item.howToFix || ''),
      };
    });
  };

  const sanitizeImprovements = (improvements: unknown): ImprovementItem[] => {
    if (!Array.isArray(improvements)) return [];
    return improvements.map((i: unknown) => {
      const item = i && typeof i === 'object' ? i as Record<string, unknown> : {};
      return {
        action: String(item.action || ''),
        location: String(item.location || ''),
        effort: ['easy', 'medium', 'hard'].includes(String(item.effort))
          ? (item.effort as 'easy' | 'medium' | 'hard')
          : 'medium',
        impact: ['high', 'medium', 'low'].includes(String(item.impact))
          ? (item.impact as 'high' | 'medium' | 'low')
          : 'medium',
        example: item.example ? String(item.example) : undefined,
      };
    });
  };

  const sanitizeIssues = (issues: unknown): IssueItem[] => {
    if (!Array.isArray(issues)) return [];
    return issues.map((i: unknown) => {
      const item = i && typeof i === 'object' ? i as Record<string, unknown> : {};
      const validTypes = ['repetition', 'vague', 'unsupported', 'tangent', 'grammar', 'structure'];
      return {
        type: validTypes.includes(String(item.type))
          ? (item.type as IssueItem['type'])
          : 'vague',
        location: String(item.location || ''),
        text: String(item.text || ''),
        suggestion: item.suggestion ? String(item.suggestion) : undefined,
      };
    });
  };

  const sanitizeRequirements = (req: unknown): RequirementsAnalysis | undefined => {
    if (!req || typeof req !== 'object') return undefined;
    const r = req as Record<string, unknown>;
    if (typeof r.total !== 'number') return undefined;

    return {
      total: r.total,
      met: typeof r.met === 'number' ? r.met : 0,
      partial: typeof r.partial === 'number' ? r.partial : 0,
      missing: typeof r.missing === 'number' ? r.missing : 0,
      items: Array.isArray(r.items)
        ? r.items.map((item: unknown) => {
            const i = item && typeof item === 'object' ? item as Record<string, unknown> : {};
            const validStatuses = ['met', 'partial', 'missing'];
            return {
              requirement: String(i.requirement || ''),
              status: validStatuses.includes(String(i.status))
                ? (i.status as 'met' | 'partial' | 'missing')
                : 'missing',
              evidence: i.evidence ? String(i.evidence) : undefined,
              notes: i.notes ? String(i.notes) : undefined,
            };
          })
        : [],
    };
  };

  return {
    contextScore: clamp(raw.contextScore, 0, 100),
    contextEvidence: sanitizeContextEvidence(raw.contextEvidence),
    integrityScore: clamp(raw.integrityScore, 0, 100),
    integrityEvidence: sanitizeIntegrityEvidence(raw.integrityEvidence),
    detailsScore: clamp(raw.detailsScore, 0, 100),
    detailsEvidence: sanitizeDetailsEvidence(raw.detailsEvidence),
    insightScore: clamp(raw.insightScore, 0, 100),
    insightEvidence: sanitizeInsightEvidence(raw.insightEvidence),
    thirdPartySummary: String(raw.thirdPartySummary || 'Analysis not available.'),
    requirementsAnalysis: sanitizeRequirements(raw.requirementsAnalysis),
    gapAnalysis: sanitizeGapAnalysis(raw.gapAnalysis),
    improvements: sanitizeImprovements(raw.improvements),
    issues: sanitizeIssues(raw.issues),
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

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
        .eq("feature", "assignment_audit")
        .eq("period", currentPeriod)
        .single();

      if (usage && usage.count >= FREE_TIER_LIMITS.assignment_audit) {
        return NextResponse.json(
          {
            error: `Free tier limit reached (${FREE_TIER_LIMITS.assignment_audit}/month). Upgrade to Premium for more audits.`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    // Parse request body
    const body: AssignmentAuditInput = await request.json();
    const {
      assignmentName,
      assignmentType,
      subjectArea,
      wordCountTarget,
      dueDate,
      submissionContent,
      rubricContent,
      assignmentInstructions,
      previousAuditId,
    } = body;

    // Validate input
    if (!assignmentName || assignmentName.trim().length < 3) {
      return NextResponse.json(
        { error: "Assignment name must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!submissionContent || submissionContent.trim().length < 100) {
      return NextResponse.json(
        { error: "Submission content must be at least 100 characters" },
        { status: 400 }
      );
    }

    // Safety Mode: Check and filter content
    const combinedContent = [
      assignmentName,
      submissionContent,
      rubricContent || '',
      assignmentInstructions || '',
    ].join(' ');
    const safetyCheck = await checkAndFilterContent(user.id, combinedContent, "assignment_audit");

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

    // Calculate text statistics (pure logic, no AI)
    const stats = calculateTextStats(submissionContent);

    // Detect citations (pure logic, no AI)
    const citationsDetected = detectCitations(submissionContent);

    // Get previous audit for comparison if provided
    let previousScore: number | null = null;
    if (previousAuditId) {
      const { data: prevAudit } = await supabase
        .from("assignment_audits")
        .select("relevance_score")
        .eq("id", previousAuditId)
        .eq("user_id", user.id)
        .single();

      if (prevAudit) {
        previousScore = prevAudit.relevance_score;
      }
    }

    // Generate AI analysis with CIDI framework
    const messages = generateAssignmentAuditPrompt({
      submissionContent,
      assignmentType,
      rubricContent,
      assignmentInstructions,
      subjectArea,
      wordCountTarget,
    });

    const responseText = await generateWithGroq(messages, {
      temperature: 0.2, // Lower temperature for more consistent, factual responses
      maxTokens: 4096, // Need more tokens for comprehensive analysis
    });

    // Parse JSON response
    let aiAnalysis: Partial<AssignmentAuditResult>;
    try {
      // Extract JSON from markdown code blocks or raw response
      const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonText = codeBlockMatch?.[1] || responseText.match(/\{[\s\S]*\}/)?.[0];

      if (!jsonText) {
        throw new Error("No JSON found in response");
      }

      const rawJson = JSON.parse(jsonText);
      aiAnalysis = validateAndSanitizeAuditResponse(rawJson);
    } catch (parseError) {
      // Don't log full responseText as it may contain sensitive user content
      console.error("Failed to parse audit analysis:", parseError);
      return NextResponse.json(
        { error: "Failed to analyze assignment. Please try again." },
        { status: 500 }
      );
    }

    // Calculate overall relevance score
    const relevanceScore = calculateRelevanceScore({
      context: aiAnalysis.contextScore || 0,
      integrity: aiAnalysis.integrityScore || 0,
      details: aiAnalysis.detailsScore || 0,
      insight: aiAnalysis.insightScore || 0,
    });

    // Calculate score change if this is a re-audit
    const scoreChange = previousScore !== null ? relevanceScore - previousScore : null;

    const processingTime = Date.now() - startTime;

    // Save to database
    const { data: savedAudit, error: saveError } = await supabase
      .from("assignment_audits")
      .insert({
        user_id: user.id,
        assignment_name: assignmentName.trim(),
        assignment_type: assignmentType,
        subject_area: subjectArea || null,
        word_count_target: wordCountTarget || null,
        due_date: dueDate || null,
        submission_content: submissionContent,
        rubric_content: rubricContent || null,
        assignment_instructions: assignmentInstructions || null,
        context_score: aiAnalysis.contextScore,
        context_evidence: aiAnalysis.contextEvidence,
        integrity_score: aiAnalysis.integrityScore,
        integrity_evidence: aiAnalysis.integrityEvidence,
        details_score: aiAnalysis.detailsScore,
        details_evidence: aiAnalysis.detailsEvidence,
        insight_score: aiAnalysis.insightScore,
        insight_evidence: aiAnalysis.insightEvidence,
        relevance_score: relevanceScore,
        third_party_summary: aiAnalysis.thirdPartySummary,
        requirements_analysis: aiAnalysis.requirementsAnalysis || null,
        gap_analysis: aiAnalysis.gapAnalysis,
        improvements: aiAnalysis.improvements,
        word_count: stats.wordCount,
        paragraph_count: stats.paragraphCount,
        sentence_count: stats.sentenceCount,
        avg_sentence_length: stats.avgSentenceLength,
        reading_grade_level: stats.readingGradeLevel,
        citation_count: citationsDetected.length,
        citations_detected: citationsDetected,
        issues: aiAnalysis.issues,
        previous_audit_id: previousAuditId || null,
        score_change: scoreChange,
        processing_time_ms: processingTime,
        model_used: "llama-3.3-70b-versatile",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving audit:", saveError);
      // Continue even if save fails - return the analysis
    }

    // Update usage count
    const currentPeriod = new Date().toISOString().slice(0, 7);
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature: "assignment_audit",
      p_period: currentPeriod,
    });

    // Award XP for completing audit
    let xpResult: XPAwardResult | null = null;
    try {
      // Determine if this is a re-audit with improvement
      const isImprovement = scoreChange !== null && scoreChange >= 10;
      const action = isImprovement ? 'audit_improve' : 'audit_complete';

      xpResult = await awardXP(user.id, action, {
        description: isImprovement
          ? `Improved audit score by ${scoreChange} points!`
          : `Completed assignment audit: ${assignmentName}`,
        referenceType: 'audit',
        referenceId: savedAudit?.id,
        metadata: {
          assignmentName,
          assignmentType,
          relevanceScore,
          scoreChange,
        },
      });

      // Check for high score (90+ is exceptional)
      if (relevanceScore >= 90) {
        const highScoreResult = await updateHighScore(user.id, 'audit', relevanceScore);
        if (highScoreResult.isNewHighScore) {
          const bonusXP = await awardXP(user.id, 'high_score', {
            description: `New audit high score: ${relevanceScore}!`,
            referenceType: 'audit',
            referenceId: savedAudit?.id,
            checkBadges: false,
            updateStreak: false,
          });
          xpResult.xpAwarded += bonusXP.xpAwarded;
          xpResult.totalXP = bonusXP.totalXP;
        }
      }

      // Check for score-based badges (guard against division by zero)
      const requirementsPercentage = aiAnalysis.requirementsAnalysis && aiAnalysis.requirementsAnalysis.total > 0
        ? Math.round((aiAnalysis.requirementsAnalysis.met / aiAnalysis.requirementsAnalysis.total) * 100)
        : undefined;

      const additionalBadges = await checkAndAwardBadges(user.id, action, {
        referenceType: 'audit',
        referenceId: savedAudit?.id,
        score: relevanceScore,
        improvement: scoreChange ?? undefined,
        requirementsPercentage,
      });
      xpResult.newBadges.push(...additionalBadges);
    } catch (xpError) {
      console.error('Error awarding XP:', xpError);
      // Continue even if XP award fails
    }

    // Build complete response
    const result: AssignmentAuditResult = {
      contextScore: aiAnalysis.contextScore || 0,
      contextEvidence: aiAnalysis.contextEvidence || {
        strengths: [],
        gaps: [],
        citationsFound: 0,
        backgroundProvided: false,
        audienceClarity: false,
      },
      integrityScore: aiAnalysis.integrityScore || 0,
      integrityEvidence: aiAnalysis.integrityEvidence || {
        logicalFlow: false,
        contradictions: [],
        unsupportedClaims: [],
        transitionQuality: 'poor',
      },
      detailsScore: aiAnalysis.detailsScore || 0,
      detailsEvidence: aiAnalysis.detailsEvidence || {
        specificExamples: 0,
        vagueStatements: [],
        dataPoints: 0,
        concreteLanguage: false,
      },
      insightScore: aiAnalysis.insightScore || 0,
      insightEvidence: aiAnalysis.insightEvidence || {
        originalArguments: [],
        genericStatements: [],
        analysisDepth: 'shallow',
        criticalThinking: false,
        synthesisPresent: false,
      },
      relevanceScore,
      thirdPartySummary: aiAnalysis.thirdPartySummary || 'Analysis not available.',
      requirementsAnalysis: aiAnalysis.requirementsAnalysis,
      gapAnalysis: aiAnalysis.gapAnalysis || [],
      improvements: aiAnalysis.improvements || [],
      stats,
      citationCount: citationsDetected.length,
      citationsDetected,
      issues: aiAnalysis.issues || [],
      previousScore: previousScore ?? undefined,
      scoreChange: scoreChange ?? undefined,
    };

    return NextResponse.json({
      ...result,
      id: savedAudit?.id,
      processingTimeMs: processingTime,
      // Gamification data
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
    console.error("Assignment audit error:", error);
    return NextResponse.json(
      { error: "Failed to analyze assignment. Please try again." },
      { status: 500 }
    );
  }
}

// Get user's audit history
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
    const assignmentType = searchParams.get("type");

    let query = supabase
      .from("assignment_audits")
      .select(`
        id,
        assignment_name,
        assignment_type,
        subject_area,
        relevance_score,
        context_score,
        integrity_score,
        details_score,
        insight_score,
        word_count,
        score_change,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (assignmentType) {
      query = query.eq("assignment_type", assignmentType);
    }

    const { data: audits, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({ audits });
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit history" },
      { status: 500 }
    );
  }
}
