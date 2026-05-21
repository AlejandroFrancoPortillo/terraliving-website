-- Terraliving orders table
-- Applied to the Neon Postgres database provisioned via Vercel Marketplace.
-- Idempotent: safe to run multiple times.

create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  stripe_session_id   text unique not null,
  customer_email      text not null,
  customer_name       text,
  shipping_address    jsonb,
  line_items          jsonb not null,
  subtotal_cents      integer not null,
  shipping_cents      integer not null,
  tax_cents           integer not null,
  total_cents         integer not null,
  currency            text not null default 'aud',
  status              text not null default 'paid',
  fulfillment_status  text not null default 'pending',
  created_at          timestamptz not null default now()
);

create index if not exists orders_created_at_idx       on public.orders (created_at desc);
create index if not exists orders_fulfillment_idx      on public.orders (fulfillment_status);
create index if not exists orders_customer_email_idx   on public.orders (customer_email);
