import Stripe from "stripe";
import type { PricedLineItem } from "./pricing";

const stripeKey = import.meta.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? "";
if (!stripeKey) console.warn("STRIPE_SECRET_KEY not set");

export const stripe = new Stripe(stripeKey);

export const createCheckoutSession = async (
  lineItems: PricedLineItem[],
  origin: string,
): Promise<{ url: string | null }> => {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    currency: "aud",
    line_items: lineItems.map(item => ({
      quantity: item.qty,
      price_data: {
        currency: "aud",
        unit_amount: item.priceCents,
        product_data: {
          name: `${item.name} — ${item.formatLabel}`,
        },
        tax_behavior: "inclusive",
      },
    })),
    shipping_address_collection: { allowed_countries: ["AU"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 995, currency: "aud" },
          display_name: "Australia-wide standard",
        },
      },
    ],
    automatic_tax: { enabled: true },
    success_url: `${origin}/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop`,
  });
  return { url: session.url };
};
