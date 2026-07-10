import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY must be set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const STRIPE_PRICES = {
  singleCv: "price_1TrSLX8ZsAfc3sY8DQ3SdpoH",
  monthly100: "price_1TrSLY8ZsAfc3sY8GXIIFNiO",
  unlimitedAddon: "price_1TrSLY8ZsAfc3sY8TOwX0uEi",
  annualUnlimited: "price_1TrSLY8ZsAfc3sY8JHzFpjLu",
} as const;
