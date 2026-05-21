import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { cart, updateQty, removeFromCart, getSubtotalCents, addToCart } from "../../lib/cart";

export default function CartDrawer() {
  const isOpen = useSignal(false);

  useEffect(() => {
    const openBtn = document.getElementById("open-cart");
    const handleOpen = () => { isOpen.value = true; };
    openBtn?.addEventListener("click", handleOpen);

    const onAddToCart = (e: Event) => {
      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>(".add-to-cart");
      if (!btn) return;
      const sku = btn.dataset.defaultSku;
      const priceCentsRaw = btn.dataset.defaultPriceCents;
      const slug = btn.dataset.slug;
      const name = btn.dataset.name;
      const image = btn.dataset.image;
      if (!sku || !priceCentsRaw || !slug) return;
      const priceCents = Number(priceCentsRaw);
      if (Number.isNaN(priceCents) || priceCents <= 0) return;
      addToCart({ sku, name: name ?? slug, priceCents, image });
      isOpen.value = true;
    };
    document.addEventListener("click", onAddToCart);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") isOpen.value = false;
    };
    document.addEventListener("keydown", onKey);

    return () => {
      openBtn?.removeEventListener("click", handleOpen);
      document.removeEventListener("click", onAddToCart);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const items = cart.value;
  const subtotal = (getSubtotalCents() / 100).toFixed(2);

  const checkout = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: items.map(i => ({ sku: i.sku, qty: i.qty })) }),
      });
      const { url, error } = await res.json();
      if (error) { alert(error); return; }
      if (url) window.location.href = url;
    } catch (e) {
      alert("Could not start checkout. Please try again.");
    }
  };

  if (!isOpen.value) return null;

  return (
    <div class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-ink/30" onClick={() => { isOpen.value = false; }} />
      <aside class="absolute right-0 top-0 h-full w-full md:w-[420px] bg-clay border-l border-stone/30 overflow-y-auto flex flex-col">
        <div class="flex justify-between items-start p-8">
          <div>
            <p class="eyebrow">Your basket</p>
            <h2 class="font-display text-3xl mt-2 text-ink">Your ritual.</h2>
          </div>
          <button onClick={() => { isOpen.value = false; }} class="text-sage hover:text-terracotta text-xl" aria-label="Close basket">✕</button>
        </div>

        {items.length === 0 ? (
          <div class="px-8 py-16 text-center flex-1 flex flex-col justify-center">
            <p class="text-5xl text-sage opacity-30 mb-6">❦</p>
            <h3 class="font-display text-2xl text-ink">Your basket is quiet.</h3>
            <p class="mt-3 text-stone text-sm">Start with the tea — it's the gentlest entry.</p>
            <a href="/shop" onClick={() => { isOpen.value = false; }} class="inline-block mt-6 border border-ink px-4 py-2 text-sm hover:bg-bone mx-auto">Explore the four tools →</a>
          </div>
        ) : (
          <>
            <ul class="px-8 divide-y divide-stone/30 flex-1">
              {items.map(item => (
                <li class="flex gap-4 py-4">
                  {item.image ? (
                    <img src={item.image} alt={item.name} class="w-20 h-20 object-cover bg-bone flex-shrink-0" />
                  ) : (
                    <div class="w-20 h-20 bg-bone flex-shrink-0" />
                  )}
                  <div class="flex-1">
                    <p class="font-display text-lg text-ink">{item.name}</p>
                    <p class="text-sm text-stone mt-1">${(item.priceCents / 100).toFixed(2)} AUD</p>
                    <div class="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQty(item.sku, item.qty - 1)} class="w-7 h-7 border border-stone/40 text-ink hover:border-terracotta" aria-label="Decrease quantity">−</button>
                      <span class="text-sm text-ink min-w-[1.5rem] text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.sku, item.qty + 1)} class="w-7 h-7 border border-stone/40 text-ink hover:border-terracotta" aria-label="Increase quantity">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.sku)} class="text-xs text-stone underline underline-offset-2 mt-2 hover:text-terracotta">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            <div class="p-8 border-t border-stone/30">
              <div class="flex justify-between items-baseline">
                <span class="text-sm uppercase tracking-wider text-stone">Subtotal</span>
                <span class="font-medium text-lg text-ink">AUD ${subtotal}</span>
              </div>
              <p class="text-xs text-stone mt-2">GST inclusive · Shipping calculated at checkout · Ships from Queensland.</p>
              <button onClick={checkout} class="mt-6 w-full bg-terracotta text-clay py-4 font-display text-lg hover:opacity-90">Continue to secure checkout →</button>
              <p class="text-xs text-stone mt-3 text-center">Secured by Stripe</p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
