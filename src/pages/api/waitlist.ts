import type { APIRoute } from "astro";
import { getDb } from "../../lib/db";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: unknown; productSlug?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Malformed JSON body" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ error: "Please enter a valid email address" }, 400);
  }

  const productSlug =
    typeof body.productSlug === "string" && body.productSlug.length <= 64
      ? body.productSlug
      : null;
  const source =
    typeof body.source === "string" && body.source.length <= 32
      ? body.source
      : "product-page";

  try {
    const sql = getDb();
    await sql`
      insert into waitlist (email, product_slug, source)
      values (${email}, ${productSlug}, ${source})
      on conflict (email, product_slug) do nothing
    `;
    return json({ ok: true }, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save signup";
    return json({ error: message }, 500);
  }
};

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
