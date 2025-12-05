"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { FREE_TIER_LIMITS, calculateAge, getAgeTier, type SafetyFilteringLevel } from "@/types";
import { PricingCard } from "@/components/pricing-card";
import { Switch } from "@/components/ui/switch";

// English variants for grammar checking
type EnglishVariant = 'en-US' | 'en-GB' | 'en-AU' | 'en-CA' | 'en-NZ' | 'en-ZA' | 'en-IN';

const ENGLISH_VARIANTS: Record<EnglishVariant, { name: string; flag: string }> = {
  'en-US': { name: 'American English', flag: '🇺🇸' },
  'en-GB': { name: 'British English', flag: '🇬🇧' },
  'en-AU': { name: 'Australian English', flag: '🇦🇺' },
  'en-CA': { name: 'Canadian English', flag: '🇨🇦' },
  'en-NZ': { name: 'New Zealand English', flag: '🇳🇿' },
  'en-ZA': { name: 'South African English', flag: '🇿🇦' },
  'en-IN': { name: 'Indian English', flag: '🇮🇳' },
};

interface Profile {
  full_name: string | null;
  email: string;
  university: string | null;
  plan: string;
  date_of_birth: string | null;
  safety_mode_enabled: boolean;
  safety_mode_locked: boolean;
  safety_filtering_level: SafetyFilteringLevel;
  parent_email: string | null;
  parent_user_id: string | null;
  parent_link_code: string | null;
  preferred_english_variant: EnglishVariant;
}

interface UsageData {
  prompt_coach: number;
  disclosure: number;
  grammar: number;
  research: number;
}

