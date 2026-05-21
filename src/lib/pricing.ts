import { getCollection } from "astro:content";

export type CartRequest = {
  items: Array<{ sku: string; qty: number }>;
};

export type PricedLineItem = {
  sku: string;
  name: string;
  formatLabel: string;
  priceCents: number;
  qty: number;
};

export type PricedCart = {
  lineItems: PricedLineItem[];
  subtotalCents: number;
};

export const validateAndPriceCart = async (req: CartRequest): Promise<PricedCart> => {
  if (!req.items || req.items.length === 0) {
    throw new Error("Cart must contain at least one item");
  }

  const products = await getCollection("products");
  const skuIndex = new Map<string, { productName: string; formatLabel: string; priceCents: number }>();
  for (const p of products) {
    for (const f of p.data.formats) {
      skuIndex.set(f.sku, {
        productName: p.data.name,
        formatLabel: f.label,
        priceCents: f.priceCents,
      });
    }
  }

  const lineItems: PricedLineItem[] = req.items.map(({ sku, qty }) => {
    if (qty <= 0) throw new Error(`qty must be positive (got ${qty} for sku ${sku})`);
    const entry = skuIndex.get(sku);
    if (!entry) throw new Error(`Unknown SKU: ${sku}`);
    return {
      sku,
      name: entry.productName,
      formatLabel: entry.formatLabel,
      priceCents: entry.priceCents,
      qty,
    };
  });

  const subtotalCents = lineItems.reduce((sum, l) => sum + l.priceCents * l.qty, 0);
  return { lineItems, subtotalCents };
};
