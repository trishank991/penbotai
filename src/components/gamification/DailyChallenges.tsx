'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DailyChallenge, UserChallengeProgress } from '@/types';

interface DailyChallengesProps {
  className?: string;
}

type ChallengeWithProgress = DailyChallenge & { progress: UserChallengeProgress | null };

export function DailyChallenges({ className }: DailyChallengesProps) {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const response = await fetch('/api/gamification');
        if (response.ok) {
          const data = await response.json();
          setChallenges(data.dailyChallenges || []);
        }
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchChallenges();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Daily Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <div className="text-4xl mb-2">🎯</div>
            <p>No challenges available today.</p>
            <p className="text-sm">Check back tomorrow!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📋 Daily Challenges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge) => {
          const progress = challenge.progress?.current_count || 0;
          const percentage = Math.min((progress / challenge.target_count) * 100, 100);
          const isComplete = challenge.progress?.completed || false;

          return (
            <div
              key={challenge.id}
              className={cn(
                'p-3 rounded-lg border transition-all',
                isComplete
                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                  : 'bg-muted/50'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {isComplete ? '✅' : '🎯'} {challenge.title}
                  </div>
                  <div className="text-sm text-muted-foreground">{challenge.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    +{challenge.xp_reward} XP
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Progress value={percentage} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">
                  {progress} / {challenge.target_count}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
