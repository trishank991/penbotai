"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PricingCardProps {
  currentPlan?: string;
  onUpgrade?: () => void;
}

export function PricingCard({ currentPlan = "free", onUpgrade }: PricingCardProps) {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPremium = currentPlan === "premium" || currentPlan === "university";

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annual }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create checkout session:", data.error);
        alert("Failed to start checkout. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { name: "Prompt Coach", free: "5/month", premium: "Unlimited" },
    { name: "AI Disclosure Generator", free: "3/month", premium: "Unlimited" },
    { name: "Grammar Check", free: "10/month", premium: "Unlimited" },
    { name: "Research Assistant", free: "5/month", premium: "Unlimited" },
    { name: "Citation Verification", free: false, premium: true },
    { name: "Export to PDF", free: false, premium: true },
    { name: "Priority Support", free: false, premium: true },
  ];

  return (
    <div className="space-y-4">
      {/* Billing Toggle */}
      {!isPremium && (
        <div className="flex items-center justify-center gap-3">
          <Label htmlFor="billing-toggle" className={!annual ? "font-semibold" : "text-muted-foreground"}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={annual}
            onCheckedChange={setAnnual}
          />
          <Label htmlFor="billing-toggle" className={annual ? "font-semibold" : "text-muted-foreground"}>
            Annual
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 17%
            </Badge>
          </Label>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Free Plan */}
        <Card className={currentPlan === "free" ? "border-blue-500 border-2" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Free</CardTitle>
              {currentPlan === "free" && (
                <Badge>Current Plan</Badge>
              )}
            </div>
            <CardDescription>For students getting started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2 text-sm">
              {features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-2">
                  {feature.free ? (
                    <>
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      <span>{feature.name}</span>
                      {typeof feature.free === "string" && (
                        <span className="text-muted-foreground">({feature.free})</span>
                      )}
                    </>
                  ) : (
                    <>
                      <XIcon className="h-4 w-4 text-slate-300" />
                      <span className="text-muted-foreground">{feature.name}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              {currentPlan === "free" ? "Current Plan" : "Downgrade"}
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className={isPremium ? "border-blue-500 border-2" : "border-blue-200 bg-blue-50/50"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-600">Premium</CardTitle>
              {isPremium ? (
                <Badge>Current Plan</Badge>
              ) : (
                <Badge variant="secondary" className="bg-blue-100 text-blue-600">
                  Recommended
                </Badge>
              )}
            </div>
            <CardDescription>For serious students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <span className="text-4xl font-bold">${annual ? "4.17" : "5"}</span>
              <span className="text-muted-foreground">/month</span>
              {annual && (
                <p className="text-sm text-muted-foreground">Billed annually ($50/year)</p>
              )}
            </div>
            <ul className="space-y-2 text-sm">
              {features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  <span>{feature.name}</span>
                  {typeof feature.premium === "string" && (
                    <span className="text-blue-600 font-medium">({feature.premium})</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {isPremium ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Upgrade to Premium - $${annual ? "50/year" : "5/month"}`
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
