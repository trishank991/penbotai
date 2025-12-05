/**
 * Leaderboard API
 * GET: Fetch top users by XP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLeaderboard, getUserGamification } from '@/lib/gamification';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const rawLimit = parseInt(url.searchParams.get('limit') || '10', 10);
    const limit = isNaN(rawLimit) ? 10 : rawLimit;

    // Get leaderboard
    const leaderboard = await getLeaderboard(Math.min(limit, 100));

    // Get user's own rank and data
    const userGamification = await getUserGamification(user.id);

    // Find user's rank
    let userRank = leaderboard.findIndex((entry) => entry.user_id === user.id) + 1;

    // If user is not in top list, calculate their approximate rank
    if (userRank === 0 && userGamification) {
      const { count } = await supabase
        .from('user_gamification')
        .select('*', { count: 'exact', head: true })
        .gt('total_xp', userGamification.total_xp);

      userRank = (count || 0) + 1;
    }

    return NextResponse.json({
      leaderboard,
      userRank,
      userXP: userGamification?.total_xp || 0,
      userLevel: userGamification?.current_level || 1,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
