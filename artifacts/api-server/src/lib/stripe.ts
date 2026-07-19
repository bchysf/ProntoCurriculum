import Stripe from "stripe";

// Created lazily behind a proxy: throwing at module scope when
// STRIPE_SECRET_KEY is unset would crash the whole serverless function at
// import, taking down every /api route instead of just the billing and
// webhook endpoints that actually need Stripe.
let _stripe: Stripe | undefined;

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY must be set");
      }
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return Reflect.get(_stripe, prop, _stripe);
  },
});

export const STRIPE_PRICES = {
  singleCv: "price_1TrSLX8ZsAfc3sY8DQ3SdpoH",
  monthly100: "price_1TrSLY8ZsAfc3sY8GXIIFNiO",
  unlimitedAddon: "price_1TrSLY8ZsAfc3sY8TOwX0uEi",
  annualUnlimited: "price_1TrSLY8ZsAfc3sY8JHzFpjLu",
} as const;
