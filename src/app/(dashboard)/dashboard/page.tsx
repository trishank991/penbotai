"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { FREE_TIER_LIMITS } from "@/types";
import { XPDisplay, DailyChallenges } from "@/components/gamification";

interface UsageData {
  prompt_coach: number;
  disclosure: number;
  grammar: number;
  research: number;
}

interface RecentActivity {
  type: "prompt" | "disclosure";
  title: string;
  date: string;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("");
  const [plan, setPlan] = useState<string>("free");
  const [usage, setUsage] = useState<UsageData>({
    prompt_coach: 0,
    disclosure: 0,
    grammar: 0,
    research: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Load profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, plan")
      .eq("id", user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name || user.email?.split("@")[0] || "there");
      setPlan(profile.plan);
    }

    // Load usage
    const currentPeriod = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase
      .from("usage")
      .select("feature, count")
      .eq("user_id", user.id)
      .eq("period", currentPeriod);

    if (usageData) {
      const usageMap: UsageData = {
        prompt_coach: 0,
        disclosure: 0,
        grammar: 0,
        research: 0,
      };
      usageData.forEach((item) => {
        if (item.feature in usageMap) {
          usageMap[item.feature as keyof UsageData] = item.count;
        }
      });
      setUsage(usageMap);
    }

    // Load recent activity
    const [promptsRes, disclosuresRes] = await Promise.all([
      supabase
        .from("prompts")
        .select("original_prompt, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("disclosures")
        .select("purpose, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    const activities: RecentActivity[] = [];

    promptsRes.data?.forEach((p) => {
      activities.push({
        type: "prompt",
        title: p.original_prompt.slice(0, 50) + (p.original_prompt.length > 50 ? "..." : ""),
        date: p.created_at,
      });
    });

    disclosuresRes.data?.forEach((d) => {
      activities.push({
        type: "disclosure",
        title: `Disclosure for ${d.purpose}`,
        date: d.created_at,
      });
    });

    // Sort by date and take top 5
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentActivity(activities.slice(0, 5));

    setLoading(false);
  };

  const isPremium = plan === "premium" || plan === "university";

  const getUsagePercent = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your account.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/disclosure">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <span className="text-3xl">📝</span>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">New Disclosure</CardTitle>
              <CardDescription>Generate AI usage statement</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/prompt-coach">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <span className="text-3xl">🎯</span>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Analyze Prompt</CardTitle>
              <CardDescription>Improve your AI prompts</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/research">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <span className="text-3xl">📚</span>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Research Papers</CardTitle>
              <CardDescription>Search academic sources</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/grammar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <span className="text-3xl">✍️</span>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Grammar Check</CardTitle>
              <CardDescription>Check your writing</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Gamification Section */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <XPDisplay />
        <DailyChallenges />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Usage This Month</CardTitle>
              <Badge variant={isPremium ? "default" : "secondary"}>
                {plan === "university" ? "University" : plan === "premium" ? "Premium" : "Free"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Prompt Analyses</span>
                <span className={usage.prompt_coach >= FREE_TIER_LIMITS.prompt_coach && !isPremium ? "text-red-500" : ""}>
                  {usage.prompt_coach} / {isPremium ? "∞" : FREE_TIER_LIMITS.prompt_coach}
                </span>
              </div>
              {!isPremium && (
                <Progress
                  value={getUsagePercent(usage.prompt_coach, FREE_TIER_LIMITS.prompt_coach)}
                  className="h-2"
                />
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Disclosures</span>
                <span className={usage.disclosure >= FREE_TIER_LIMITS.disclosure && !isPremium ? "text-red-500" : ""}>
                  {usage.disclosure} / {isPremium ? "∞" : FREE_TIER_LIMITS.disclosure}
                </span>
              </div>
              {!isPremium && (
                <Progress
                  value={getUsagePercent(usage.disclosure, FREE_TIER_LIMITS.disclosure)}
                  className="h-2"
                />
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Research Queries</span>
                <span className={usage.research >= FREE_TIER_LIMITS.research && !isPremium ? "text-red-500" : ""}>
                  {usage.research} / {isPremium ? "∞" : FREE_TIER_LIMITS.research}
                </span>
              </div>
              {!isPremium && (
                <Progress
                  value={getUsagePercent(usage.research, FREE_TIER_LIMITS.research)}
                  className="h-2"
                />
              )}
            </div>

            {!isPremium && (
              <Link href="/settings">
                <Button variant="outline" className="w-full mt-2">
                  Upgrade to Premium
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                  >
                    <span className="text-xl">
                      {activity.type === "prompt" ? "🎯" : "📝"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No activity yet</p>
                <p className="text-sm">Start by analyzing a prompt or generating a disclosure</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
