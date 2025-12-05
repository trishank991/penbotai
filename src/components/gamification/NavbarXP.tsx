'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavbarXPData {
  totalXP: number;
  level: number;
  streak: number;
}

export function NavbarXP({ className }: { className?: string }) {
  const [data, setData] = useState<NavbarXPData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/gamification');
        if (response.ok) {
          const result = await response.json();
          setData({
            totalXP: result.user.total_xp,
            level: result.user.current_level,
            streak: result.user.current_streak,
          });
        }
      } catch (error) {
        console.error('Error fetching XP:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-6 w-16 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Link
      href="/achievements"
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-900/50 dark:hover:to-indigo-900/50 transition-colors',
        className
      )}
    >
      <span className="text-sm">{getLevelEmoji(data.level)}</span>
      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
        {data.totalXP.toLocaleString()} XP
      </span>
      {data.streak > 0 && (
        <>
          <span className="text-muted-foreground">|</span>
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
            🔥 {data.streak}
          </span>
        </>
      )}
    </Link>
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
