-- Terraliving waitlist table
-- Captures email signups for coming-soon products (chocolate at launch) and
-- general Founding-20 interest. Applied to the same Neon Postgres database
-- as 0001_orders.sql. Idempotent: safe to run multiple times.

create table if not exists public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  product_slug  text,
  source        text not null default 'product-page',
  created_at    timestamptz not null default now(),
  unique (email, product_slug)
);

create index if not exists waitlist_product_slug_idx on public.waitlist (product_slug);
create index if not exists waitlist_created_at_idx   on public.waitlist (created_at desc);
