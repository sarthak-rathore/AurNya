/*
 * The messages customers get. Each one has:
 *   params  - the values for the approved WhatsApp template's {{1}}, {{2}}, ...  (Meta)
 *   text    - the same message as plain text (Twilio, or WHATSAPP_MODE=text)
 * The exact template wording to create once in WhatsApp Manager is in README_PHASE_7_WHATSAPP_AND_APPROVALS.md.
 */
export type MessageKind = 'welcome' | 'order' | 'offer' | 'sale';
export interface Composed { kind: MessageKind; template: MessageKind; params: string[]; text: string }

const clean = (s: string, max: number) => s.replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, max);   // WhatsApp template values cannot hold new lines or long runs of spaces
const firstName = (n: string | null | undefined) => clean((n ?? '').split(/\s+/)[0] ?? '', 30) || 'there';

export function composeWelcome(brand: string, name: string | null | undefined, link: string): Composed {
  const n = firstName(name);
  return { kind: 'welcome', template: 'welcome', params: [n, clean(brand, 40)],
    text: `Hi ${n}, welcome to ${brand} ✨ You'll now get order updates, sale alerts and exclusive offers here on WhatsApp. Explore: ${link}\nReply STOP anytime to unsubscribe.` };
}

const STATUS_LINE: Record<string, string> = {
  pending_payment: 'has been placed and is waiting for payment',
  paid: 'is confirmed — we have received your payment',
  packed: 'has been packed with care and is ready to ship',
  shipped: 'is on its way',
  delivered: 'has been delivered. We hope you love it!',
  cancelled: 'has been cancelled',
  refunded: 'has been refunded',
  placed: 'has been placed. Thank you for choosing us!',
};
export function composeOrder(brand: string, name: string | null | undefined, orderNumber: number, status: string, extra: { courier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null } = {}): Composed {
  const n = firstName(name);
  let line = STATUS_LINE[status] ?? `is now ${status.replace(/_/g, ' ')}`;
  if (status === 'shipped') line += `${extra.courier ? ` via ${clean(extra.courier, 40)}` : ''}${extra.trackingNumber ? ` (tracking ${clean(extra.trackingNumber, 40)})` : ''}`;
  const track = status === 'shipped' && extra.trackingUrl ? ` Track: ${extra.trackingUrl}` : '';
  return { kind: 'order', template: 'order', params: [n, `#${orderNumber}`, clean(line, 160)],
    text: `Hi ${n}, your ${brand} order #${orderNumber} ${line}.${track}` };
}

export function composeOffer(brand: string, name: string | null | undefined, headline: string, details: string, link: string): Composed {
  const n = firstName(name); const h = clean(headline, 80); const d = clean(details, 160);
  return { kind: 'offer', template: 'offer', params: [n, h, d, link],
    text: `Hi ${n}, an exclusive offer from ${brand}: ${h}. ${d} Shop now: ${link}\nReply STOP to unsubscribe.` };
}

export function composeSale(brand: string, name: string | null | undefined, headline: string, details: string, link: string): Composed {
  const n = firstName(name); const h = clean(headline, 80); const d = clean(details, 160);
  return { kind: 'sale', template: 'sale', params: [n, h, d, link],
    text: `Hi ${n}, ${brand} update: ${h}. ${d} See it here: ${link}\nReply STOP to unsubscribe.` };
}

/** "Flat 15% off on orders above ₹999" from a coupon row. */
export function couponHeadline(c: { code: string; kind: 'percent' | 'fixed'; value: number; minSubtotalPaise: number }): { headline: string; details: string } {
  const off = c.kind === 'percent' ? `${c.value}% off` : `₹${(c.value / 100).toLocaleString('en-IN')} off`;
  const min = c.minSubtotalPaise > 0 ? ` on orders above ₹${(c.minSubtotalPaise / 100).toLocaleString('en-IN')}` : '';
  return { headline: `${off}${min}`, details: `Use code ${c.code} at checkout.` };
}
