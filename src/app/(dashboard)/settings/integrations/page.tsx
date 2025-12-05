"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { LMSIntegration } from "@/types";

const LMS_PROVIDERS = [
  {
    id: "canvas",
    name: "Canvas LMS",
    description: "Instructure Canvas integration",
    icon: "🎨",
    docsUrl: "https://canvas.instructure.com/doc/api/",
  },
  {
    id: "blackboard",
    name: "Blackboard",
    description: "Blackboard Learn integration",
    icon: "📋",
    docsUrl: "https://developer.blackboard.com/",
  },
  {
    id: "moodle",
    name: "Moodle",
    description: "Moodle LMS integration",
    icon: "🎓",
    docsUrl: "https://docs.moodle.org/dev/",
  },
  {
    id: "google_classroom",
    name: "Google Classroom",
    description: "Google Classroom integration",
    icon: "📚",
    docsUrl: "https://developers.google.com/classroom",
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<LMSIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [configuringProvider, setConfiguringProvider] = useState<string | null>(
    null
  );
  const [providerUrl, setProviderUrl] = useState("");

  useEffect(() => {
    fetchIntegrations();
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      // LMS integration is enterprise only
      setIsPremium(profile?.plan === "university");
    }
  };

  const fetchIntegrations = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("lms_integrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setIntegrations(data as LMSIntegration[]);
    }
    setLoading(false);
  };

  const connectLMS = async (provider: string) => {
    if (!providerUrl.trim()) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // For Canvas, initiate OAuth flow
    if (provider === "canvas") {
      // In production, this would redirect to Canvas OAuth
      const { data, error } = await supabase
        .from("lms_integrations")
        .insert({
          user_id: user.id,
          provider,
          provider_url: providerUrl,
          settings: {},
          is_active: false, // Will be activated after OAuth
        })
        .select()
        .single();

      if (!error && data) {
        setIntegrations([data as LMSIntegration, ...integrations]);
        // In production: window.location.href = `${providerUrl}/login/oauth2/auth?...`
        alert(
          "Integration saved. In production, you would be redirected to Canvas to authorize the connection."
        );
      }
    }

    setConfiguringProvider(null);
    setProviderUrl("");
  };

  const toggleIntegration = async (id: string, isActive: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("lms_integrations")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      console.error("Error toggling integration:", error);
      return;
    }

    setIntegrations(
      integrations.map((i) =>
        i.id === id ? { ...i, is_active: !isActive } : i
      )
    );
  };

  const deleteIntegration = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("lms_integrations").delete().eq("id", id);
    if (error) {
      console.error("Error deleting integration:", error);
      return;
    }
    setIntegrations(integrations.filter((i) => i.id !== id));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LMS Integrations</h1>
        <p className="text-muted-foreground">
          Connect PenBotAI with your Learning Management System.
        </p>
      </div>

      {!isPremium && (
        <Card className="mb-6 border-amber-500 bg-amber-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🔒</span>
              <div>
                <p className="font-medium">Enterprise Feature</p>
                <p className="text-sm text-muted-foreground">
                  LMS integrations are available on Enterprise plans. Contact
                  sales to upgrade your institution.
                </p>
              </div>
              <Button
                variant="outline"
                className="ml-auto"
                onClick={() =>
                  (window.location.href = "mailto:sales@penbotai.com")
                }
              >
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connected Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrations.map((integration) => {
                const provider = LMS_PROVIDERS.find(
                  (p) => p.id === integration.provider
                );
                return (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{provider?.icon}</span>
                      <div>
                        <p className="font-medium">{provider?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {integration.provider_url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.is_active}
                          onCheckedChange={() =>
                            toggleIntegration(
                              integration.id,
                              integration.is_active
                            )
                          }
                          disabled={!isPremium}
                        />
                        <Badge
                          variant={
                            integration.is_active ? "default" : "secondary"
                          }
                        >
                          {integration.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => deleteIntegration(integration.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>
            Connect PenBotAI to your institution&apos;s LMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {LMS_PROVIDERS.map((provider) => {
              const isConnected = integrations.some(
                (i) => i.provider === provider.id
              );
              return (
                <div key={provider.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {provider.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {isConnected ? (
                      <Badge variant="secondary">Connected</Badge>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isPremium}
                            onClick={() => setConfiguringProvider(provider.id)}
                          >
                            Connect
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Connect {provider.name}</DialogTitle>
                            <DialogDescription>
                              Enter your institution&apos;s {provider.name} URL
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label>LMS URL</Label>
                              <Input
                                value={providerUrl}
                                onChange={(e) => setProviderUrl(e.target.value)}
                                placeholder={`https://your-institution.${
                                  provider.id === "canvas"
                                    ? "instructure.com"
                                    : provider.id === "blackboard"
                                    ? "blackboard.com"
                                    : "example.com"
                                }`}
                              />
                            </div>
                            <Button
                              onClick={() => connectLMS(provider.id)}
                              disabled={!providerUrl.trim()}
                              className="w-full"
                            >
                              Connect
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(provider.docsUrl, "_blank")}
                    >
                      Docs
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Integration Features */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>What You Can Do</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Auto-attach Disclosures</h4>
              <p className="text-sm text-muted-foreground">
                Automatically append AI disclosure statements to assignment
                submissions.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Assignment Templates</h4>
              <p className="text-sm text-muted-foreground">
                Create disclosure templates for specific courses or assignments.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Usage Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Track AI disclosure patterns across your institution.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Grade Integration</h4>
              <p className="text-sm text-muted-foreground">
                View disclosure completeness in gradebook (coming soon).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
