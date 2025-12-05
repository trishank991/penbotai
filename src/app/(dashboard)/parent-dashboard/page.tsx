"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SafetyFilterCategory, SafetyFilteringLevel, AgeTier } from "@/types";

interface ChildData {
  id: string;
  email: string;
  fullName: string | null;
  dateOfBirth: string | null;
  age: number | null;
  ageTier: AgeTier | null;
  safetySettings: {
    safetyModeEnabled: boolean;
    safetyModeLocked: boolean;
    filteringLevel: SafetyFilteringLevel;
  };
  timeLimits: {
    dailyLimit: number | null;
    weeklyLimit: number | null;
    dailyUsed: number;
    weeklyUsed: number;
    dailyExceeded: boolean;
    weeklyExceeded: boolean;
  };
  blockedCategories: Record<SafetyFilterCategory, number>;
  mentalHealthAlerts: number;
  hasUnacknowledgedAlerts: boolean;
  recentActivity: Array<{
    activity_type: string;
    feature: string | null;
    created_at: string;
  }>;
  accountCreated: string;
}

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/parent-dashboard");
      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChild = async () => {
    setLinkError(null);
    setLinkSuccess(null);

    try {
      const response = await fetch("/api/parent-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "link_with_code",
          linkCode: linkCode.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLinkError(data.error);
        return;
      }

      setLinkSuccess(data.message);
      setLinkCode("");
      fetchDashboardData();
    } catch (error) {
      setLinkError("Failed to link account. Please try again.");
    }
  };

  const updateSafetyMode = async (childId: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/parent-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_safety_mode",
          childId,
          safetyModeEnabled: enabled,
        }),
      });
      if (!response.ok) {
        console.error("Failed to update safety mode");
      }
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating safety mode:", error);
    }
  };

  const updateFilteringLevel = async (childId: string, level: SafetyFilteringLevel) => {
    try {
      const response = await fetch("/api/parent-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_filtering_level",
          childId,
          filteringLevel: level,
        }),
      });
      if (!response.ok) {
        console.error("Failed to update filtering level");
      }
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating filtering level:", error);
    }
  };

  const updateTimeLimits = async (
    childId: string,
    dailyMinutes: number | null,
    weeklyMinutes: number | null
  ) => {
    try {
      const response = await fetch("/api/parent-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_time_limits",
          childId,
          dailyTimeLimitMinutes: dailyMinutes,
          weeklyTimeLimitMinutes: weeklyMinutes,
        }),
      });
      if (!response.ok) {
        console.error("Failed to update time limits");
      }
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating time limits:", error);
    }
  };

  const getAgeTierBadge = (ageTier: AgeTier | null) => {
    if (!ageTier) return null;

    const badges: Record<AgeTier, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      under_13: { label: "Under 13", variant: "destructive" },
      "13_14": { label: "13-14", variant: "default" },
      "14_17": { label: "14-17", variant: "secondary" },
      adult: { label: "18+", variant: "outline" },
    };

    const badge = badges[ageTier];
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const getCategoryLabel = (category: SafetyFilterCategory): string => {
    const labels: Record<SafetyFilterCategory, string> = {
      self_harm: "Self-Harm",
      violence: "Violence",
      sexual_content: "Inappropriate Content",
      substance_abuse: "Substance Abuse",
      personal_info: "Personal Info Sharing",
      financial_scam: "Financial/Scams",
      illegal_activity: "Illegal Activities",
    };
    return labels[category];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Parent Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage your children's safety settings on PenBotAI.
        </p>
      </div>

      {/* Link Child Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Link a Child's Account</CardTitle>
          <CardDescription>
            Enter your child's 8-character link code to connect their account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter link code (e.g., ABC12DEF)"
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="max-w-xs font-mono uppercase"
            />
            <Button onClick={handleLinkChild} disabled={linkCode.length !== 8}>
              Link Account
            </Button>
          </div>
          {linkError && (
            <p className="text-sm text-red-500 mt-2">{linkError}</p>
          )}
          {linkSuccess && (
            <p className="text-sm text-green-600 mt-2">{linkSuccess}</p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Your child can find their link code in Settings → Parental Controls
          </p>
        </CardContent>
      </Card>

      {/* Children List */}
      {children.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-lg font-medium mb-2">No Linked Accounts</h3>
            <p className="text-muted-foreground mb-4">
              Enter your child's link code above to start monitoring their account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {children.map((child) => (
            <Card key={child.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                      {(child.fullName || child.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {child.fullName || child.email}
                        {getAgeTierBadge(child.ageTier)}
                        {child.hasUnacknowledgedAlerts && (
                          <Badge variant="destructive" className="animate-pulse">
                            Alert
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {child.email} • Age {child.age || "Unknown"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="safety">
                  <TabsList>
                    <TabsTrigger value="safety">Safety Settings</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="time">Time Limits</TabsTrigger>
                    {child.mentalHealthAlerts > 0 && (
                      <TabsTrigger value="alerts" className="text-red-500">
                        Alerts ({child.mentalHealthAlerts})
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="safety" className="space-y-6 pt-4">
                    {/* Safety Mode Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Safety Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Filter potentially harmful content from prompts
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {child.safetySettings.safetyModeLocked && (
                          <Badge variant="outline">Locked (Under 13)</Badge>
                        )}
                        <Switch
                          checked={child.safetySettings.safetyModeEnabled}
                          onCheckedChange={(checked) =>
                            updateSafetyMode(child.id, checked)
                          }
                          disabled={child.safetySettings.safetyModeLocked}
                        />
                      </div>
                    </div>

                    {/* Filtering Level */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Filtering Level</Label>
                        <p className="text-sm text-muted-foreground">
                          How strictly to filter content
                        </p>
                      </div>
                      <Select
                        value={child.safetySettings.filteringLevel}
                        onValueChange={(value: SafetyFilteringLevel) =>
                          updateFilteringLevel(child.id, value)
                        }
                        disabled={!child.safetySettings.safetyModeEnabled}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="strict">Strict</SelectItem>
                          <SelectItem value="maximum">Maximum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Blocked Categories Summary */}
                    <div>
                      <Label className="text-base mb-3 block">
                        Blocked Content This Week
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(child.blockedCategories).map(
                          ([category, count]) =>
                            count > 0 && (
                              <div
                                key={category}
                                className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
                              >
                                <div className="text-2xl font-bold text-red-600">
                                  {count}
                                </div>
                                <div className="text-sm text-red-700 dark:text-red-400">
                                  {getCategoryLabel(category as SafetyFilterCategory)}
                                </div>
                              </div>
                            )
                        )}
                        {Object.values(child.blockedCategories).every(
                          (c) => c === 0
                        ) && (
                          <div className="col-span-full text-center py-4 text-muted-foreground">
                            No blocked content this week
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="pt-4">
                    <div className="space-y-3">
                      {child.recentActivity.length > 0 ? (
                        child.recentActivity.map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">
                                {activity.activity_type === "prompt_blocked"
                                  ? "🚫"
                                  : activity.activity_type === "feature_used"
                                    ? "✅"
                                    : "📝"}
                              </span>
                              <div>
                                <div className="font-medium">
                                  {activity.activity_type.replace(/_/g, " ")}
                                </div>
                                {activity.feature && (
                                  <div className="text-sm text-muted-foreground">
                                    {activity.feature}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No recent activity
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="time" className="space-y-6 pt-4">
                    {/* Current Usage */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-lg border">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Today</span>
                          <span className="text-sm text-muted-foreground">
                            {child.timeLimits.dailyUsed} /{" "}
                            {child.timeLimits.dailyLimit || "∞"} min
                          </span>
                        </div>
                        {child.timeLimits.dailyLimit && (
                          <Progress
                            value={
                              (child.timeLimits.dailyUsed /
                                child.timeLimits.dailyLimit) *
                              100
                            }
                            className={
                              child.timeLimits.dailyExceeded ? "bg-red-200" : ""
                            }
                          />
                        )}
                      </div>
                      <div className="p-4 rounded-lg border">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">This Week</span>
                          <span className="text-sm text-muted-foreground">
                            {child.timeLimits.weeklyUsed} /{" "}
                            {child.timeLimits.weeklyLimit || "∞"} min
                          </span>
                        </div>
                        {child.timeLimits.weeklyLimit && (
                          <Progress
                            value={
                              (child.timeLimits.weeklyUsed /
                                child.timeLimits.weeklyLimit) *
                              100
                            }
                            className={
                              child.timeLimits.weeklyExceeded ? "bg-red-200" : ""
                            }
                          />
                        )}
                      </div>
                    </div>

                    {/* Set Limits */}
                    <TimeLimitEditor
                      dailyLimit={child.timeLimits.dailyLimit}
                      weeklyLimit={child.timeLimits.weeklyLimit}
                      onSave={(daily, weekly) =>
                        updateTimeLimits(child.id, daily, weekly)
                      }
                    />
                  </TabsContent>

                  {child.mentalHealthAlerts > 0 && (
                    <TabsContent value="alerts" className="pt-4">
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                          Mental Health Concerns Detected
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                          We've detected {child.mentalHealthAlerts} instance(s) where
                          your child may have searched for content related to mental
                          health concerns. This is not a diagnosis, but we recommend
                          having an open conversation with your child.
                        </p>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline">View Resources</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Mental Health Resources</DialogTitle>
                                <DialogDescription>
                                  If you or your child needs support, these resources
                                  are available 24/7.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                  <div className="font-medium">
                                    National Suicide Prevention Lifeline
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Call or text: 988
                                  </div>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                  <div className="font-medium">Crisis Text Line</div>
                                  <div className="text-sm text-muted-foreground">
                                    Text HOME to 741741
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            onClick={async () => {
                              // Acknowledge alerts
                              try {
                                const response = await fetch("/api/parent-dashboard", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    action: "acknowledge_alerts",
                                    childId: child.id,
                                  }),
                                });
                                if (response.ok) {
                                  fetchDashboardData();
                                }
                              } catch (error) {
                                console.error("Failed to acknowledge alerts:", error);
                              }
                            }}
                          >
                            I've Reviewed This
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Time Limit Editor Component
function TimeLimitEditor({
  dailyLimit,
  weeklyLimit,
  onSave,
}: {
  dailyLimit: number | null;
  weeklyLimit: number | null;
  onSave: (daily: number | null, weekly: number | null) => void;
}) {
  const [daily, setDaily] = useState(dailyLimit?.toString() || "");
  const [weekly, setWeekly] = useState(weeklyLimit?.toString() || "");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseTimeLimit = (value: string): number | null => {
    if (!value.trim()) return null;
    const parsed = parseInt(value, 10);
    // Return null for invalid values (NaN or negative)
    if (isNaN(parsed) || parsed < 0) return null;
    return parsed;
  };

  const handleSave = () => {
    const dailyValue = parseTimeLimit(daily);
    const weeklyValue = parseTimeLimit(weekly);

    // Validate: if a string was entered but parsed to null, show error
    if (daily.trim() && dailyValue === null) {
      setError("Daily limit must be a positive number");
      return;
    }
    if (weekly.trim() && weeklyValue === null) {
      setError("Weekly limit must be a positive number");
      return;
    }

    setError(null);
    onSave(dailyValue, weeklyValue);
    setEditing(false);
  };

  if (!editing) {
    return (
      <Button variant="outline" onClick={() => setEditing(true)}>
        {dailyLimit || weeklyLimit ? "Edit Time Limits" : "Set Time Limits"}
      </Button>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Daily Limit (minutes)</Label>
          <Input
            type="number"
            placeholder="No limit"
            value={daily}
            onChange={(e) => {
              setDaily(e.target.value);
              setError(null);
            }}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label>Weekly Limit (minutes)</Label>
          <Input
            type="number"
            placeholder="No limit"
            value={weekly}
            onChange={(e) => {
              setWeekly(e.target.value);
              setError(null);
            }}
            min={0}
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <div className="flex gap-2">
        <Button onClick={handleSave}>Save Limits</Button>
        <Button variant="outline" onClick={() => {
          setEditing(false);
          setError(null);
        }}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
