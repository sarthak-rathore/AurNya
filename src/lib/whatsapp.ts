import { after } from 'next/server';
import { getDb } from '@/db/client';
import { claimBatch, enqueue, getUserLite, isSubscribed, listSubscribers, optInOnLogin, recordOutcome, skipQueued, type QueueItem } from '@/db/whatsapp';
import { siteUrl } from './env';
import { readWhatsappConfig, defaultCountryCode, type WhatsappConfig } from './whatsapp-config';
import { composeOffer, composeOrder, composeSale, composeWelcome, couponHeadline, type Composed } from './whatsapp-messages';
import { sendWhatsapp } from './whatsapp-provider';
import { normalizePhone } from './whatsapp-phone';

/*
 * The WhatsApp engine. Everything is automatic once the keys are in the environment:
 *   customer signs in (first time, with a phone)  -> subscribed + one welcome message
 *   order placed / paid / packed / shipped / delivered / cancelled / refunded -> status message to subscribed customers
 *   a new coupon goes live, or the announcement bar changes (after owner approval) -> offer / sale message to every subscribed customer
 * Messages are written to an outbox first and sent right after the response (and by the daily cron as a safety net),
 * so a slow WhatsApp never slows the shop and nothing is lost.
 */
const cfgOrNull = (): WhatsappConfig | null => { const r = readWhatsappConfig(); return r.ok ? r.config : null; };

/** Runs `fn` after the current response is sent (falls back to running it now when there is no request, for example in tests). */
function later(fn: () => Promise<unknown>) {
  const run = () => fn().catch((e) => console.error('[whatsapp]', e));
  try { after(run); } catch { void run(); }
}

/** Sends queued messages. Safe to call any time, from anywhere, as often as you like. */
export async function processOutbox(max = 200): Promise<{ sent: number; failed: number; retried: number; skipped: number }> {
  const out = { sent: 0, failed: 0, retried: 0, skipped: 0 };
  const cfg = cfgOrNull(); if (!cfg) return out;
  const db = getDb();
  let budget = max;
  while (budget > 0) {
    const batch = await claimBatch(db, Math.min(25, budget));
    if (!batch.length) break;
    budget -= batch.length;
    for (let i = 0; i < batch.length; i += 5) {                       // 5 at a time: fast, but gentle on the provider
      await Promise.all(batch.slice(i, i + 5).map(async (row) => {
        // Marketing messages are re-checked at send time: if the customer said STOP after it was queued, it is not sent.
        if (row.userId && row.kind !== 'order') {
          const u = await getUserLite(db, row.userId);
          if (!u || !isSubscribed(u)) { await skipQueued(db, [row.id], 'Customer unsubscribed.'); out.skipped++; return; }
        }
        const r = await sendWhatsapp(cfg, row);
        if (r.ok) { await recordOutcome(db, row, { ok: true, providerId: r.id }); out.sent++; }
        else { await recordOutcome(db, row, { ok: false, error: r.error, retry: r.retryable }); if (r.retryable && row.attempts < 3) out.retried++; else out.failed++; }
      }));
    }
  }
  return out;
}

/** Start sending what was just queued, without making the visitor wait. */
export const kickOutbox = () => later(() => processOutbox());

const link = (path = '/') => `${siteUrl().replace(/\/$/, '')}${path}`;

/** Called after every successful customer sign-in or sign-up. */
export async function onCustomerSignIn(userId: string): Promise<void> {
  const db = getDb();
  const u = await getUserLite(db, userId); if (!u) return;
  const cc = defaultCountryCode();
  const r = await optInOnLogin(db, u, cc);              // consent is recorded even if WhatsApp is not configured yet
  const cfg = cfgOrNull();
  if (!r.newlySubscribed || !cfg) return;
  const phone = normalizePhone(u.phone, cc); if (!phone) return;
  await enqueue(db, [{ userId: u.id, phone, message: composeWelcome(cfg.brand, u.firstName, link('/shop')), dedupeKey: `welcome:${u.id}` }]);
  kickOutbox();
}

