/*
 * Turns "PUT /api/admin/products/12 {...}" into a sentence the owner can read in a pop-up:
 *   section: "Products"   summary: 'Edit product #12 "Royal Solitaire Ring"'
 * Pure and dependency-free so it is easy to test. Unknown routes still get a sensible sentence, so a route added later is never invisible.
 */
export interface Described { section: string; summary: string }

/** Names shown for the generic dashboard sections (see lib/sections.ts). */
export const SECTION_LABEL: Record<string, string> = {
  categories: 'Categories', collections: 'Collections', content: 'Content', marketing: 'Marketing', settings: 'Store settings',
  'orders-demo': 'Orders', 'coupons-demo': 'Coupons',
};

const str = (v: unknown, max = 80): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const rupees = (v: unknown): string => { const n = Number(v); return Number.isFinite(n) && n > 0 ? ` (₹${n.toLocaleString('en-IN')})` : ''; };

export function describeChange(method: string, rawPath: string, rawBody: unknown): Described {
  const path = rawPath.split('?')[0]!.replace(/\/+$/, '');
  const body = obj(rawBody);
  const m = method.toUpperCase();
  let g: RegExpMatchArray | null;

  if (path === '/api/admin/products' && m === 'POST') return { section: 'Products', summary: `Add product "${str(body.name)}"${rupees(body.price)}` };
  if ((g = path.match(/^\/api\/admin\/products\/(\d+)$/))) {
    const id = g[1];
    if (m === 'PUT') return { section: 'Products', summary: `Edit product #${id} "${str(body.name)}"${rupees(body.price)}` };
    if (m === 'PATCH') return { section: 'Products', summary: `Set product #${id} to ${str(body.status) || 'a new status'}` };
    if (m === 'DELETE') return { section: 'Products', summary: `Delete product #${id} permanently` };
  }
  if (path === '/api/admin/inventory') {
    const mode = body.mode === 'add' ? 'Add' : 'Set stock to';
    return { section: 'Inventory', summary: `${mode} ${Number(body.value) || 0} on product #${Number(body.productId) || '?'}${body.variantId ? ` (size/variant #${Number(body.variantId)})` : ''}` };
  }
  if (path === '/api/admin/coupons' && m === 'POST') return { section: 'Coupons', summary: `Create coupon ${str(body.code, 30).toUpperCase()}: ${body.kind === 'fixed' ? `₹${str(String(body.value), 10)}` : `${str(String(body.value), 10)}%`} off` };
  if ((g = path.match(/^\/api\/admin\/coupons\/(\d+)$/))) {
    const id = g[1];
    if (m === 'PUT') return { section: 'Coupons', summary: `Edit coupon ${str(body.code, 30).toUpperCase() || `#${id}`}` };
    if (m === 'PATCH') return { section: 'Coupons', summary: `${body.isActive ? 'Switch on' : 'Switch off'} coupon #${id}` };
    if (m === 'DELETE') return { section: 'Coupons', summary: `Delete coupon #${id}` };
  }
  if ((g = path.match(/^\/api\/admin\/orders\/([0-9a-f-]{36})$/i)) && m === 'POST') {
    const short = g[1]!.slice(0, 8);
    if (body.action === 'note') return { section: 'Orders', summary: `Change the private note on order ${short}` };
    if (body.action === 'tracking') return { section: 'Orders', summary: `Fix tracking on order ${short}: ${str(body.courier, 40)} ${str(body.trackingNumber, 40)}`.trim() };
    const to = str(body.to, 20);
    const extra = to === 'shipped' && body.courier ? ` via ${str(body.courier, 40)}` : body.refundOnline ? ' and refund through Razorpay' : '';
    return { section: 'Orders', summary: `Move order ${short} to "${to || 'a new status'}"${extra}` };
  }
  if (path === '/api/admin/announcement') return { section: 'Website', summary: body.visible === false ? 'Switch off the announcement bar' : `Update the announcement bar: "${str(body.message, 90)}"` };
  if (path === '/api/admin/banners') return { section: 'Website', summary: 'Update the home page pictures' };
  if (path === '/api/admin/whatsapp/broadcast') return { section: 'WhatsApp', summary: `Send a WhatsApp message to every subscribed customer: "${str(body.message, 90)}"` };
  if ((g = path.match(/^\/api\/admin\/section\/([a-z0-9-]+)$/))) {
    const label = SECTION_LABEL[g[1]!] ?? g[1]!;
    return { section: label, summary: sectionSummary(g[1]!, body.value) };
  }
  return { section: 'General', summary: `${m} ${path}` };
}

function sectionSummary(key: string, value: unknown): string {
  const label = SECTION_LABEL[key] ?? key;
  if (Array.isArray(value)) return `Update ${label.toLowerCase()} (${value.length} item${value.length === 1 ? '' : 's'} after the change)`;
  if (value && typeof value === 'object') return `Update ${label.toLowerCase()}`;
  return `Update ${label.toLowerCase()}`;
}

export const isMutatingMethod = (m: string): boolean => !['GET', 'HEAD', 'OPTIONS'].includes(m.toUpperCase());
