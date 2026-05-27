import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const productFormat = z.object({
  sku: z.string(),
  label: z.string(),
  priceCents: z.number().int().positive(),
});

const products = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/products" }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    workingName: z.boolean().default(true),
    eyebrow: z.string(),
    promise: z.string(),
    priceCents: z.number().int().positive(),
    formats: z.array(productFormat).min(1),
    heroImage: z.string(),
    shippingNote: z.string().default("Ships from Queensland · $9.95 flat AU-wide · 2–5 business days"),
    preorder: z.boolean().default(false),
    comingSoon: z.boolean().default(false),
    preorderCtaLabel: z.string().optional(),
  }),
});

const journal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/journal" }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    eyebrow: z.string(),
    summary: z.string(),
    publishedAt: z.string().optional(),
    draft: z.boolean().default(true),
    heroImage: z.string().optional(),
    readingMinutes: z.number().int().positive().optional(),
  }),
});

export const collections = { products, journal };