export interface OrderNote { userId: string | null; orderNumber: number; status: string; courier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null }

/** Order placed / status changed. Only customers who are subscribed get it. */
export async function queueOrderMessage(o: OrderNote): Promise<void> {
  const cfg = cfgOrNull(); if (!cfg || !o.userId) return;
  const db = getDb();
  const u = await getUserLite(db, o.userId); if (!u || !isSubscribed(u)) return;
  const phone = normalizePhone(u.phone, cfg.defaultCountryCode); if (!phone) return;
  const key = `order:${o.orderNumber}:${o.status}${o.status === 'shipped' ? `:${o.trackingNumber ?? ''}` : ''}`;
  await enqueue(db, [{ userId: u.id, phone, message: composeOrder(cfg.brand, u.firstName, o.orderNumber, o.status, o), dedupeKey: `${key}:${u.id}` }]);
  kickOutbox();
}

async function broadcast(build: (name: string, cfg: WhatsappConfig) => Composed, keyBase: string): Promise<number> {
  const cfg = cfgOrNull(); if (!cfg) return 0;
  const db = getDb();
  const subs = await listSubscribers(db, cfg.defaultCountryCode);
  const items: QueueItem[] = subs.map((s) => ({ userId: s.id, phone: s.phone, message: build(s.name, cfg), dedupeKey: `${keyBase}:${s.id}` }));
  const added = await enqueue(db, items);
  if (added) kickOutbox();
  return added;
}

export interface CouponLike { id: number; code: string; kind: 'percent' | 'fixed'; value: number; minSubtotalPaise: number; isActive: boolean; startsAt: Date | null; endsAt: Date | null; maxRedemptions: number | null; redemptions: number }
export const couponIsLive = (c: CouponLike, now = Date.now()): boolean =>
  c.isActive && (!c.startsAt || c.startsAt.getTime() <= now) && (!c.endsAt || c.endsAt.getTime() > now) && (c.maxRedemptions === null || c.redemptions < c.maxRedemptions);

/** A coupon just went live: tell every subscribed customer once. */
export async function announceCoupon(c: CouponLike): Promise<number> {
  if (!couponIsLive(c)) return 0;
  const { headline, details } = couponHeadline(c);
  return broadcast((name, cfg) => composeOffer(cfg.brand, name, headline, details, link('/shop')), `offer:${c.id}`);
}

/** The announcement bar changed (sale / news): tell every subscribed customer once per distinct message. */
export async function announceBar(message: string, href: string): Promise<number> {
  const text = message.trim(); if (!text) return 0;
  let h = 0; for (const ch of text + href) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const target = href && href.startsWith('/') ? link(href) : href.startsWith('https://') ? href : link('/shop');
  return broadcast((name, cfg) => composeSale(cfg.brand, name, text.slice(0, 80), 'Limited time.', target), `sale:${(h >>> 0).toString(36)}`);
}

/** The owner/admin typed a custom message in Marketing. */
export async function sendCustomBroadcast(message: string, href: string | null): Promise<number> {
  const text = message.trim(); if (!text) return 0;
  const target = href && (href.startsWith('/') ? link(href) : href.startsWith('https://') ? href : link('/shop')) || link('/shop');
  return broadcast((name, cfg) => composeSale(cfg.brand, name, text.slice(0, 80), text.length > 80 ? text.slice(80, 240) : 'Tap to see more.', target), `custom:${Date.now().toString(36)}`);
}

/** Same as queueOrderMessage, for code that only has the order's id (admin screens, payment webhooks). Never throws. */
export async function queueOrderMessageById(orderId: string, status: string, extra: { courier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null } = {}): Promise<void> {
  try {
    if (!cfgOrNull()) return;
    const db = getDb(); if (!db) return;
    const { orders } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [o] = await db.select({ userId: orders.userId, orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, orderId)).limit(1);
    if (o) await queueOrderMessage({ userId: o.userId, orderNumber: o.orderNumber, status, ...extra });
  } catch (e) { console.error('[whatsapp] order message failed', e); }
}
