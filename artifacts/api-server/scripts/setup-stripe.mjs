// One-off script: creates Stripe Products/Prices for Pronto Curriculum (test mode).
// Run with: node scripts/setup-stripe.mjs
import Stripe from "stripe";
import "dotenv/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
  const product = await stripe.products.create({
    name: "Pronto Curriculum",
    description: "Generatore di CV con AI",
  });

  const singleCv = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 199,
    nickname: "CV singolo (one-time)",
  });

  const monthly100 = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 699,
    recurring: { interval: "month" },
    nickname: "Mensile - 100 CV",
  });

  const unlimitedAddon = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 299,
    recurring: { interval: "month" },
    nickname: "Add-on CV illimitati",
  });

  const annualUnlimited = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 3499,
    recurring: { interval: "year" },
    nickname: "Annuale illimitati",
  });

  console.log("Product:", product.id);
  console.log("Price - CV singolo:", singleCv.id);
  console.log("Price - Mensile 100 CV:", monthly100.id);
  console.log("Price - Add-on illimitati:", unlimitedAddon.id);
  console.log("Price - Annuale illimitati:", annualUnlimited.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
