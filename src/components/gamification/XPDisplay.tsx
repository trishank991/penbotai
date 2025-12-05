'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { GamificationDashboard } from '@/types';

interface XPDisplayProps {
  compact?: boolean;
  className?: string;
}

export function XPDisplay({ compact = false, className }: XPDisplayProps) {
  const [data, setData] = useState<GamificationDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/gamification');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching gamification data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-20 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">✨</span>
          <span className="font-bold text-sm">{data.user.total_xp.toLocaleString()} XP</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{getLevelEmoji(data.currentLevel.level)}</span>
          <span className="text-sm text-muted-foreground">Lvl {data.currentLevel.level}</span>
        </div>
        {data.user.current_streak > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1">
              <span className="text-lg">🔥</span>
              <span className="text-sm text-orange-500 font-medium">{data.user.current_streak}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getLevelEmoji(data.currentLevel.level)} Level {data.currentLevel.level}
          </span>
          <span className="text-sm font-normal text-muted-foreground">{data.currentLevel.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">✨ {data.user.total_xp.toLocaleString()} XP</span>
            {data.nextLevel && (
              <span className="text-muted-foreground">
                {data.xpToNextLevel.toLocaleString()} to Level {data.nextLevel.level}
              </span>
            )}
          </div>
          <Progress value={data.progressToNextLevel} className="h-2" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.user.current_streak}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              🔥 Day Streak
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.totalBadges}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              🏅 Badges
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.user.longest_streak}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              👑 Best Streak
            </div>
          </div>
        </div>

        {/* Recent Badges */}
        {data.recentBadges.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">Recent Badges</div>
            <div className="flex gap-2 flex-wrap">
              {data.recentBadges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs"
                  title={userBadge.badge?.description}
                >
                  <span>{userBadge.badge?.icon}</span>
                  <span>{userBadge.badge?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getLevelEmoji(level: number): string {
  const emojis: Record<number, string> = {
    1: '🌱',
    2: '🌿',
    3: '🌳',
    4: '⭐',
    5: '🌟',
    6: '💫',
    7: '🏆',
    8: '👑',
    9: '💎',
    10: '🏅',
  };
  return emojis[level] || '🌱';
}
