import { signal } from "@preact/signals";

export type LineItem = {
  sku: string;
  name: string;
  priceCents: number;
  qty: number;
  image?: string;
};

const STORAGE_KEY = "terraliving:cart";

const loadFromStorage = (): LineItem[] => {
  if (typeof window === "undefined" && typeof globalThis.localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LineItem[]) : [];
  } catch {
    return [];
  }
};

export const cart = signal<LineItem[]>(loadFromStorage());

const persist = () => {
  if (typeof window !== "undefined" || typeof globalThis.localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.value));
    } catch {
      // silent — storage may be unavailable (private mode)
    }
  }
};

export const addToCart = (item: Omit<LineItem, "qty">) => {
  const existing = cart.value.find(i => i.sku === item.sku);
  if (existing) {
    cart.value = cart.value.map(i => i.sku === item.sku ? { ...i, qty: i.qty + 1 } : i);
  } else {
    cart.value = [...cart.value, { ...item, qty: 1 }];
  }
  persist();
};

export const updateQty = (sku: string, qty: number) => {
  if (qty <= 0) {
    removeFromCart(sku);
    return;
  }
  cart.value = cart.value.map(i => i.sku === sku ? { ...i, qty } : i);
  persist();
};

export const removeFromCart = (sku: string) => {
  cart.value = cart.value.filter(i => i.sku !== sku);
  persist();
};

export const clearCart = () => {
  cart.value = [];
  persist();
};

export const getCart = (): LineItem[] => cart.value;
export const getSubtotalCents = (): number => cart.value.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
