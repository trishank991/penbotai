import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Lazy initialization for supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          const subData = subscription as unknown as {
            status: string;
            current_period_start: number;
            current_period_end: number;
          };

          // Update user plan
          await getSupabaseAdmin()
            .from("profiles")
            .update({ plan: "premium" })
            .eq("id", userId);

          // Create subscription record
          await getSupabaseAdmin().from("subscriptions").upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            plan: "premium",
            status: subData.status,
            current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subData = subscription as unknown as {
          id: string;
          customer: string;
          status: string;
          current_period_start: number;
          current_period_end: number;
        };
        const customerId = subData.customer;

        // Find user by customer ID
        const { data: profile } = await getSupabaseAdmin()
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          await getSupabaseAdmin()
            .from("subscriptions")
            .update({
              status: subData.status,
              current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", subData.id);

          // Update plan based on status
          const isActive = subData.status === "active" || subData.status === "trialing";
          await getSupabaseAdmin()
            .from("profiles")
            .update({ plan: isActive ? "premium" : "free" })
            .eq("id", profile.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subData = subscription as unknown as {
          id: string;
          customer: string;
        };
        const customerId = subData.customer;

        const { data: profile } = await getSupabaseAdmin()
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          // Downgrade to free
          await getSupabaseAdmin()
            .from("profiles")
            .update({ plan: "free" })
            .eq("id", profile.id);

          await getSupabaseAdmin()
            .from("subscriptions")
            .update({ status: "cancelled" })
            .eq("stripe_subscription_id", subData.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
