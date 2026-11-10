import { NextResponse } from 'next/server';
import type { ZodType, ZodTypeDef } from 'zod';
import { AdminError } from '@/db/admin-errors';
import { createChange } from '@/db/approvals';
import { getDb, type Db } from '@/db/client';
import { jsonError, requireAdminApi } from './admin-auth';
import { describeChange, isMutatingMethod } from './approvals-describe';
import { firstIssue } from './admin-schemas';
import type { UserRole } from './role-auth-core';

export interface Ctx<T> { db: Db; actor: string; role: UserRole; body: T; req: Request }
export interface CtxMaybeDb<T> { db: Db | null; actor: string; role: UserRole; body: T; req: Request }
const noStore = { 'Cache-Control': 'no-store' };
export const ok = (data: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...data }, { headers: noStore });

/** Header the owner's approval screen adds when it replays a saved request, so the activity log says who really asked. */
export const REPLAY_HEADER = 'x-aurnya-replay-by';
const MAX_QUEUED_BODY = 250_000;

type Schema<T> = ZodType<T, ZodTypeDef, unknown> | null;

/**
 * The one wrapper every admin API route uses: signed in? from this site? body valid?
 *
 * THE OWNER-APPROVAL GATE lives here, so it covers every section of every dashboard, including routes added later:
 *   - the OWNER's changes are applied immediately;
 *   - an ADMIN's or MANAGER's change (anything that is not a read) is NOT applied. It is saved as a pending request, the owner is notified
 *     on their dashboard straight away, and the change happens only if the owner approves it (the saved request is then replayed as the owner).
 * The body is validated first, so a mistake is reported to the person at once instead of waiting in the owner's queue.
 */
async function core<T>(req: Request, schema: Schema<T>, needDb: boolean, run: (c: CtxMaybeDb<T>) => Promise<NextResponse>): Promise<NextResponse> {
  const a = await requireAdminApi(req);
  if (!a.ok) return a.res;

  let body: T = undefined as T;
  let raw: unknown = undefined;
  if (schema) {
    try { raw = await req.json(); } catch { return jsonError(400, 'The request was not valid JSON.'); }
    const p = schema.safeParse(raw);
    if (!p.success) return jsonError(400, firstIssue(p.error));
    body = p.data;
  }

  // ---- Owner-approval gate ----
  if (a.role !== 'owner' && isMutatingMethod(req.method)) {
    const path = new URL(req.url).pathname;
    if (JSON.stringify(raw ?? null).length > MAX_QUEUED_BODY) return jsonError(413, 'That change is too large to send for approval.');
    const d = describeChange(req.method, path, raw);
    try {
      const { request, duplicate } = await createChange(getDb(), { actorEmail: a.email, actorRole: a.role, method: req.method, path, body: raw ?? null, section: d.section, summary: d.summary });
      return NextResponse.json({
        ok: true, pending: true, requestId: request.id, duplicate,
        message: duplicate ? 'This change is already waiting for the owner’s approval.' : 'Sent to the owner for approval. Nothing changes until the owner approves it.',
      }, { status: 202, headers: noStore });
    } catch (e) {
      console.error('[approvals] could not save the request', e);
      return jsonError(500, 'Could not send this change for approval. Nothing was changed; please try again.');
    }
  }

  // The owner approving someone else's request: the activity log names both people.
  const by = a.role === 'owner' ? (req.headers.get(REPLAY_HEADER) ?? '').replace(/[^\w.@+-]/g, '').slice(0, 120) : '';
  const actor = by ? `${a.email} (approved a request from ${by})` : a.email;

  const db = getDb();
  if (!db && needDb) {
    // Demo mode (no DATABASE_URL): bodies are fully validated and a simulated success is returned so the screens can be tried out.
    return ok({
      id: Math.floor(Math.random() * 900) + 100,
      slug: (body as { slug?: string })?.slug || 'sample-product',
      demo: true,
      message: 'Validated and saved (Demo mode preview). When DATABASE_URL is set, this writes directly to PostgreSQL.',
    });
  }

  try {
    return await run({ db, actor, role: a.role, body, req });
  } catch (e) {
    if (e instanceof AdminError) return jsonError(e.status, e.message);
    console.error('[admin] unexpected error', e);
    return jsonError(500, 'Something went wrong. Nothing was lost; please try again.');
  }
}

/** For routes that need the database. In demo mode (no DATABASE_URL) a validated, simulated success is returned. */
export const adminRoute = <T = undefined>(req: Request, schema: Schema<T>, run: (c: Ctx<T>) => Promise<NextResponse>) =>
  core<T>(req, schema, true, (c) => run(c as Ctx<T>));

/** For routes that also work without a database (they use the built-in memory store instead). */
export const adminRouteAnyDb = <T = undefined>(req: Request, schema: Schema<T>, run: (c: CtxMaybeDb<T>) => Promise<NextResponse>) =>
  core<T>(req, schema, false, run);

export const idParam = (v: string): number | null => (/^\d{1,9}$/.test(v) && Number(v) > 0 ? Number(v) : null);
