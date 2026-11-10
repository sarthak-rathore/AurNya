import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import type { Db } from './client';
import { memoryExtra, type MemoryChangeRequest } from './memory-store';
import { changeRequests } from './schema';

/*
 * Change requests: what an admin or manager asked for, waiting for the owner.
 * Works on PostgreSQL when `db` is given, and on built-in memory when it is null (demo mode).
 */
export type ChangeStatus = 'pending' | 'approved' | 'rejected' | 'failed';
export type ChangeRequest = MemoryChangeRequest;
export interface NewChange { actorEmail: string; actorRole: string; method: string; path: string; body: unknown; section: string; summary: string }

/** Same person + same change + same place = same fingerprint (a double click must not create two requests). */
export const fingerprintOf = (c: Pick<NewChange, 'actorEmail' | 'method' | 'path' | 'body'>): string =>
  createHash('sha256').update(`${c.actorEmail}|${c.method}|${c.path}|${JSON.stringify(c.body ?? null)}`).digest('hex');

const MAX_KEPT = 500;
const toReq = (r: typeof changeRequests.$inferSelect): ChangeRequest => ({ ...r, status: r.status as ChangeStatus, body: r.body });

/** Saves a request. If the very same request is still pending, that one is returned instead (`duplicate: true`). */
export async function createChange(db: Db | null, c: NewChange): Promise<{ request: ChangeRequest; duplicate: boolean }> {
  const fingerprint = fingerprintOf(c);
  if (db) {
    const [dup] = await db.select().from(changeRequests).where(and(eq(changeRequests.fingerprint, fingerprint), eq(changeRequests.status, 'pending'))).limit(1);
    if (dup) return { request: toReq(dup), duplicate: true };
    const [row] = await db.insert(changeRequests).values({ ...c, body: c.body ?? null, fingerprint }).returning();
    return { request: toReq(row!), duplicate: false };
  }
  const dup = memoryExtra.requests.find((r) => r.fingerprint === fingerprint && r.status === 'pending');
  if (dup) return { request: dup, duplicate: true };
  const r: ChangeRequest = { id: crypto.randomUUID(), ...c, body: c.body ?? null, fingerprint, status: 'pending', decidedBy: null, decidedAt: null, decisionNote: null, resultMessage: null, createdAt: new Date() };
  memoryExtra.requests.unshift(r);
  if (memoryExtra.requests.length > MAX_KEPT) memoryExtra.requests.length = MAX_KEPT;
  return { request: r, duplicate: false };
}

/** Owner: every pending request plus the latest decided ones. Staff: only their own. */
export async function listChanges(db: Db | null, who: { role: string; email: string }, limit = 60): Promise<{ items: ChangeRequest[]; pending: number }> {
  const own = who.role !== 'owner';
  if (db) {
    const where = own ? eq(changeRequests.actorEmail, who.email) : undefined;
    const [rows, cnt] = await Promise.all([
      db.select().from(changeRequests).where(where).orderBy(sql`(${changeRequests.status} = 'pending') desc`, desc(changeRequests.createdAt)).limit(limit),
      db.select({ n: sql<number>`count(*)::int` }).from(changeRequests).where(and(eq(changeRequests.status, 'pending'), where)),
    ]);
    return { items: rows.map(toReq), pending: Number(cnt[0]?.n ?? 0) };
  }
  const mine = memoryExtra.requests.filter((r) => !own || r.actorEmail === who.email);
  const ordered = [...mine.filter((r) => r.status === 'pending'), ...mine.filter((r) => r.status !== 'pending')];
  return { items: ordered.slice(0, limit), pending: mine.filter((r) => r.status === 'pending').length };
}

export async function getChange(db: Db | null, id: string): Promise<ChangeRequest | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (db) { const [r] = await db.select().from(changeRequests).where(eq(changeRequests.id, id)).limit(1); return r ? toReq(r) : null; }
  return memoryExtra.requests.find((r) => r.id === id) ?? null;
}

/**
 * Takes a pending request for deciding. Only ONE caller can win (two owners clicking at once, or a double click), so a change is never applied twice.
 * Returns the request, or null when it was not pending any more.
 */
export async function claimChange(db: Db | null, id: string, to: 'approved' | 'rejected', by: string, note: string | null): Promise<ChangeRequest | null> {
  if (db) {
    const [r] = await db.update(changeRequests).set({ status: to, decidedBy: by, decidedAt: new Date(), decisionNote: note })
      .where(and(eq(changeRequests.id, id), eq(changeRequests.status, 'pending'))).returning();
    return r ? toReq(r) : null;
  }
  const r = memoryExtra.requests.find((x) => x.id === id);
  if (!r || r.status !== 'pending') return null;
  Object.assign(r, { status: to, decidedBy: by, decidedAt: new Date(), decisionNote: note });
  return r;
}

/** Records the outcome after the approved change was applied (or why it could not be). */
export async function finishChange(db: Db | null, id: string, ok: boolean, message: string): Promise<void> {
  const status: ChangeStatus = ok ? 'approved' : 'failed';
  const resultMessage = message.slice(0, 300);
  if (db) { await db.update(changeRequests).set({ status, resultMessage }).where(eq(changeRequests.id, id)); return; }
  const r = memoryExtra.requests.find((x) => x.id === id); if (r) Object.assign(r, { status, resultMessage });
}

/** A request that failed to apply can be tried again by the owner. Returns null if it was not in the failed state. */
export async function reopenFailed(db: Db | null, id: string): Promise<ChangeRequest | null> {
  if (db) {
    const [r] = await db.update(changeRequests).set({ status: 'pending', resultMessage: null, decidedAt: null, decidedBy: null })
      .where(and(eq(changeRequests.id, id), inArray(changeRequests.status, ['failed']))).returning();
    return r ? toReq(r) : null;
  }
  const r = memoryExtra.requests.find((x) => x.id === id);
  if (!r || r.status !== 'failed') return null;
  Object.assign(r, { status: 'pending', resultMessage: null, decidedAt: null, decidedBy: null });
  return r;
}
