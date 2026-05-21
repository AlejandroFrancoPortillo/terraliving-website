import type { APIRoute } from "astro";
import { validateAndPriceCart } from "../../lib/pricing";
import { createCheckoutSession } from "../../lib/stripe";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Malformed JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const { lineItems } = await validateAndPriceCart(body as any);
    const origin = new URL(request.url).origin;
    const { url } = await createCheckoutSession(lineItems, origin);
    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Checkout failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
};
