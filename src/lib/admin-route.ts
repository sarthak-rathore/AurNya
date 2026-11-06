import { NextResponse } from 'next/server';
import type { ZodType, ZodTypeDef } from 'zod';
import { AdminError } from '@/db/admin-errors';
import { getDb, type Db } from '@/db/client';
import { jsonError, requireAdminApi } from './admin-auth';
import { firstIssue } from './admin-schemas';

export interface Ctx<T> { db: Db; actor: string; body: T; req: Request }
const noStore = { 'Cache-Control': 'no-store' };
export const ok = (data: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...data }, { headers: noStore });

/**
 * The one wrapper every admin API route uses: signed in? from this site? database present? body valid?
 * Messages from AdminError are shown to the owner; anything else is logged and hidden behind a generic message.
 */
export async function adminRoute<T = undefined>(req: Request, schema: ZodType<T, ZodTypeDef, unknown> | null, run: (c: Ctx<T>) => Promise<NextResponse>): Promise<NextResponse> {
  const a = await requireAdminApi(req); if (!a.ok) return a.res;
  const db = getDb(); if (!db) return jsonError(503, 'The admin dashboard needs a database. Add DATABASE_URL and redeploy.');
  let body: T = undefined as T;
  if (schema) {
    let raw: unknown; try { raw = await req.json(); } catch { return jsonError(400, 'The request was not valid JSON.'); }
    const p = schema.safeParse(raw); if (!p.success) return jsonError(400, firstIssue(p.error));
    body = p.data;
  }
  try { return await run({ db, actor: a.email, body, req }); }
  catch (e) {
    if (e instanceof AdminError) return jsonError(e.status, e.message);
    console.error('[admin] unexpected error', e); return jsonError(500, 'Something went wrong. Nothing was lost; please try again.');
  }
}
export const idParam = (v: string): number | null => (/^\d{1,9}$/.test(v) && Number(v) > 0 ? Number(v) : null);
