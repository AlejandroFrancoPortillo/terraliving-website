import { describe, test, expect, vi, beforeEach } from "vitest";

const mockCreateCheckoutSession = vi.fn();

vi.mock("../../src/lib/stripe", () => ({
  createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
}));

import { POST } from "../../src/pages/api/checkout";

beforeEach(() => {
  mockCreateCheckoutSession.mockReset();
});

const mkContext = (body: unknown) => ({
  request: new Request("http://localhost/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }),
});

describe("POST /api/checkout", () => {
  test("returns checkout url for a valid cart", async () => {
    mockCreateCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.com/test_session" });
    const res = await POST(mkContext({ items: [{ sku: "earthsheet-half", qty: 1 }] }) as any);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.url).toMatch(/checkout\.stripe\.com/);
  });

  test("passes the priced cart through to Stripe with correct totals", async () => {
    mockCreateCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.com/test_session" });
    await POST(mkContext({ items: [{ sku: "tea-jar-50g", qty: 2 }] }) as any);
    expect(mockCreateCheckoutSession).toHaveBeenCalledTimes(1);
    const [lineItems, origin] = mockCreateCheckoutSession.mock.calls[0];
    expect(lineItems).toHaveLength(1);
    expect(lineItems[0].priceCents).toBe(3400);
    expect(lineItems[0].qty).toBe(2);
    expect(lineItems[0].name).toBe("Recalibrate Tea");
    expect(origin).toBe("http://localhost");
  });

  test("returns 400 on unknown sku", async () => {
    const res = await POST(mkContext({ items: [{ sku: "nope-not-real", qty: 1 }] }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Unknown SKU/);
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  test("returns 400 on empty items", async () => {
    const res = await POST(mkContext({ items: [] }) as any);
    expect(res.status).toBe(400);
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  test("returns 400 on malformed body", async () => {
    const res = await POST({
      request: new Request("http://localhost/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not json",
      }),
    } as any);
    expect(res.status).toBe(400);
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });
});
