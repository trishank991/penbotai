'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Badge, BadgeCategory } from '@/types';

interface BadgeWithStatus extends Badge {
  earned: boolean;
  earnedAt: string | null;
}

interface BadgeGridProps {
  className?: string;
}

export function BadgeGrid({ className }: BadgeGridProps) {
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const response = await fetch('/api/gamification/badges');
        if (response.ok) {
          const data = await response.json();
          setBadges(data.badges);
          setEarnedCount(data.earnedCount);
        }
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const categories: { id: BadgeCategory; label: string; icon: string }[] = [
    { id: 'skill', label: 'Skill', icon: '🎯' },
    { id: 'streak', label: 'Streak', icon: '🔥' },
    { id: 'milestone', label: 'Milestone', icon: '🏆' },
    { id: 'special', label: 'Special', icon: '✨' },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">🏅 Badges</span>
          <span className="text-sm font-normal text-muted-foreground">
            {earnedCount} / {badges.length} earned
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="skill">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                {cat.icon} {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {badges
                  .filter((b) => b.category === cat.id)
                  .map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function BadgeCard({ badge }: { badge: BadgeWithStatus }) {
  return (
    <div
      className={cn(
        'relative p-3 rounded-lg border text-center transition-all',
        badge.earned
          ? 'bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800'
          : 'bg-muted/50 border-muted opacity-60 grayscale'
      )}
    >
      <div className="text-3xl mb-1">{badge.icon}</div>
      <div className="text-xs font-medium truncate">{badge.name}</div>
      <div className="text-[10px] text-muted-foreground line-clamp-2 h-7">{badge.description}</div>
      {badge.earned && badge.earnedAt && (
        <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
          {new Date(badge.earnedAt).toLocaleDateString()}
        </div>
      )}
      {badge.xp_reward > 0 && (
        <div className="absolute top-1 right-1 text-[10px] bg-background/80 px-1 rounded">
          +{badge.xp_reward} XP
        </div>
      )}
    </div>
  );
}
