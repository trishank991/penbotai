/**
 * Gamification Service
 * Handles XP awarding, level progression, badge checking, and streak management
 */

import { createClient } from '@/lib/supabase/server';
import {
  XPAction,
  XP_REWARDS,
  Badge,
  UserGamification,
  XPTransaction,
  XPAwardResult,
  LevelDefinition,
  UserBadge,
  GamificationDashboard,
  DailyChallenge,
  UserChallengeProgress,
} from '@/types';

// Level XP thresholds (matches database)
const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
  4: 600,
  5: 1000,
  6: 1500,
  7: 2500,
  8: 4000,
  9: 6000,
  10: 10000,
};

/**
 * Calculate level from total XP
 */
export function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  for (let i = 10; i >= 1; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  return level;
}

/**
 * Get XP required to reach next level
 */
export function getXPToNextLevel(currentXP: number, currentLevel: number): number {
  if (currentLevel >= 10) return 0;
  return LEVEL_THRESHOLDS[currentLevel + 1] - currentXP;
}

/**
 * Get progress percentage to next level
 */
export function getProgressToNextLevel(currentXP: number, currentLevel: number): number {
  if (currentLevel >= 10) return 100;

  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel];
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel + 1];
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;

  return Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);
}

/**
 * Initialize gamification record for a user if not exists
 * Uses upsert to handle race conditions safely
 */
export async function initializeUserGamification(userId: string): Promise<UserGamification | null> {
  const supabase = await createClient();

  // Use upsert to handle race conditions - if record exists, just return it
  const { data, error } = await supabase
    .from('user_gamification')
    .upsert(
      { user_id: userId },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
    .select()
    .single();

  if (error) {
    // If upsert failed, try to fetch existing record
    const { data: existing } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) return existing as UserGamification;

    console.error('Error initializing gamification:', error);
    return null;
  }

  return data as UserGamification;
}

/**
 * Get user's gamification data
 */
export async function getUserGamification(userId: string): Promise<UserGamification | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // If not found, initialize
    if (error.code === 'PGRST116') {
      return initializeUserGamification(userId);
    }
    console.error('Error getting gamification:', error);
    return null;
  }

  return data as UserGamification;
}

/**
 * Award XP to a user for an action
 */
