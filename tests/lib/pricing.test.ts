import { describe, test, expect } from "vitest";
import { validateAndPriceCart, type CartRequest } from "../../src/lib/pricing";

describe("server-side cart validation", () => {
  test("returns line items priced from canonical product data", async () => {
    const req: CartRequest = { items: [{ sku: "earthsheet-half", qty: 2 }] };
    const result = await validateAndPriceCart(req);
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].sku).toBe("earthsheet-half");
    expect(result.lineItems[0].priceCents).toBe(14900);
    expect(result.lineItems[0].qty).toBe(2);
    expect(result.lineItems[0].name).toBe("Earthsheet");
    expect(result.lineItems[0].formatLabel).toContain("Half-sheet");
    expect(result.subtotalCents).toBe(14900 * 2);
  });

  test("validates a multi-SKU cart with correct subtotal", async () => {
    const req: CartRequest = {
      items: [
        { sku: "earthsheet-half", qty: 1 },
        { sku: "tea-jar-50g", qty: 2 },
        { sku: "sprouts-jar-60g", qty: 3 },
      ],
    };
    const result = await validateAndPriceCart(req);
    expect(result.lineItems).toHaveLength(3);
    expect(result.subtotalCents).toBe(14900 + 3400 * 2 + 4200 * 3);
  });

  test("throws on unknown SKU", async () => {
    const req: CartRequest = { items: [{ sku: "fake-sku-xyz", qty: 1 }] };
    await expect(validateAndPriceCart(req)).rejects.toThrow(/Unknown SKU/);
  });

  test("rejects SKUs from comingSoon products", async () => {
    const req: CartRequest = { items: [{ sku: "chocolate-bar-85", qty: 1 }] };
    await expect(validateAndPriceCart(req)).rejects.toThrow(/Unknown SKU/);
  });

  test("throws on non-positive qty", async () => {
    const req: CartRequest = { items: [{ sku: "earthsheet-half", qty: 0 }] };
    await expect(validateAndPriceCart(req)).rejects.toThrow(/qty must be positive/);
  });

  test("throws on negative qty", async () => {
    const req: CartRequest = { items: [{ sku: "earthsheet-half", qty: -1 }] };
    await expect(validateAndPriceCart(req)).rejects.toThrow(/qty must be positive/);
  });

  test("throws on empty items array", async () => {
    const req: CartRequest = { items: [] };
    await expect(validateAndPriceCart(req)).rejects.toThrow(/at least one item/i);
  });
});
