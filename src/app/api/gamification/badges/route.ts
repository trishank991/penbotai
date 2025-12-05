/**
 * Badges API
 * GET: Fetch all badges with user's earned status
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllBadges, getUserBadges } from '@/lib/gamification';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all badges and user's earned badges
    const [allBadges, userBadges] = await Promise.all([
      getAllBadges(),
      getUserBadges(user.id),
    ]);

    const earnedBadgeIds = new Set(userBadges.map((b) => b.badge_id));

    // Combine into a single list with earned status
    const badgesWithStatus = allBadges.map((badge) => ({
      ...badge,
      earned: earnedBadgeIds.has(badge.id),
      earnedAt: userBadges.find((ub) => ub.badge_id === badge.id)?.earned_at || null,
    }));

    // Group by category
    const grouped = {
      skill: badgesWithStatus.filter((b) => b.category === 'skill'),
      streak: badgesWithStatus.filter((b) => b.category === 'streak'),
      milestone: badgesWithStatus.filter((b) => b.category === 'milestone'),
      special: badgesWithStatus.filter((b) => b.category === 'special'),
    };

    return NextResponse.json({
      badges: badgesWithStatus,
      grouped,
      totalBadges: allBadges.length,
      earnedCount: userBadges.length,
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