export async function awardXP(
  userId: string,
  action: XPAction,
  options?: {
    customXP?: number;
    description?: string;
    referenceType?: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
    checkBadges?: boolean;
    updateStreak?: boolean;
  }
): Promise<XPAwardResult> {
  const supabase = await createClient();

  // Get current gamification state
  let gamification = await getUserGamification(userId);
  if (!gamification) {
    gamification = await initializeUserGamification(userId);
  }

  if (!gamification) {
    throw new Error('Failed to initialize gamification');
  }

  const xpToAward = options?.customXP ?? XP_REWARDS[action];
  const previousLevel = gamification.current_level;
  const previousXP = gamification.total_xp;

  // Calculate new totals
  const newTotalXP = previousXP + xpToAward;
  const newLevel = calculateLevelFromXP(newTotalXP);
  const leveledUp = newLevel > previousLevel;

  // Build update object
  const updateData: Record<string, unknown> = {
    total_xp: newTotalXP,
    current_level: newLevel,
    updated_at: new Date().toISOString(),
  };

  // Update stats counters
  switch (action) {
    case 'prompt_analyze':
      updateData.total_prompts_analyzed = gamification.total_prompts_analyzed + 1;
      break;
    case 'disclosure_generate':
      updateData.total_disclosures_generated = gamification.total_disclosures_generated + 1;
      break;
    case 'audit_complete':
    case 'audit_improve':
      updateData.total_audits_completed = gamification.total_audits_completed + 1;
      break;
    case 'research_query':
      updateData.total_research_queries = gamification.total_research_queries + 1;
      break;
    case 'paper_save':
      updateData.total_papers_saved = gamification.total_papers_saved + 1;
      break;
    case 'grammar_check':
      updateData.total_grammar_checks = gamification.total_grammar_checks + 1;
      break;
  }

  // Update gamification record
  const { error: updateError } = await supabase
    .from('user_gamification')
    .update(updateData)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating gamification:', updateError);
    throw new Error('Failed to update gamification');
  }

  // Record XP transaction
  const { error: txError } = await supabase.from('xp_transactions').insert({
    user_id: userId,
    action,
    xp_amount: xpToAward,
    description: options?.description ?? `Earned ${xpToAward} XP for ${action}`,
    reference_type: options?.referenceType,
    reference_id: options?.referenceId,
    metadata: options?.metadata ?? {},
  });

  if (txError) {
    console.error('Error recording XP transaction:', txError);
  }

  // Update streak if requested (default true)
  let streakUpdate = null;
  if (options?.updateStreak !== false) {
    streakUpdate = await updateStreak(userId);

    // Award streak bonus XP if applicable
    if (streakUpdate && streakUpdate.bonusXP > 0) {
      await supabase
        .from('user_gamification')
        .update({ total_xp: newTotalXP + streakUpdate.bonusXP })
        .eq('user_id', userId);

      await supabase.from('xp_transactions').insert({
        user_id: userId,
        action: 'streak_bonus',
        xp_amount: streakUpdate.bonusXP,
        description: `${streakUpdate.currentStreak}-day streak bonus!`,
        metadata: { streak: streakUpdate.currentStreak },
      });
    }
  }

  // Check for new badges if requested (default true)
  const newBadges: Badge[] = [];
  if (options?.checkBadges !== false) {
    const earnedBadges = await checkAndAwardBadges(userId, action, {
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
    });
    newBadges.push(...earnedBadges);
  }

  return {
    xpAwarded: xpToAward + (streakUpdate?.bonusXP ?? 0),
    totalXP: newTotalXP + (streakUpdate?.bonusXP ?? 0),
    previousLevel,
    newLevel,
    leveledUp,
    newBadges,
    streakUpdate,
  };
}

/**
 * Update user's activity streak
 */
export async function updateStreak(
  userId: string
): Promise<{ currentStreak: number; streakBroken: boolean; bonusXP: number } | null> {
  const supabase = await createClient();

  // Call the database function
  const { data, error } = await supabase.rpc('update_user_streak', { p_user_id: userId });

  if (error) {
    console.error('Error updating streak:', error);
    return null;
  }

  if (data && data.length > 0) {
    return {
      currentStreak: data[0].new_streak,
      streakBroken: data[0].streak_broken,
      bonusXP: data[0].xp_bonus,
    };
  }

  return null;
}

/**
 * Check and award any badges the user has earned
 */
