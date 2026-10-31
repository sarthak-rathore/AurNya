import { MAX_QTY } from './cart';
import type { CatalogService } from './catalog-types';
import { evaluateCoupon, normalizeCode, type Coupon, type CouponProblem } from './coupons';

// THE SERVER'S ANSWER TO "WHAT IS IN MY BAG WORTH?"
// The browser says only WHICH products, which size and how many (plus an optional coupon code). Prices, stock limits, discounts and
// totals are all worked out here from the database. A price sent by the browser is never used for money (see `expectedUnitPricePaise`).

export interface CouponStore { find(code: string): Promise<Coupon | null> }

export interface QuoteLineInput { productId: number; variant: string | null; qty: number; /** Only used to tell the shopper "the price changed". Never used for totals. */ expectedUnitPricePaise?: number }
export interface QuoteInput { lines: QuoteLineInput[]; coupon: string }

export type LineIssue = 'unavailable' | 'variant_required' | 'unknown_variant' | 'out_of_stock' | 'qty_reduced' | 'price_changed';
export interface QuoteLine {
  productId: number; variant: string | null; slug: string; name: string; category: string;
  unitPricePaise: number; requestedQty: number; qty: number; lineTotalPaise: number; available: number;
  /** false when the line is left out of the totals (sold out, removed, or invalid) */
  counted: boolean; issues: LineIssue[];
}
export interface Quote {
  lines: QuoteLine[]; subtotalPaise: number; discountPaise: number; totalPaise: number;
  /** Not calculated yet. They are worked out at checkout in Phase 5. */
  shippingPaise: null; taxPaise: null;
  coupon: { code: string; ok: boolean; message: string; problem?: CouponProblem };
  hasIssues: boolean; verified: true;
}

export const LIMITS = { maxLines: 50, maxQtyPerLine: 1000, maxVariantLength: 20, maxCouponLength: 40 } as const;

/** Checks an untrusted request body. Returns a plain-English error instead of throwing. */
export function parseQuoteRequest(body: unknown): { ok: true; value: QuoteInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, error: 'Send a JSON object with a "lines" list.' };
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.lines)) return { ok: false, error: '"lines" must be a list.' };
  if (b.lines.length > LIMITS.maxLines) return { ok: false, error: `A bag can have at most ${LIMITS.maxLines} lines.` };
  const coupon = b.coupon === undefined || b.coupon === null ? '' : b.coupon;
  if (typeof coupon !== 'string' || coupon.length > LIMITS.maxCouponLength) return { ok: false, error: '"coupon" must be short text.' };
  const lines: QuoteLineInput[] = [];
  for (const [i, raw] of b.lines.entries()) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: `Line ${i + 1} is not valid.` };
    const l = raw as Record<string, unknown>;
    if (!Number.isSafeInteger(l.productId) || (l.productId as number) < 1) return { ok: false, error: `Line ${i + 1}: productId must be a whole number.` };
    if (!Number.isSafeInteger(l.qty) || (l.qty as number) < 1 || (l.qty as number) > LIMITS.maxQtyPerLine) return { ok: false, error: `Line ${i + 1}: qty must be a whole number from 1 to ${LIMITS.maxQtyPerLine}.` };
    const variant = l.variant === undefined || l.variant === null ? null : l.variant;
    if (variant !== null && (typeof variant !== 'string' || variant.length === 0 || variant.length > LIMITS.maxVariantLength)) return { ok: false, error: `Line ${i + 1}: variant must be short text.` };
    const expected = l.expectedUnitPricePaise;
    if (expected !== undefined && !Number.isSafeInteger(expected)) return { ok: false, error: `Line ${i + 1}: expectedUnitPricePaise must be a whole number.` };
    lines.push({ productId: l.productId as number, variant: variant as string | null, qty: l.qty as number, ...(expected !== undefined ? { expectedUnitPricePaise: expected as number } : {}) });
  }
  return { ok: true, value: { lines, coupon } };
}

export async function quote(catalog: CatalogService, coupons: CouponStore, input: QuoteInput, now: Date = new Date()): Promise<Quote> {
  // Same product and size listed twice? Treat it as one line.
  const merged = new Map<string, QuoteLineInput>();
  for (const l of input.lines) {
    const key = `${l.productId}|${l.variant ?? ''}`; const had = merged.get(key);
    merged.set(key, had ? { ...had, qty: Math.min(LIMITS.maxQtyPerLine, had.qty + l.qty) } : { ...l });
  }
  const found = new Map((await catalog.byIds([...new Set([...merged.values()].map((l) => l.productId))])).map((p) => [p.id, p]));

  const lines: QuoteLine[] = [...merged.values()].map((l): QuoteLine => {
    const p = found.get(l.productId);
    const out = (over: Partial<QuoteLine>): QuoteLine => ({ productId: l.productId, variant: l.variant, slug: p?.slug ?? '', name: p?.name ?? 'Unavailable product', category: p?.category ?? '', unitPricePaise: p?.pricePaise ?? 0, requestedQty: l.qty, qty: 0, lineTotalPaise: 0, available: 0, counted: false, issues: [], ...over });
    if (!p) return out({ issues: ['unavailable'] });
    let available: number;
    if (p.variants) {
      if (l.variant === null) return out({ issues: ['variant_required'] });
      if (!p.variants.options.includes(l.variant)) return out({ issues: ['unknown_variant'] });
      available = p.variants.optionStock ? p.variants.optionStock[l.variant] ?? 0 : p.stock;
    } else {
      if (l.variant !== null) return out({ issues: ['unknown_variant'] });
      available = p.stock;
    }
    if (available <= 0) return out({ issues: ['out_of_stock'], available: 0 });
    const qty = Math.min(l.qty, MAX_QTY, available);
    const issues: LineIssue[] = [];
    if (qty < l.qty) issues.push('qty_reduced');
    if (l.expectedUnitPricePaise !== undefined && l.expectedUnitPricePaise !== p.pricePaise) issues.push('price_changed');
    return out({ qty, available, counted: true, lineTotalPaise: p.pricePaise * qty, issues });
  });

  const subtotalPaise = lines.reduce((s, l) => s + l.lineTotalPaise, 0);
  const code = normalizeCode(input.coupon);
  const found2 = code && subtotalPaise > 0 ? await coupons.find(code) : null;
  const c = subtotalPaise > 0 ? evaluateCoupon(found2, code, subtotalPaise, now) : { ok: false, discountPaise: 0, message: code ? 'Add something to your bag to use a code.' : '', problem: code ? ('minimum' as CouponProblem) : ('empty' as CouponProblem), code };
  const discountPaise = c.ok ? c.discountPaise : 0;
  return {
    lines, subtotalPaise, discountPaise, totalPaise: subtotalPaise - discountPaise, shippingPaise: null, taxPaise: null,
    coupon: { code, ok: c.ok, message: c.message, ...(c.problem ? { problem: c.problem } : {}) },
    hasIssues: lines.some((l) => l.issues.length > 0), verified: true,
  };
}
