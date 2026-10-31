import { NextResponse } from 'next/server';
import { catalog } from '@/lib/catalog';
import { couponStore } from '@/lib/coupon-store';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { parseQuoteRequest, quote } from '@/lib/quote';

const MAX_BODY_BYTES = 10_000;
// Bag checks per visitor per minute. A person clicking around stays far below this. Raise it with QUOTE_RATE_LIMIT_PER_MIN if needed.
const perMinute = () => Number(process.env.QUOTE_RATE_LIMIT_PER_MIN) || 60;
const noStore = { 'Cache-Control': 'no-store' };
const fail = (status: number, error: string, extra: Record<string, string> = {}) => NextResponse.json({ error }, { status, headers: { ...noStore, ...extra } });

/**
 * Checks a bag on the server. The browser sends product ids, sizes and quantities (and a coupon code);
 * the server answers with real prices, stock limits, the discount and the total. It never trusts a price sent by the browser.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`quote:${clientKey(req)}`, perMinute(), 60_000);
  if (!limit.ok) return fail(429, 'Too many requests. Please wait a moment.', { 'Retry-After': String(limit.retryAfterSec) });
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return fail(413, 'That request is too large.');
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return fail(413, 'That request is too large.');
  let body: unknown;
  try { body = JSON.parse(text); } catch { return fail(400, 'The request was not valid JSON.'); }
  const parsed = parseQuoteRequest(body);
  if (!parsed.ok) return fail(400, parsed.error);
  try {
    return NextResponse.json(await quote(catalog, couponStore, parsed.value), { headers: noStore });
  } catch (e) {
    console.error('quote failed', e);
    return fail(500, 'We could not check your bag right now. Please try again.');   // never expose database details
  }
}
