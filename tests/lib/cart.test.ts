import { describe, test, expect, beforeEach, vi } from "vitest";

// Mock localStorage for the test environment (cart.ts reads it on load)
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  });
});

describe("cart store", () => {
  test("starts empty", async () => {
    const { getCart, getSubtotalCents, clearCart } = await import("../../src/lib/cart");
    clearCart();
    expect(getCart()).toEqual([]);
    expect(getSubtotalCents()).toBe(0);
  });

  test("addToCart adds a line item with qty 1", async () => {
    const { addToCart, getCart, clearCart } = await import("../../src/lib/cart");
    clearCart();
    addToCart({ sku: "earthsheet-half", name: "Earthsheet", priceCents: 14900 });
    expect(getCart()).toHaveLength(1);
    expect(getCart()[0].qty).toBe(1);
    expect(getCart()[0].sku).toBe("earthsheet-half");
  });

  test("addToCart with existing sku increments qty", async () => {
    const { addToCart, getCart, clearCart } = await import("../../src/lib/cart");
    clearCart();
    addToCart({ sku: "earthsheet-half", name: "Earthsheet", priceCents: 14900 });
    addToCart({ sku: "earthsheet-half", name: "Earthsheet", priceCents: 14900 });
    expect(getCart()).toHaveLength(1);
    expect(getCart()[0].qty).toBe(2);
  });

  test("updateQty changes qty for existing sku", async () => {
    const { addToCart, updateQty, getCart, clearCart } = await import("../../src/lib/cart");
    clearCart();
    addToCart({ sku: "earthsheet-half", name: "Earthsheet", priceCents: 14900 });
    updateQty("earthsheet-half", 3);
    expect(getCart()[0].qty).toBe(3);
  });

  test("updateQty to 0 removes the item", async () => {
    const { addToCart, updateQty, getCart, clearCart } = await import("../../src/lib/cart");
    clearCart();
    addToCart({ sku: "earthsheet-half", name: "Earthsheet", priceCents: 14900 });
    updateQty("earthsheet-half", 0);
    expect(getCart()).toHaveLength(0);
  });

  test("removeFromCart removes the sku", async () => {
    const { addToCart, removeFromCart, getCart, clearCart } = await import("../../src/lib/cart");
    clearCart();
    addToCart({ sku: "earthsheet-half", name: "Earthsheet", priceCents: 14900 });
    removeFromCart("earthsheet-half");
    expect(getCart()).toHaveLength(0);
  });

  test("getSubtotalCents sums line totals correctly", async () => {
    const { addToCart, updateQty, getSubtotalCents, clearCart } = await import("../../src/lib/cart");
    clearCart();
    addToCart({ sku: "earthsheet-half", name: "Earthsheet", priceCents: 14900 });
    addToCart({ sku: "tea-jar-50g", name: "Tea", priceCents: 3400 });
    updateQty("tea-jar-50g", 2);
    expect(getSubtotalCents()).toBe(14900 + 3400 * 2);
  });

  test("cart persists to localStorage", async () => {
    const { addToCart, clearCart } = await import("../../src/lib/cart");
    clearCart();
    addToCart({ sku: "earthsheet-half", name: "Earthsheet", priceCents: 14900 });
    const stored = localStorage.getItem("terraliving:cart");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].sku).toBe("earthsheet-half");
  });

  test("addToCart stores optional image and name correctly", async () => {
    const { addToCart, getCart, clearCart } = await import("../../src/lib/cart");
    clearCart();
    addToCart({
      sku: "earthsheet-half",
      name: "Earthsheet",
      priceCents: 14900,
      image: "/images/products/earthsheet-hero.svg",
    });
    const item = getCart()[0];
    expect(item.name).toBe("Earthsheet");
    expect(item.image).toBe("/images/products/earthsheet-hero.svg");
  });
});
