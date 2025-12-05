'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Badge, XPAwardResult } from '@/types';

interface XPNotificationProps {
  result: XPAwardResult | null;
  onDismiss?: () => void;
  autoHideMs?: number;
}

export function XPNotification({ result, onDismiss, autoHideMs = 5000 }: XPNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (result && result.xpAwarded > 0) {
      setVisible(true);
      setAnimating(true);

      let innerTimer: ReturnType<typeof setTimeout>;

      const hideTimer = setTimeout(() => {
        setAnimating(false);
        innerTimer = setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, 300);
      }, autoHideMs);

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(innerTimer);
      };
    }
  }, [result, autoHideMs, onDismiss]);

  if (!visible || !result) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 transition-all duration-300',
        animating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-xl p-4 min-w-[280px]">
        {/* XP Earned */}
        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl animate-bounce">✨</div>
          <div>
            <div className="text-2xl font-bold">+{result.xpAwarded} XP</div>
            <div className="text-sm text-purple-200">
              Total: {result.totalXP.toLocaleString()} XP
            </div>
          </div>
        </div>

        {/* Level Up */}
        {result.leveledUp && (
          <div className="bg-white/20 rounded-lg p-3 mb-2 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <div>
                <div className="font-bold">Level Up!</div>
                <div className="text-sm text-purple-200">
                  Level {result.previousLevel} → Level {result.newLevel}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Streak Update */}
        {result.streakUpdate && result.streakUpdate.currentStreak > 1 && (
          <div className="flex items-center gap-2 text-sm mb-2">
            <span>🔥</span>
            <span>
              {result.streakUpdate.currentStreak}-day streak
              {result.streakUpdate.bonusXP > 0 && (
                <span className="text-purple-200"> (+{result.streakUpdate.bonusXP} bonus)</span>
              )}
            </span>
          </div>
        )}

        {/* New Badges */}
        {result.newBadges.length > 0 && (
          <div className="border-t border-white/20 pt-2 mt-2">
            <div className="text-xs text-purple-200 mb-1">New Badge{result.newBadges.length > 1 ? 's' : ''}!</div>
            <div className="flex gap-2 flex-wrap">
              {result.newBadges.map((badge: Badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-sm"
                >
                  <span>{badge.icon}</span>
                  <span>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for managing XP notifications
export function useXPNotification() {
  const [result, setResult] = useState<XPAwardResult | null>(null);

  const showNotification = (xpResult: XPAwardResult) => {
    setResult(xpResult);
  };

  const hideNotification = () => {
    setResult(null);
  };

  return {
    result,
    showNotification,
    hideNotification,
    XPNotificationComponent: () => (
      <XPNotification result={result} onDismiss={hideNotification} />
    ),
  };
}
