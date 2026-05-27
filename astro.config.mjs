import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://terraliving.com.au',
  output: 'static',
  adapter: vercel(),
  // Stripe webhooks (and other external POSTs) don't send a same-origin header.
  // The Stripe HMAC signature is the real authentication for /api/webhooks/stripe.
  security: { checkOrigin: false },
  integrations: [
    preact({ compat: false }),
    sitemap({
      filter: (page) => !page.includes('/order-confirmed') && !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
