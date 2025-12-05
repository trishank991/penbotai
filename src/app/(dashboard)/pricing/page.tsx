"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PricingCard } from "@/components/pricing-card";

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error fetching user:', userError);
        setLoading(false);
        return;
      }

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (profile) {
          setCurrentPlan(profile.plan);
        }
      }
      setLoading(false);
    };

    loadPlan();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4 mx-auto"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
          <div className="h-96 bg-slate-200 rounded mt-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Choose the plan that works best for you. Upgrade anytime for unlimited access to all features.
        </p>
      </div>

      <PricingCard currentPlan={currentPlan} />

      {/* FAQ Section */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-sm text-muted-foreground">
              Yes! You can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">Is there a student discount?</h3>
            <p className="text-sm text-muted-foreground">
              Our pricing is already student-friendly at $5/month. Contact us if your university is interested in bulk pricing.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">What happens when I run out of free uses?</h3>
            <p className="text-sm text-muted-foreground">
              Your free tier resets on the 1st of each month. You can upgrade to Premium anytime for unlimited access.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, we offer a 7-day money-back guarantee if you&apos;re not satisfied with Premium.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <h3 className="font-semibold mb-2">Is my data secure?</h3>
            <p className="text-sm text-muted-foreground">
              Absolutely. We use industry-standard encryption and never share your data. Your disclosures and analyses are private.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">Trusted by students at</p>
        <div className="flex justify-center gap-8 flex-wrap opacity-60">
          <span className="text-lg font-semibold">Stanford</span>
          <span className="text-lg font-semibold">MIT</span>
          <span className="text-lg font-semibold">Harvard</span>
          <span className="text-lg font-semibold">Berkeley</span>
          <span className="text-lg font-semibold">Yale</span>
        </div>
      </div>
    </div>
  );
}
