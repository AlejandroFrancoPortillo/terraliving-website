import { describe, test, expect, vi, beforeEach } from "vitest";

const mocks = {
  constructEvent: vi.fn(),
  insertOrder: vi.fn().mockResolvedValue(undefined),
  sendReceipt: vi.fn().mockResolvedValue(undefined),
  sendFounderAlert: vi.fn().mockResolvedValue(undefined),
  ping: vi.fn().mockResolvedValue(undefined),
};

vi.mock("../../src/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mocks.constructEvent(...args),
    },
  },
}));
vi.mock("../../src/lib/db", () => ({
  insertOrder: (row: unknown) => mocks.insertOrder(row),
}));
vi.mock("../../src/lib/resend", () => ({
  sendCustomerReceipt: (args: unknown) => mocks.sendReceipt(args),
  sendFounderAlert: (args: unknown) => mocks.sendFounderAlert(args),
}));
vi.mock("../../src/lib/telegram", () => ({
  pingTelegram: (msg: string) => mocks.ping(msg),
}));

import { POST } from "../../src/pages/api/webhooks/stripe";

beforeEach(() => {
  for (const m of Object.values(mocks)) {
    if ("mockClear" in m) m.mockClear();
  }
});

const validSessionCompletedEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_123abcXYZ",
      customer_details: { email: "buyer@example.com", name: "Test Buyer" },
      amount_subtotal: 14900,
      amount_total: 16395,
      total_details: { amount_shipping: 995, amount_tax: 500 },
      shipping_details: { address: { line1: "1 Test St", city: "Maroochydore", postal_code: "4558", country: "AU" } },
      currency: "aud",
      line_items: {
        data: [
          { description: "Earthsheet — Half-sheet 90 × 270 cm", quantity: 1, amount_total: 14900 },
        ],
      },
    },
  },
};

const mkRequest = (body: string, sig: string) => new Request("http://localhost/api/webhooks/stripe", {
  method: "POST",
  headers: { "stripe-signature": sig },
  body,
});

describe("POST /api/webhooks/stripe", () => {
  test("on checkout.session.completed: writes order, sends 2 emails, pings telegram, returns 200", async () => {
    mocks.constructEvent.mockReturnValue(validSessionCompletedEvent);
    const res = await POST({ request: mkRequest("{}", "t=0,v1=fake") } as any);
    expect(res.status).toBe(200);
    expect(mocks.insertOrder).toHaveBeenCalledTimes(1);
    expect(mocks.sendReceipt).toHaveBeenCalledTimes(1);
    expect(mocks.sendFounderAlert).toHaveBeenCalledTimes(1);
    expect(mocks.ping).toHaveBeenCalledTimes(1);
  });

  test("passes the correct order data to insertOrder", async () => {
    mocks.constructEvent.mockReturnValue(validSessionCompletedEvent);
    await POST({ request: mkRequest("{}", "t=0,v1=fake") } as any);
    const orderArg = mocks.insertOrder.mock.calls[0][0];
    expect(orderArg.stripe_session_id).toBe("cs_test_123abcXYZ");
    expect(orderArg.customer_email).toBe("buyer@example.com");
    expect(orderArg.customer_name).toBe("Test Buyer");
    expect(orderArg.subtotal_cents).toBe(14900);
    expect(orderArg.shipping_cents).toBe(995);
    expect(orderArg.tax_cents).toBe(500);
    expect(orderArg.total_cents).toBe(16395);
    expect(orderArg.currency).toBe("aud");
    expect(orderArg.line_items).toHaveLength(1);
    expect(orderArg.line_items[0].name).toBe("Earthsheet — Half-sheet 90 × 270 cm");
    expect(orderArg.line_items[0].qty).toBe(1);
    expect(orderArg.line_items[0].priceCents).toBe(14900);
  });

  test("uses the last 8 chars of session id (uppercased) as the order number for the receipt", async () => {
    mocks.constructEvent.mockReturnValue(validSessionCompletedEvent);
    await POST({ request: mkRequest("{}", "t=0,v1=fake") } as any);
    const receiptArg = mocks.sendReceipt.mock.calls[0][0];
    expect(receiptArg.orderNumber).toBe("123ABCXYZ".slice(-8));
  });

  test("on signature verification failure: returns 400 and writes nothing", async () => {
    mocks.constructEvent.mockImplementation(() => { throw new Error("bad signature"); });
    const res = await POST({ request: mkRequest("{}", "garbage") } as any);
    expect(res.status).toBe(400);
    expect(mocks.insertOrder).not.toHaveBeenCalled();
    expect(mocks.sendReceipt).not.toHaveBeenCalled();
    expect(mocks.sendFounderAlert).not.toHaveBeenCalled();
    expect(mocks.ping).not.toHaveBeenCalled();
  });

  test("on non-checkout event type: returns 200 and does nothing", async () => {
    mocks.constructEvent.mockReturnValue({ type: "payment_intent.succeeded", data: { object: {} } });
    const res = await POST({ request: mkRequest("{}", "t=0,v1=fake") } as any);
    expect(res.status).toBe(200);
    expect(mocks.insertOrder).not.toHaveBeenCalled();
    expect(mocks.sendReceipt).not.toHaveBeenCalled();
    expect(mocks.sendFounderAlert).not.toHaveBeenCalled();
    expect(mocks.ping).not.toHaveBeenCalled();
  });

  test("one side-effect failure does not stop the others or fail the response", async () => {
    mocks.constructEvent.mockReturnValue(validSessionCompletedEvent);
    mocks.insertOrder.mockRejectedValueOnce(new Error("db down"));
    const res = await POST({ request: mkRequest("{}", "t=0,v1=fake") } as any);
    expect(res.status).toBe(200);
    expect(mocks.sendReceipt).toHaveBeenCalledTimes(1);
    expect(mocks.sendFounderAlert).toHaveBeenCalledTimes(1);
    expect(mocks.ping).toHaveBeenCalledTimes(1);
  });
});
