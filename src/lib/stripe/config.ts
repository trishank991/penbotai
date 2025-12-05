import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backwards compatibility
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get checkout() { return getStripe().checkout; },
  get webhooks() { return getStripe().webhooks; },
};

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    limits: {
      prompt_coach: 5,
      disclosure: 3,
      grammar: 10,
      research: 5,
    },
  },
  premium: {
    name: "Premium",
    priceMonthly: 500, // $5.00 in cents
    priceYearly: 5000, // $50.00 in cents
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_ID_YEARLY,
    limits: {
      prompt_coach: -1, // unlimited
      disclosure: -1,
      grammar: -1,
      research: -1,
    },
  },
} as const;