interface Subscription {
  status: string;
  current_period_end: string;
  plan: string;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageData>({
    prompt_coach: 0,
    disclosure: 0,
    grammar: 0,
    research: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  // Check for success/canceled from Stripe redirect
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      setMessage({ type: "success", text: "Successfully upgraded to Premium! Welcome aboard." });
      // Reload data to get updated plan
      loadData();
    } else if (canceled === "true") {
      setMessage({ type: "error", text: "Checkout was canceled. You can try again anytime." });
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile({
        full_name: profileData.full_name,
        email: profileData.email,
        university: profileData.university,
        plan: profileData.plan,
        date_of_birth: profileData.date_of_birth,
        safety_mode_enabled: profileData.safety_mode_enabled ?? false,
        safety_mode_locked: profileData.safety_mode_locked ?? false,
        safety_filtering_level: profileData.safety_filtering_level ?? 'standard',
        parent_email: profileData.parent_email,
        parent_user_id: profileData.parent_user_id,
        parent_link_code: profileData.parent_link_code,
        preferred_english_variant: profileData.preferred_english_variant ?? 'en-US',
      });
      setFullName(profileData.full_name || "");
      setUniversity(profileData.university || "");
    }

    // Load subscription details
    const { data: subData } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subData) {
      setSubscription({
        status: subData.status,
        current_period_end: subData.current_period_end,
        plan: subData.plan,
      });
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

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ type: "error", text: "Not authenticated" });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        university: university || null,
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: "Failed to save profile" });
    } else {
      setMessage({ type: "success", text: "Profile saved successfully" });
      setProfile((prev) =>
        prev ? { ...prev, full_name: fullName, university } : null
      );
    }

    setSaving(false);
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to open billing portal",
      });
    }
  };

  const isPremium = profile?.plan === "premium" || profile?.plan === "university";

  const getUsagePercent = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, subscription, and view your usage.
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Plan & Subscription Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Plan</CardTitle>
                <CardDescription>
                  {isPremium
                    ? "You have unlimited access to all features"
                    : "Free tier with monthly limits"}
                </CardDescription>
              </div>
              <Badge
                variant={isPremium ? "default" : "secondary"}
                className={isPremium ? "bg-blue-600" : ""}
              >
                {profile?.plan === "university"
                  ? "University"
                  : profile?.plan === "premium"
                  ? "Premium"
                  : "Free"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPremium && subscription && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Status</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    {subscription.status === "active" ? "Active" : subscription.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Next billing date</span>
                  <span className="font-medium">{formatDate(subscription.current_period_end)}</span>
                </div>
                <Separator className="my-2" />
                <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                  Manage Subscription
                </Button>
              </div>
            )}

            {!isPremium && (
              <>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  onClick={() => setShowPricing(!showPricing)}
                >
                  {showPricing ? "Hide Plans" : "Upgrade to Premium - $5/month"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Unlimited disclosures, analyses, and research queries
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pricing Card (expandable) */}
        {showPricing && !isPremium && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Plan</CardTitle>
              <CardDescription>
                Select the plan that works best for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingCard currentPlan={profile?.plan || "free"} />
            </CardContent>
          </Card>
        )}

        {/* Usage Card */}
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>
              {isPremium
                ? "Unlimited usage on your plan"
                : "Your free tier usage resets monthly"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Prompt Analyses</span>
                <span className={usage.prompt_coach >= FREE_TIER_LIMITS.prompt_coach && !isPremium ? "text-red-600 font-medium" : ""}>
                  {usage.prompt_coach} / {isPremium ? "Unlimited" : FREE_TIER_LIMITS.prompt_coach}
                </span>
              </div>
              {!isPremium && (
                <Progress
                  value={getUsagePercent(usage.prompt_coach, FREE_TIER_LIMITS.prompt_coach)}
                  className={`h-2 ${usage.prompt_coach >= FREE_TIER_LIMITS.prompt_coach ? "[&>div]:bg-red-500" : ""}`}
                />
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Disclosure Statements</span>
                <span className={usage.disclosure >= FREE_TIER_LIMITS.disclosure && !isPremium ? "text-red-600 font-medium" : ""}>
                  {usage.disclosure} / {isPremium ? "Unlimited" : FREE_TIER_LIMITS.disclosure}
                </span>
              </div>
              {!isPremium && (
                <Progress
                  value={getUsagePercent(usage.disclosure, FREE_TIER_LIMITS.disclosure)}
                  className={`h-2 ${usage.disclosure >= FREE_TIER_LIMITS.disclosure ? "[&>div]:bg-red-500" : ""}`}
                />
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Grammar Checks</span>
                <span className={usage.grammar >= FREE_TIER_LIMITS.grammar && !isPremium ? "text-red-600 font-medium" : ""}>
                  {usage.grammar} / {isPremium ? "Unlimited" : FREE_TIER_LIMITS.grammar}
                </span>
              </div>
              {!isPremium && (
                <Progress
                  value={getUsagePercent(usage.grammar, FREE_TIER_LIMITS.grammar)}
                  className={`h-2 ${usage.grammar >= FREE_TIER_LIMITS.grammar ? "[&>div]:bg-red-500" : ""}`}
                />
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Research Queries</span>
                <span className={usage.research >= FREE_TIER_LIMITS.research && !isPremium ? "text-red-600 font-medium" : ""}>
                  {usage.research} / {isPremium ? "Unlimited" : FREE_TIER_LIMITS.research}
                </span>
              </div>
              {!isPremium && (
                <Progress
                  value={getUsagePercent(usage.research, FREE_TIER_LIMITS.research)}
                  className={`h-2 ${usage.research >= FREE_TIER_LIMITS.research ? "[&>div]:bg-red-500" : ""}`}
                />
              )}
            </div>

            {!isPremium && (
              <p className="text-xs text-muted-foreground pt-2">
                Usage resets on the 1st of each month. Need more? <button onClick={() => setShowPricing(true)} className="text-blue-600 hover:underline">Upgrade to Premium</button>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">University (Optional)</Label>
              <Input
                id="university"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g., Stanford University"
              />
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Safety & Parental Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Safety & Parental Controls
              {profile?.safety_mode_enabled && (
                <Badge variant="default" className="bg-green-600">Active</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Manage safety settings and parental linking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Age Info */}
            {profile?.date_of_birth && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Your Age</p>
                  <p className="text-sm text-muted-foreground">
                    {calculateAge(profile.date_of_birth)} years old
                  </p>
                </div>
                <Badge variant="outline">
                  {getAgeTier(profile.date_of_birth) === 'under_13' ? 'Under 13' :
                   getAgeTier(profile.date_of_birth) === '13_14' ? '13-14' :
                   getAgeTier(profile.date_of_birth) === '14_17' ? '14-17' : '18+'}
                </Badge>
              </div>
            )}

            {/* Safety Mode Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Safety Mode</p>
                <p className="text-sm text-muted-foreground">
                  Filter potentially harmful content from your prompts
                </p>
              </div>
              <div className="flex items-center gap-2">
                {profile?.safety_mode_locked && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Locked
                  </Badge>
                )}
                <Switch
                  checked={profile?.safety_mode_enabled ?? false}
                  disabled={profile?.safety_mode_locked}
                  onCheckedChange={async (checked) => {
                    try {
                      const supabase = createClient();
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;

                      const { error } = await supabase
                        .from("profiles")
                        .update({ safety_mode_enabled: checked })
                        .eq("id", user.id);

                      if (error) {
                        setMessage({ type: "error", text: "Failed to update safety mode" });
                        return;
                      }

                      setProfile(prev => prev ? { ...prev, safety_mode_enabled: checked } : null);
                    } catch {
                      setMessage({ type: "error", text: "Network error. Please try again." });
                    }
                  }}
                />
              </div>
            </div>

            <Separator />

            {/* Parent Link Status */}
            <div>
              <p className="font-medium mb-2">Parent/Guardian Link</p>
              {profile?.parent_user_id ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    Linked to: <strong>{profile.parent_email}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Your parent can view your activity and adjust safety settings.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={async () => {
                      if (!confirm("Are you sure you want to unlink your parent account?")) return;

                      try {
                        const response = await fetch("/api/parent-link", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "unlink" }),
                        });

                        if (response.ok) {
                          loadData();
                          setMessage({ type: "success", text: "Parent account unlinked" });
                        } else {
                          setMessage({ type: "error", text: "Failed to unlink parent account" });
                        }
                      } catch {
                        setMessage({ type: "error", text: "Network error. Please try again." });
                      }
                    }}
                  >
                    Unlink Parent
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Share this code with your parent to link accounts:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-white border rounded font-mono text-lg tracking-wider">
                      {profile?.parent_link_code || "Loading..."}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (profile?.parent_link_code) {
                          await navigator.clipboard.writeText(profile.parent_link_code);
                          setMessage({ type: "success", text: "Code copied to clipboard!" });
                        }
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const response = await fetch("/api/parent-link", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "regenerate_code" }),
                        });

                        if (response.ok) {
                          const data = await response.json();
                          setProfile(prev => prev ? { ...prev, parent_link_code: data.linkCode } : null);
                          setMessage({ type: "success", text: "New code generated" });
                        }
                      }}
                    >
                      New Code
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your parent enters this code in their Parent Dashboard to connect.
                  </p>
                </div>
              )}
            </div>

            {/* Filtering Level Info */}
            {profile?.safety_mode_enabled && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Content Filtering Level</p>
                    <p className="text-sm text-muted-foreground">
                      Current: <strong className="capitalize">{profile.safety_filtering_level}</strong>
                    </p>
                  </div>
                  {profile.parent_user_id ? (
                    <Badge variant="outline">Managed by Parent</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Contact support to change
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Your Data</p>
                <p className="text-sm text-muted-foreground">
                  Download all your data (GDPR compliant)
                </p>
              </div>
              <Button variant="outline">Export</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive">Delete</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