export async function checkAndAwardBadges(
  userId: string,
  triggerAction: XPAction,
  options?: {
    referenceType?: string;
    referenceId?: string;
    score?: number;
    improvement?: number;
    requirementsPercentage?: number;
  }
): Promise<Badge[]> {
  const supabase = await createClient();

  // Get user's current state
  const gamification = await getUserGamification(userId);
  if (!gamification) return [];

  // Get all badges
  const { data: allBadges } = await supabase.from('badges').select('*').order('sort_order');

  if (!allBadges) return [];

  // Get user's existing badges
  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedBadgeIds = new Set((existingBadges || []).map((b) => b.badge_id));
  const newlyEarned: Badge[] = [];

  for (const badge of allBadges) {
    // Skip if already earned
    if (earnedBadgeIds.has(badge.id)) continue;

    const condition = badge.unlock_condition as {
      action: string;
      count?: number;
      min_score?: number;
      min_improvement?: number;
      percentage?: number;
      days?: number;
      level?: number;
      amount?: number;
    };
    let earned = false;

    switch (condition.action) {
      case 'prompt_analyze':
        if (condition.count && gamification.total_prompts_analyzed >= condition.count) {
          earned = true;
        }
        break;

      case 'prompt_score':
        if (
          condition.min_score &&
          options?.score &&
          options.score >= condition.min_score &&
          triggerAction === 'prompt_analyze'
        ) {
          earned = true;
        }
        // Also check highest score
        if (condition.min_score && gamification.highest_prompt_score >= condition.min_score) {
          earned = true;
        }
        break;

      case 'disclosure_generate':
        if (condition.count && gamification.total_disclosures_generated >= condition.count) {
          earned = true;
        }
        break;

      case 'audit_complete':
        if (condition.count && gamification.total_audits_completed >= condition.count) {
          earned = true;
        }
        break;

      case 'audit_score':
        if (
          condition.min_score &&
          options?.score &&
          options.score >= condition.min_score &&
          (triggerAction === 'audit_complete' || triggerAction === 'audit_improve')
        ) {
          earned = true;
        }
        if (condition.min_score && gamification.highest_audit_score >= condition.min_score) {
          earned = true;
        }
        break;

      case 'audit_improve':
        if (
          condition.min_improvement &&
          options?.improvement &&
          options.improvement >= condition.min_improvement
        ) {
          earned = true;
        }
        break;

      case 'audit_requirements':
        if (
          condition.percentage &&
          options?.requirementsPercentage &&
          options.requirementsPercentage >= condition.percentage
        ) {
          earned = true;
        }
        break;

      case 'papers_saved':
        if (condition.count && gamification.total_papers_saved >= condition.count) {
          earned = true;
        }
        break;

      case 'grammar_check':
        if (condition.count && gamification.total_grammar_checks >= condition.count) {
          earned = true;
        }
        break;

      case 'streak':
        if (condition.days && gamification.current_streak >= condition.days) {
          earned = true;
        }
        break;

      case 'level_reach':
        if (condition.level && gamification.current_level >= condition.level) {
          earned = true;
        }
        break;

      case 'xp_total':
        if (condition.amount && gamification.total_xp >= condition.amount) {
          earned = true;
        }
        break;
    }

    if (earned) {
      // Award the badge
      const { error } = await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badge.id,
        trigger_reference_type: options?.referenceType,
        trigger_reference_id: options?.referenceId,
      });

      if (!error) {
        newlyEarned.push(badge as Badge);

        // Award badge XP atomically to prevent race conditions
        if (badge.xp_reward > 0) {
          // Use atomic increment RPC instead of stale value update
          await supabase.rpc('increment_user_xp', {
            p_user_id: userId,
            p_xp_amount: badge.xp_reward,
          });

          await supabase.from('xp_transactions').insert({
            user_id: userId,
            action: 'badge_earned',
            xp_amount: badge.xp_reward,
            description: `Earned badge: ${badge.name}`,
            reference_type: 'badge',
            reference_id: badge.id,
          });
        }
      }
    }
  }

  return newlyEarned;
}

/**
 * Update high score for a specific action type
 */
export async function updateHighScore(
  userId: string,
  scoreType: 'prompt' | 'audit',
  newScore: number
): Promise<{ isNewHighScore: boolean; previousHighScore: number }> {
  const supabase = await createClient();

  const gamification = await getUserGamification(userId);
  if (!gamification) {
    return { isNewHighScore: false, previousHighScore: 0 };
  }

  const field = scoreType === 'prompt' ? 'highest_prompt_score' : 'highest_audit_score';
  const previousHighScore =
    scoreType === 'prompt' ? gamification.highest_prompt_score : gamification.highest_audit_score;

  if (newScore > previousHighScore) {
    await supabase
      .from('user_gamification')
      .update({ [field]: newScore })
      .eq('user_id', userId);

    return { isNewHighScore: true, previousHighScore };
  }

  return { isNewHighScore: false, previousHighScore };
}

/**
 * Get user's badges with full badge data
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_badges')
    .select(
      `
      *,
      badge:badges(*)
    `
    )
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error getting user badges:', error);
    return [];
  }

  return data as UserBadge[];
}

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('badges').select('*').order('sort_order');

  if (error) {
    console.error('Error getting badges:', error);
    return [];
  }

  return data as Badge[];
}

/**
 * Get level definitions
 */
