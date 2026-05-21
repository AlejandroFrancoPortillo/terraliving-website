import { Resend } from "resend";

let _resend: Resend | null = null;

const getResend = (): Resend | null => {
  if (_resend) return _resend;
  const key = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY ?? "";
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
};

const FROM = import.meta.env.RESEND_FROM ?? process.env.RESEND_FROM ?? "hello@terraliving.com.au";
const FOUNDER_INBOX = import.meta.env.RESEND_FOUNDER_INBOX ?? process.env.RESEND_FOUNDER_INBOX ?? "";

type ReceiptArgs = {
  to: string;
  orderNumber: string;
  lineItems: Array<{ name: string; qty: number; priceCents: number }>;
  totalCents: number;
};

const formatAud = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

const customerReceiptHtml = (args: ReceiptArgs): string => {
  const rows = args.lineItems
    .map(li => `<tr><td style="padding:4px 0">${li.name} × ${li.qty}</td><td style="text-align:right;padding:4px 0">${formatAud(li.priceCents * li.qty)}</td></tr>`)
    .join("");
  return `
    <div style="font-family: Georgia, 'Cormorant Garamond', serif; max-width: 480px; margin: 0 auto; background: #EFE8DD; padding: 32px; color: #2A2620;">
      <h1 style="font-weight: 300; font-size: 32px; margin: 0 0 16px;">Thank you. The ritual is on its way.</h1>
      <p style="margin: 0 0 24px; color: #8C8276; font-size: 14px;">Order #${args.orderNumber}</p>
      <table style="width: 100%; font-family: 'Inter', sans-serif; font-size: 14px; border-collapse: collapse;">
        <tbody>
          ${rows}
          <tr><td colspan="2" style="border-top: 1px solid #8C8276; padding-top: 8px"></td></tr>
          <tr><td style="padding: 8px 0"><strong>Total</strong></td><td style="text-align:right;padding:8px 0"><strong>${formatAud(args.totalCents)} AUD</strong></td></tr>
        </tbody>
      </table>
      <p style="margin-top: 32px; font-style: italic; color: #8C8276; font-size: 13px;">Ships from Queensland, Australia. We'll email tracking the moment your parcel leaves our workshop.</p>
    </div>
  `;
};

export const sendCustomerReceipt = async (args: ReceiptArgs): Promise<void> => {
  const client = getResend();
  if (!client) return;
  await client.emails.send({
    from: FROM,
    to: args.to,
    subject: `Your Terraliving order #${args.orderNumber} is on its way`,
    html: customerReceiptHtml(args),
  });
};

export const sendFounderAlert = async (args: ReceiptArgs): Promise<void> => {
  if (!FOUNDER_INBOX) return;
  const client = getResend();
  if (!client) return;
  const items = args.lineItems.map(li => `${li.name} × ${li.qty}`).join(", ");
  await client.emails.send({
    from: FROM,
    to: FOUNDER_INBOX,
    subject: `New Terraliving order #${args.orderNumber} — ${formatAud(args.totalCents)}`,
    text: `Order #${args.orderNumber}\nCustomer: ${args.to}\nItems: ${items}\nTotal: ${formatAud(args.totalCents)} AUD\n`,
  });
};
