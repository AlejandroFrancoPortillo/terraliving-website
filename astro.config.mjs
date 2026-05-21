import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://terraliving.com.au',
  output: 'static',
  adapter: vercel(),
  integrations: [preact({ compat: false })],
  vite: { plugins: [tailwindcss()] },
});
