import { and, desc, eq, inArray, isNotNull, lt, or, sql } from 'drizzle-orm';
import { normalizePhone, phoneTail } from '@/lib/whatsapp-phone';
import type { Composed } from '@/lib/whatsapp-messages';
import type { Db } from './client';
import { memoryExtra, memoryStore, type MemoryOutboxRow } from './memory-store';
import { users, whatsappOutbox } from './schema';

/*
 * WhatsApp data layer: who is subscribed, the outbox (the queue of messages to send) and its results.
 * PostgreSQL when `db` is given, built-in memory when it is null (demo mode).
 * Consent rule: a customer is subscribed from the first time they sign in with a phone number, until they say STOP
 * (or switch it off in their account). Someone who opted out is NEVER subscribed again automatically.
 */
export interface Subscriber { id: string; name: string; phone: string }
export interface UserLite { id: string; firstName: string; lastName: string; phone: string | null; whatsappOptInAt?: Date | null; whatsappOptedOutAt?: Date | null }

export const isSubscribed = (u: Pick<UserLite, 'whatsappOptInAt' | 'whatsappOptedOutAt'>): boolean =>
  !!u.whatsappOptInAt && (!u.whatsappOptedOutAt || u.whatsappOptedOutAt < u.whatsappOptInAt);

const memUser = (id: string) => memoryStore.users.find((u) => u.id === id);
const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`.trim();

export async function getUserLite(db: Db | null, id: string): Promise<UserLite | null> {
  if (db) {
    const [r] = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, phone: users.phone, whatsappOptInAt: users.whatsappOptInAt, whatsappOptedOutAt: users.whatsappOptedOutAt }).from(users).where(eq(users.id, id)).limit(1);
    if (r) return r;
  }
  const m = memUser(id);
  return m ? { id: m.id, firstName: m.firstName, lastName: m.lastName, phone: m.phone, whatsappOptInAt: m.whatsappOptInAt ?? null, whatsappOptedOutAt: m.whatsappOptedOutAt ?? null } : null;
}

/** First sign-in with a usable phone number = subscribed. Returns whether this call newly subscribed them (so the welcome goes out once). */
export async function optInOnLogin(db: Db | null, u: UserLite, countryCode: string): Promise<{ subscribed: boolean; newlySubscribed: boolean }> {
  if (!normalizePhone(u.phone, countryCode)) return { subscribed: false, newlySubscribed: false };
  if (u.whatsappOptedOutAt) return { subscribed: isSubscribed(u), newlySubscribed: false };     // they said stop: respect it
  if (u.whatsappOptInAt) return { subscribed: true, newlySubscribed: false };
  const now = new Date();
  if (db) {
    // Only the first caller flips it, so two quick sign-ins cannot send two welcomes.
    const r = await db.update(users).set({ whatsappOptInAt: now }).where(and(eq(users.id, u.id), sql`${users.whatsappOptInAt} is null`, sql`${users.whatsappOptedOutAt} is null`)).returning({ id: users.id });
    if (r.length) return { subscribed: true, newlySubscribed: true };
  }
  const m = memUser(u.id);
  if (m && !m.whatsappOptInAt) { m.whatsappOptInAt = now; return { subscribed: true, newlySubscribed: true }; }
  return { subscribed: true, newlySubscribed: false };
}

/** The customer's own choice (account page toggle). Subscribing needs a usable phone number. */
export async function setSubscription(db: Db | null, userId: string, subscribe: boolean, phoneOk: boolean): Promise<boolean> {
  if (subscribe && !phoneOk) return false;
  const now = new Date();
  const patch = subscribe ? { whatsappOptInAt: now, whatsappOptedOutAt: null } : { whatsappOptedOutAt: now };
  if (db) await db.update(users).set(patch).where(eq(users.id, userId));
  const m = memUser(userId);
  if (m) Object.assign(m, patch);
  return true;
}

/** An incoming STOP / START message: find the customer(s) by phone number, however it was typed at sign-up. */
export async function setSubscriptionByPhone(db: Db | null, phoneDigits: string, subscribe: boolean): Promise<number> {
  const tail = phoneTail(phoneDigits); const now = new Date(); let n = 0;
  const patch = subscribe ? { whatsappOptInAt: now, whatsappOptedOutAt: null } : { whatsappOptedOutAt: now };
  if (db) {
    const r = await db.update(users).set(patch).where(and(isNotNull(users.phone), sql`right(regexp_replace(${users.phone}, '\\D', '', 'g'), 10) = ${tail}`)).returning({ id: users.id });
    n += r.length;
  }
  for (const m of memoryStore.users) if (m.phone && phoneTail(m.phone.replace(/\D/g, '')) === tail) { Object.assign(m, patch); n++; }
  return n;
}

export async function listSubscribers(db: Db | null, countryCode: string): Promise<Subscriber[]> {
  const out: Subscriber[] = [];
  if (db) {
    const rows = await db.select({ id: users.id, first: users.firstName, last: users.lastName, phone: users.phone }).from(users)
      .where(and(isNotNull(users.whatsappOptInAt), isNotNull(users.phone), or(sql`${users.whatsappOptedOutAt} is null`, sql`${users.whatsappOptedOutAt} < ${users.whatsappOptInAt}`)));
    for (const r of rows) { const p = normalizePhone(r.phone, countryCode); if (p) out.push({ id: r.id, name: fullName({ firstName: r.first, lastName: r.last }), phone: p }); }
    return out;
  }
  for (const m of memoryStore.users) {
    if (!isSubscribed(m)) continue;
    const p = normalizePhone(m.phone, countryCode); if (p) out.push({ id: m.id, name: fullName(m), phone: p });
  }
  return out;
}

export interface QueueItem { userId: string | null; phone: string; message: Composed; dedupeKey: string | null }

/** Adds messages to the outbox. A message whose dedupe key already exists is skipped (so the same offer never reaches the same person twice). Returns how many were really added. */
export async function enqueue(db: Db | null, items: QueueItem[]): Promise<number> {
  if (!items.length) return 0;
  if (db) {
    let added = 0;
    for (let i = 0; i < items.length; i += 200) {
      const chunk = items.slice(i, i + 200);
      const r = await db.insert(whatsappOutbox).values(chunk.map((c) => ({ userId: c.userId, phone: c.phone, kind: c.message.kind, template: c.message.template, params: c.message.params, text: c.message.text, dedupeKey: c.dedupeKey })))
        .onConflictDoNothing({ target: whatsappOutbox.dedupeKey }).returning({ id: whatsappOutbox.id });
      added += r.length;
    }
    return added;
  }
  let added = 0;
  for (const c of items) {
    if (c.dedupeKey && memoryExtra.outbox.some((o) => o.dedupeKey === c.dedupeKey)) continue;
    const now = new Date();
    const row: MemoryOutboxRow = { id: memoryExtra.nextOutboxId++, userId: c.userId, phone: c.phone, kind: c.message.kind, template: c.message.template, params: c.message.params, text: c.message.text, status: 'queued', attempts: 0, error: null, providerMessageId: null, dedupeKey: c.dedupeKey, createdAt: now, updatedAt: now, sentAt: null };
    memoryExtra.outbox.push(row); added++;
  }
  if (memoryExtra.outbox.length > 2000) memoryExtra.outbox.splice(0, memoryExtra.outbox.length - 2000);
  return added;
}

export interface ClaimedRow { id: number; userId: string | null; kind: string; phone: string; template: string; params: string[]; text: string; attempts: number }
const STALE_MS = 10 * 60_000;
export const MAX_ATTEMPTS = 3;

/** Takes up to `limit` queued messages for sending. Each one is claimed atomically, so two workers can never send the same message. */
export async function claimBatch(db: Db | null, limit: number): Promise<ClaimedRow[]> {
  const stale = new Date(Date.now() - STALE_MS);
  if (db) {
    await db.update(whatsappOutbox).set({ status: 'queued' }).where(and(eq(whatsappOutbox.status, 'sending'), lt(whatsappOutbox.updatedAt, stale)));
    const ids = await db.select({ id: whatsappOutbox.id }).from(whatsappOutbox).where(eq(whatsappOutbox.status, 'queued')).orderBy(whatsappOutbox.id).limit(limit);
    const claimed: ClaimedRow[] = [];
    for (const { id } of ids) {
      const [r] = await db.update(whatsappOutbox).set({ status: 'sending', attempts: sql`${whatsappOutbox.attempts} + 1`, updatedAt: new Date() })
        .where(and(eq(whatsappOutbox.id, id), eq(whatsappOutbox.status, 'queued'))).returning();
      if (r) claimed.push({ id: r.id, userId: r.userId, kind: r.kind, phone: r.phone, template: r.template, params: (r.params as string[]) ?? [], text: r.text, attempts: r.attempts });
    }
    return claimed;
  }
  for (const o of memoryExtra.outbox) if (o.status === 'sending' && o.updatedAt < stale) o.status = 'queued';
  const out: ClaimedRow[] = [];
  for (const o of memoryExtra.outbox) {
    if (out.length >= limit) break;
    if (o.status !== 'queued') continue;
    o.status = 'sending'; o.attempts++; o.updatedAt = new Date();
    out.push({ id: o.id, userId: o.userId, kind: o.kind, phone: o.phone, template: o.template, params: o.params, text: o.text, attempts: o.attempts });
  }
  return out;
}

export type Outcome = { ok: true; providerId: string | null } | { ok: false; error: string; retry: boolean };

export async function recordOutcome(db: Db | null, row: ClaimedRow, r: Outcome): Promise<void> {
  const now = new Date();
  const patch = r.ok
    ? { status: 'sent' as const, error: null, providerMessageId: r.providerId, sentAt: now, updatedAt: now }
    : { status: (r.retry && row.attempts < MAX_ATTEMPTS ? 'queued' : 'failed') as 'queued' | 'failed', error: r.error.slice(0, 300), updatedAt: now };
  if (db) await db.update(whatsappOutbox).set(patch).where(eq(whatsappOutbox.id, row.id));
  const m = memoryExtra.outbox.find((o) => o.id === row.id); if (m) Object.assign(m, patch);
}

/** Marks queued messages as skipped (for example WhatsApp is not configured, or the customer unsubscribed after the message was queued). */
export async function skipQueued(db: Db | null, ids: number[], reason: string): Promise<void> {
  if (!ids.length) return;
  const patch = { status: 'skipped' as const, error: reason.slice(0, 300), updatedAt: new Date() };
  if (db) await db.update(whatsappOutbox).set(patch).where(inArray(whatsappOutbox.id, ids));
  for (const m of memoryExtra.outbox) if (ids.includes(m.id)) Object.assign(m, patch);
}

export interface OutboxStats { subscribers: number; counts: Record<string, number>; recent: Array<{ id: number; phone: string; kind: string; status: string; error: string | null; createdAt: Date; sentAt: Date | null }> }

export async function outboxStats(db: Db | null, countryCode: string): Promise<OutboxStats> {
  const counts: Record<string, number> = { queued: 0, sending: 0, sent: 0, failed: 0, skipped: 0 };
  const week = new Date(Date.now() - 7 * 86400_000);
  const subs = (await listSubscribers(db, countryCode)).length;
  if (db) {
    const [by, recent] = await Promise.all([
      db.select({ s: whatsappOutbox.status, n: sql<number>`count(*)::int` }).from(whatsappOutbox).where(sql`${whatsappOutbox.createdAt} >= ${week}`).groupBy(whatsappOutbox.status),
      db.select({ id: whatsappOutbox.id, phone: whatsappOutbox.phone, kind: whatsappOutbox.kind, status: whatsappOutbox.status, error: whatsappOutbox.error, createdAt: whatsappOutbox.createdAt, sentAt: whatsappOutbox.sentAt }).from(whatsappOutbox).orderBy(desc(whatsappOutbox.id)).limit(40),
    ]);
    for (const r of by) counts[r.s] = Number(r.n);
    return { subscribers: subs, counts, recent };
  }
  const rows = memoryExtra.outbox.filter((o) => o.createdAt >= week);
  for (const o of rows) counts[o.status] = (counts[o.status] ?? 0) + 1;
  return { subscribers: subs, counts, recent: [...memoryExtra.outbox].reverse().slice(0, 40).map((o) => ({ id: o.id, phone: o.phone, kind: o.kind, status: o.status, error: o.error, createdAt: o.createdAt, sentAt: o.sentAt })) };
}