export async function getLevelDefinitions(): Promise<LevelDefinition[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('level_definitions').select('*').order('level');

  if (error) {
    console.error('Error getting level definitions:', error);
    return [];
  }

  return data as LevelDefinition[];
}

/**
 * Get today's daily challenges
 */
export async function getDailyChallenges(userId: string): Promise<
  Array<
    DailyChallenge & {
      progress: UserChallengeProgress | null;
    }
  >
> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Get today's challenges
  const { data: challenges } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('active_date', today);

  if (!challenges || challenges.length === 0) {
    return [];
  }

  // Get user's progress
  const challengeIds = challenges.map((c) => c.id);
  const { data: progress } = await supabase
    .from('user_challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .in('challenge_id', challengeIds);

  const progressMap = new Map((progress || []).map((p) => [p.challenge_id, p]));

  return challenges.map((c) => ({
    ...(c as DailyChallenge),
    progress: (progressMap.get(c.id) as UserChallengeProgress) || null,
  }));
}

/**
 * Update daily challenge progress
 */
export async function updateChallengeProgress(
  userId: string,
  action: string
): Promise<{ completed: DailyChallenge | null; xpAwarded: number }> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Find matching challenge
  const { data: challenges } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('active_date', today)
    .eq('target_action', action);

  if (!challenges || challenges.length === 0) {
    return { completed: null, xpAwarded: 0 };
  }

  for (const challenge of challenges) {
    // Get or create progress
    const { data: existing } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challenge.id)
      .single();

    if (existing?.completed) continue;

    const newCount = (existing?.current_count || 0) + 1;
    const completed = newCount >= challenge.target_count;

    if (existing) {
      await supabase
        .from('user_challenge_progress')
        .update({
          current_count: newCount,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('user_challenge_progress').insert({
        user_id: userId,
        challenge_id: challenge.id,
        current_count: newCount,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      });
    }

    if (completed) {
      // Award challenge XP
      await awardXP(userId, 'daily_challenge', {
        customXP: challenge.xp_reward,
        description: `Completed daily challenge: ${challenge.title}`,
        referenceType: 'challenge',
        referenceId: challenge.id,
        checkBadges: false,
        updateStreak: false,
      });

      return { completed: challenge as DailyChallenge, xpAwarded: challenge.xp_reward };
    }
  }

  return { completed: null, xpAwarded: 0 };
}

/**
 * Get full gamification dashboard data
 */
export async function getGamificationDashboard(userId: string): Promise<GamificationDashboard | null> {
  const supabase = await createClient();

  // Initialize if needed
  let gamification = await getUserGamification(userId);
  if (!gamification) {
    gamification = await initializeUserGamification(userId);
  }
  if (!gamification) return null;

  // Get level definitions
  const levels = await getLevelDefinitions();
  const currentLevel = levels.find((l) => l.level === gamification!.current_level) || levels[0];
  const nextLevel = levels.find((l) => l.level === gamification!.current_level + 1) || null;

  // Get recent badges
  const allUserBadges = await getUserBadges(userId);
  const recentBadges = allUserBadges.slice(0, 5);

  // Get daily challenges
  const dailyChallenges = await getDailyChallenges(userId);

  // Get recent XP transactions
  const { data: recentXP } = await supabase
    .from('xp_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    user: gamification,
    currentLevel,
    nextLevel,
    xpToNextLevel: getXPToNextLevel(gamification.total_xp, gamification.current_level),
    progressToNextLevel: getProgressToNextLevel(gamification.total_xp, gamification.current_level),
    recentBadges,
    totalBadges: allUserBadges.length,
    dailyChallenges,
    recentXP: (recentXP || []) as XPTransaction[],
  };
}

/**
 * Get leaderboard (top users by XP)
 */
export async function getLeaderboard(
  limit: number = 10
): Promise<Array<{ rank: number; user_id: string; total_xp: number; current_level: number }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_gamification')
    .select('user_id, total_xp, current_level')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }

  return (data || []).map((item, index) => ({
    rank: index + 1,
    ...item,
  }));
}
