import { describe, test, expect } from "vitest";
import { getCollection } from "astro:content";

describe("products content collection", () => {
  test("loads four products", async () => {
    const products = await getCollection("products");
    expect(products).toHaveLength(4);
  });

  test("each product has slug, name, eyebrow, promise, priceCents, formats array", async () => {
    const products = await getCollection("products");
    for (const p of products) {
      expect(p.data.slug).toBeTypeOf("string");
      expect(p.data.name).toBeTypeOf("string");
      expect(p.data.eyebrow).toBeTypeOf("string");
      expect(p.data.promise).toBeTypeOf("string");
      expect(p.data.priceCents).toBeTypeOf("number");
      expect(p.data.priceCents).toBeGreaterThan(0);
      expect(p.data.formats).toBeInstanceOf(Array);
      expect(p.data.formats.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("format SKUs are unique across all products", async () => {
    const products = await getCollection("products");
    const allSkus = products.flatMap(p => p.data.formats.map(f => f.sku));
    const uniqueSkus = new Set(allSkus);
    expect(uniqueSkus.size).toBe(allSkus.length);
  });

  test("expected slugs are present", async () => {
    const products = await getCollection("products");
    const slugs = products.map(p => p.data.slug).sort();
    expect(slugs).toEqual(["brain-chocolate", "broccoli-sprout-powder", "earthsheet", "recalibrate-tea"]);
  });
});
