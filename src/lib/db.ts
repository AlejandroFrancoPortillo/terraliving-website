import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

export const getDb = (): NeonQueryFunction<false, false> => {
  if (!_sql) {
    const url = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    _sql = neon(url);
  }
  return _sql;
};

export type OrderRow = {
  stripe_session_id: string;
  customer_email: string;
  customer_name: string | null;
  shipping_address: unknown;
  line_items: unknown;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
};

export const insertOrder = async (row: OrderRow): Promise<void> => {
  const sql = getDb();
  await sql`
    insert into orders (
      stripe_session_id, customer_email, customer_name, shipping_address,
      line_items, subtotal_cents, shipping_cents, tax_cents, total_cents, currency
    ) values (
      ${row.stripe_session_id}, ${row.customer_email}, ${row.customer_name},
      ${JSON.stringify(row.shipping_address)}::jsonb,
      ${JSON.stringify(row.line_items)}::jsonb,
      ${row.subtotal_cents}, ${row.shipping_cents}, ${row.tax_cents},
      ${row.total_cents}, ${row.currency}
    )
    on conflict (stripe_session_id) do nothing
  `;
};
