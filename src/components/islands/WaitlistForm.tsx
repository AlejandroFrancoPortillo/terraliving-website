import { useSignal } from "@preact/signals";

interface Props {
  productSlug: string;
  productName: string;
}

export default function WaitlistForm({ productSlug, productName }: Props) {
  const email = useSignal("");
  const status = useSignal<"idle" | "submitting" | "done" | "error">("idle");
  const error = useSignal("");

  const submit = async (e: Event) => {
    e.preventDefault();
    if (status.value === "submitting") return;
    status.value = "submitting";
    error.value = "";
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.value,
          productSlug,
          source: "product-page",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        status.value = "error";
        error.value = data.error ?? "Something went wrong";
        return;
      }
      status.value = "done";
    } catch {
      status.value = "error";
      error.value = "Could not reach the server. Please try again.";
    }
  };

  if (status.value === "done") {
    return (
      <div class="mt-6 p-6 bg-bone border border-sage/30">
        <p class="font-display text-xl text-ink">You're on the list.</p>
        <p class="mt-2 text-sm text-stone leading-relaxed">
          We'll write to you the moment {productName} is ready. No other emails.
        </p>
      </div>
    );
  }

  return (
    <form class="mt-6" onSubmit={submit}>
      <label class="block text-sm text-stone mb-2" for="waitlist-email">
        Email me when it's ready
      </label>
      <div class="flex gap-2">
        <input
          id="waitlist-email"
          type="email"
          required
          autoComplete="email"
          value={email.value}
          onInput={(e) => { email.value = (e.target as HTMLInputElement).value; }}
          placeholder="you@email.com"
          class="flex-1 px-3 py-3 border border-stone/40 bg-clay text-ink text-sm focus:outline-none focus:border-terracotta"
        />
        <button
          type="submit"
          disabled={status.value === "submitting"}
          class="bg-terracotta text-clay px-5 py-3 text-sm font-medium uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
        >
          {status.value === "submitting" ? "…" : "Notify me"}
        </button>
      </div>
      {error.value && (
        <p class="mt-2 text-xs text-terracotta">{error.value}</p>
      )}
      <p class="mt-3 text-xs text-stone">
        One email when the bars are produced. Nothing else.
      </p>
    </form>
  );
}
