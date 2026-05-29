import type { APIRoute } from "astro";
import { getDb } from "../../lib/db";
import { pingTelegram } from "../../lib/telegram";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The footer "Earth Letter" form is a plain HTML POST (form-urlencoded), so we
// read formData and redirect back to the page the visitor came from. Signups
// are stored in the existing `waitlist` table with product_slug 'newsletter',
// which lets the unique (email, product_slug) constraint dedupe them.
export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const raw = form.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const back = request.headers.get("referer") ?? "/";

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return redirect(`${back}`);
  }

  try {
    const sql = getDb();
    const rows = await sql`
      insert into waitlist (email, product_slug, source)
      values (${email}, 'newsletter', 'footer')
      on conflict (email, product_slug) do nothing
      returning id
    `;
    if (rows.length > 0) {
      await pingTelegram(`*New Terraliving newsletter signup*\nEmail: ${email}`);
    }
  } catch (e) {
    console.error("Newsletter signup failed:", e);
  }

  return redirect(`${back}`);
};

const redirect = (location: string) =>
  new Response(null, { status: 303, headers: { location } });
