/**
 * Gamification API
 * GET: Fetch user's gamification dashboard
 * POST: Award XP for an action (internal use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getGamificationDashboard,
  awardXP,
  checkAndAwardBadges,
  updateHighScore,
  updateChallengeProgress,
} from '@/lib/gamification';
import { XPAction } from '@/types';

// GET: Fetch gamification dashboard
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboard = await getGamificationDashboard(user.id);

    if (!dashboard) {
      return NextResponse.json({ error: 'Failed to load gamification data' }, { status: 500 });
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Error fetching gamification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Award XP (internal API, also used by other routes)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action,
      customXP,
      description,
      referenceType,
      referenceId,
      metadata,
      score,
      improvement,
      requirementsPercentage,
    } = body;

    // Validate action
    const validActions: XPAction[] = [
      'prompt_analyze',
      'disclosure_generate',
      'audit_complete',
      'audit_improve',
      'research_query',
      'paper_save',
      'grammar_check',
      'daily_challenge',
      'high_score',
      'certification_module',
      'streak_bonus',
      'badge_earned',
    ];

    if (!action || !validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Award XP
    const result = await awardXP(user.id, action, {
      customXP,
      description,
      referenceType,
      referenceId,
      metadata,
    });

    // Update daily challenge progress
    const challengeResult = await updateChallengeProgress(user.id, action);
    if (challengeResult.completed) {
      result.xpAwarded += challengeResult.xpAwarded;
      result.totalXP += challengeResult.xpAwarded;
    }

    // Check for score-based badges
    if (score !== undefined) {
      const scoreType = action === 'prompt_analyze' ? 'prompt' : 'audit';
      const highScoreResult = await updateHighScore(user.id, scoreType, score);

      if (highScoreResult.isNewHighScore) {
        // Award high score XP
        const highScoreXP = await awardXP(user.id, 'high_score', {
          description: `New ${scoreType} high score: ${score}!`,
          referenceType,
          referenceId,
          checkBadges: false,
          updateStreak: false,
        });
        result.xpAwarded += highScoreXP.xpAwarded;
        result.totalXP = highScoreXP.totalXP;
      }

      // Check for score-based badges
      const scoreBadges = await checkAndAwardBadges(user.id, action, {
        referenceType,
        referenceId,
        score,
        improvement,
        requirementsPercentage,
      });
      result.newBadges.push(...scoreBadges);
    }

    return NextResponse.json({
      success: true,
      ...result,
      challengeCompleted: challengeResult.completed,
    });
  } catch (error) {
    console.error('Error awarding XP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
