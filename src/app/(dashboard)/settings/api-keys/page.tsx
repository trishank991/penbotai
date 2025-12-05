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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { ApiKey } from "@/types";

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fetchApiKeys();
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

      setIsPremium(
        profile?.plan === "premium" || profile?.plan === "university"
      );
    }
  };

  const fetchApiKeys = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setApiKeys(data as ApiKey[]);
    }
    setLoading(false);
  };

  const generateApiKey = (): string => {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const base64 = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return `sk_live_${base64}`;
  };

  const hashApiKey = async (key: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;

    setCreating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCreating(false);
      return;
    }

    const key = generateApiKey();
    const keyHash = await hashApiKey(key);
    const keyPrefix = key.substring(0, 12);

    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        name: newKeyName,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: ["disclosure:read", "disclosure:write", "prompt:read", "prompt:write"],
        rate_limit: 100,
      })
      .select()
      .single();

    if (!error && data) {
      setApiKeys([data as ApiKey, ...apiKeys]);
      setNewKey(key);
      setNewKeyName("");
    }

    setCreating(false);
  };

  const deleteApiKey = async (id: string) => {
    const supabase = createClient();
    await supabase.from("api_keys").delete().eq("id", id);
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const toggleApiKey = async (id: string, isActive: boolean) => {
    const supabase = createClient();
    await supabase.from("api_keys").update({ is_active: !isActive }).eq("id", id);
    setApiKeys(
      apiKeys.map((k) => (k.id === id ? { ...k, is_active: !isActive } : k))
    );
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

  if (!isPremium) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>API Access</CardTitle>
            <CardDescription>
              Integrate PenBotAI with your applications
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              API access is available on Premium and University plans.
            </p>
            <Button onClick={() => (window.location.href = "/pricing")}>
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for programmatic access to PenBotAI.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Give your API key a name to help you remember what it&apos;s used
                for.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production App, Development"
                />
              </div>
              <Button
                onClick={createApiKey}
                disabled={creating || !newKeyName.trim()}
                className="w-full"
              >
                {creating ? "Creating..." : "Create Key"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Show newly created key */}
      {newKey && (
        <Card className="mb-6 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">
              API Key Created Successfully
            </CardTitle>
            <CardDescription className="text-green-700">
              Make sure to copy your API key now. You won&apos;t be able to see it
              again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={newKey} readOnly className="font-mono text-sm" />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(newKey);
                }}
              >
                Copy
              </Button>
            </div>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setNewKey(null)}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys list */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Keys are used to authenticate API requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No API keys yet. Create one to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{key.name}</p>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {key.key_prefix}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created{" "}
                      {new Date(key.created_at).toLocaleDateString()}
                      {key.last_used_at && (
                        <>
                          {" "}
                          • Last used{" "}
                          {new Date(key.last_used_at).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleApiKey(key.id, key.is_active)}
                    >
                      {key.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => deleteApiKey(key.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Base URL</h4>
            <code className="bg-slate-100 px-2 py-1 rounded text-sm">
              https://api.penbotai.com/v1
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the Authorization header:
            </p>
            <pre className="bg-slate-100 p-3 rounded text-sm overflow-x-auto">
              {`Authorization: Bearer sk_live_your_api_key`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Example: Generate Disclosure</h4>
            <pre className="bg-slate-100 p-3 rounded text-sm overflow-x-auto">
              {`curl -X POST https://api.penbotai.com/v1/disclosure \\
  -H "Authorization: Bearer sk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "aiTools": ["ChatGPT"],
    "purpose": "Research assistance",
    "description": "Used for brainstorming",
    "outputUsage": "Revised and rewritten",
    "template": "apa"
  }'`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Rate Limits</h4>
            <p className="text-sm text-muted-foreground">
              API requests are limited to {apiKeys[0]?.rate_limit || 100}{" "}
              requests per hour per key.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Available Endpoints</h4>
            <ul className="text-sm space-y-1">
              <li>
                <code className="bg-slate-100 px-1 rounded">
                  POST /v1/disclosure
                </code>{" "}
                - Generate AI disclosure
              </li>
              <li>
                <code className="bg-slate-100 px-1 rounded">
                  POST /v1/prompt-coach
                </code>{" "}
                - Analyze prompt quality
              </li>
              <li>
                <code className="bg-slate-100 px-1 rounded">
                  GET /v1/library
                </code>{" "}
                - Get saved papers
              </li>
              <li>
                <code className="bg-slate-100 px-1 rounded">
                  POST /v1/library
                </code>{" "}
                - Save a paper
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
