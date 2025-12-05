"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XPDisplay, BadgeGrid, DailyChallenges } from "@/components/gamification";
import type { GamificationDashboard, XPTransaction } from "@/types";

export default function AchievementsPage() {
  const [data, setData] = useState<GamificationDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/gamification");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          setError("Failed to load achievements data");
        }
      } catch (err) {
        console.error("Error fetching gamification data:", err);
        setError("Failed to load achievements data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">😔</div>
            <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-muted-foreground">
          Track your progress, earn XP, and unlock badges as you master AI transparency.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <StatCard
          icon="✨"
          label="Total XP"
          value={data?.user.total_xp.toLocaleString() || "0"}
          subtext={`Level ${data?.currentLevel.level || 1}`}
        />
        <StatCard
          icon="🔥"
          label="Current Streak"
          value={`${data?.user.current_streak || 0} days`}
          subtext={`Best: ${data?.user.longest_streak || 0} days`}
        />
        <StatCard
          icon="🏅"
          label="Badges Earned"
          value={`${data?.totalBadges || 0}`}
          subtext="Keep going!"
        />
        <StatCard
          icon="🎯"
          label="High Score"
          value={`${Math.max(data?.user.highest_prompt_score || 0, data?.user.highest_audit_score || 0)}`}
          subtext="Prompt or Audit"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="history">XP History</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <XPDisplay />
            <DailyChallenges />
          </div>

          {/* Level Progress */}
          {data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getLevelEmoji(data.currentLevel.level)} Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        Level {data.currentLevel.level}: {data.currentLevel.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {data.currentLevel.unlock_description}
                      </div>
                    </div>
                    {data.nextLevel && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Next Level</div>
                        <div className="font-medium">
                          Level {data.nextLevel.level}: {data.nextLevel.title}
                        </div>
                      </div>
                    )}
                  </div>
                  <Progress value={data.progressToNextLevel} className="h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{data.user.total_xp.toLocaleString()} XP</span>
                    {data.nextLevel && (
                      <span>{data.xpToNextLevel.toLocaleString()} XP to next level</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="badges">
          <BadgeGrid />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent XP Earned</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.recentXP && data.recentXP.length > 0 ? (
                <div className="space-y-3">
                  {data.recentXP.map((tx: XPTransaction) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getActionIcon(tx.action)}</span>
                        <div>
                          <div className="font-medium">{tx.description || tx.action}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 dark:text-green-400">
                          +{tx.xp_amount} XP
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No XP earned yet</p>
                  <p className="text-sm">Start using features to earn XP!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow
                  icon="🎯"
                  label="Prompts Analyzed"
                  value={data?.user.total_prompts_analyzed || 0}
                />
                <StatRow
                  icon="📝"
                  label="Disclosures Generated"
                  value={data?.user.total_disclosures_generated || 0}
                />
                <StatRow
                  icon="🔍"
                  label="Audits Completed"
                  value={data?.user.total_audits_completed || 0}
                />
                <StatRow
                  icon="📚"
                  label="Research Queries"
                  value={data?.user.total_research_queries || 0}
                />
                <StatRow
                  icon="📄"
                  label="Papers Saved"
                  value={data?.user.total_papers_saved || 0}
                />
                <StatRow
                  icon="✍️"
                  label="Grammar Checks"
                  value={data?.user.total_grammar_checks || 0}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>High Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                  <div className="text-4xl mb-2">🎯</div>
                  <div className="text-3xl font-bold">
                    {data?.user.highest_prompt_score || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Best Prompt Score
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30">
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="text-3xl font-bold">
                    {data?.user.highest_audit_score || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Best Audit Score
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: string;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{subtext}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-bold">{value.toLocaleString()}</span>
    </div>
  );
}

function getLevelEmoji(level: number): string {
  const emojis: Record<number, string> = {
    1: "🌱",
    2: "🌿",
    3: "🌳",
    4: "⭐",
    5: "🌟",
    6: "💫",
    7: "🏆",
    8: "👑",
    9: "💎",
    10: "🏅",
  };
  return emojis[level] || "🌱";
}

function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    prompt_analyze: "🎯",
    disclosure_generate: "📝",
    audit_complete: "🔍",
    audit_improve: "📈",
    research_query: "📚",
    paper_save: "📄",
    grammar_check: "✍️",
    daily_challenge: "🎮",
    high_score: "🏆",
    streak_bonus: "🔥",
    badge_earned: "🏅",
  };
  return icons[action] || "✨";
}
