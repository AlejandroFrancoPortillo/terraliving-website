import type { APIRoute } from "astro";
import { stripe } from "../../../lib/stripe";
import { insertOrder } from "../../../lib/db";
import { sendCustomerReceipt, sendFounderAlert } from "../../../lib/resend";
import { pingTelegram } from "../../../lib/telegram";

export const prerender = false;

type StripeSessionLineItem = {
  description: string;
  quantity: number;
  amount_total: number;
};

const safe = async (label: string, fn: () => Promise<void>): Promise<void> => {
  try {
    await fn();
  } catch (e) {
    console.error(`Webhook side-effect failed (${label}):`, e);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get("stripe-signature") ?? "";
  const body = await request.text();
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "signature error";
    return new Response(`Webhook signature error: ${msg}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("ok", { status: 200 });
  }

  const eventSession = event.data.object as any;
  // line_items aren't included in the event payload — re-fetch with expand.
  const session = await stripe.checkout.sessions.retrieve(eventSession.id, {
    expand: ["line_items"],
  }) as any;
  const orderNumber = String(session.id).slice(-8).toUpperCase();
  const rawLineItems = (session.line_items?.data ?? []) as StripeSessionLineItem[];
  const lineItems = rawLineItems.map(li => ({
    name: li.description,
    qty: li.quantity,
    priceCents: li.quantity > 0 ? Math.round(li.amount_total / li.quantity) : li.amount_total,
  }));

  await Promise.all([
    safe("insertOrder", () => insertOrder({
      stripe_session_id: session.id,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name ?? null,
      shipping_address: session.shipping_details?.address ?? null,
      line_items: lineItems,
      subtotal_cents: session.amount_subtotal,
      shipping_cents: session.total_details?.amount_shipping ?? 0,
      tax_cents: session.total_details?.amount_tax ?? 0,
      total_cents: session.amount_total,
      currency: session.currency,
    })),
    safe("sendCustomerReceipt", () => sendCustomerReceipt({
      to: session.customer_details.email,
      orderNumber,
      lineItems,
      totalCents: session.amount_total,
    })),
    safe("sendFounderAlert", () => sendFounderAlert({
      to: session.customer_details.email,
      orderNumber,
      lineItems,
      totalCents: session.amount_total,
    })),
    safe("pingTelegram", () => pingTelegram(`*New Terraliving order* #${orderNumber}\nCustomer: ${session.customer_details.email}\nTotal: $${(session.amount_total / 100).toFixed(2)} AUD`)),
  ]);

  return new Response("ok", { status: 200 });
};
