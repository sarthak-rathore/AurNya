import { NextResponse } from 'next/server';
import { z } from 'zod';
import { claimChange, finishChange, getChange, reopenFailed } from '@/db/approvals';
import { getDb } from '@/db/client';
import { getStaff } from '@/lib/admin-auth';
import { REPLAY_HEADER } from '@/lib/admin-route';
import { isSameSiteRequest } from '@/lib/admin-auth-core';
import { refreshStore, refreshSettings } from '@/lib/admin-revalidate';

const noStore = { 'Cache-Control': 'no-store' };
const schema = z.object({ decision: z.enum(['approve', 'reject', 'retry']), note: z.string().max(300).optional() });
const err = (status: number, error: string) => NextResponse.json({ error }, { status, headers: noStore });

/** Where the replay goes: this same website. Only /api/admin/... paths are ever replayed. */
function replayUrl(req: Request, path: string): string | null {
  if (!/^\/api\/admin\/[A-Za-z0-9/_-]*$/.test(path) || path.includes('//') || path.includes('..')) return null;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host) return null;
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}${path}`;
}

/** Owner only: approve (the saved change is applied now), reject, or retry one that failed. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameSiteRequest(req.headers)) return err(403, 'Request blocked: it did not come from this site.');
  const who = await getStaff();
  if (!who) return err(401, 'Please sign in again.');
  if (who.role !== 'owner') return err(403, 'Only the owner can approve or reject changes.');

  let input: z.infer<typeof schema>;
  try { input = schema.parse(await req.json()); } catch { return err(400, 'Please choose approve or reject.'); }
  const { id } = await params;
  const db = getDb();

  const existing = await getChange(db, id);
  if (!existing) return err(404, 'That request was not found.');

  if (input.decision === 'retry') {
    const r = await reopenFailed(db, id);
    if (!r) return err(409, 'Only a change that failed can be retried.');
    input.decision = 'approve';
  }

  if (input.decision === 'reject') {
    const r = await claimChange(db, id, 'rejected', who.email, input.note?.trim() || null);
    if (!r) return err(409, 'That request was already decided.');
    return NextResponse.json({ ok: true, status: 'rejected' }, { headers: noStore });
  }

  // Approve: claim it first (only one click can win), then replay exactly what was asked for, as the owner.
  const claimed = await claimChange(db, id, 'approved', who.email, input.note?.trim() || null);
  if (!claimed) return err(409, 'That request was already decided.');
  const url = replayUrl(req, claimed.path);
  if (!url) { await finishChange(db, id, false, 'This change cannot be applied automatically.'); return err(400, 'This change cannot be applied automatically.'); }

  let ok = false; let message = '';
  try {
    const res = await fetch(url, {
      method: claimed.method,
      headers: { 'content-type': 'application/json', cookie: req.headers.get('cookie') ?? '', origin: new URL(url).origin, [REPLAY_HEADER]: claimed.actorEmail },
      body: claimed.method === 'GET' || claimed.method === 'DELETE' && claimed.body == null ? undefined : JSON.stringify(claimed.body ?? null),
      cache: 'no-store',
    });
    const d = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    ok = res.ok;
    message = ok ? (d.message ?? 'Applied.') : (d.error ?? `The change was refused (${res.status}).`);
  } catch (e) {
    console.error('[approvals] replay failed', e);
    message = 'Could not apply the change. Please try again.';
  }
  await finishChange(db, id, ok, message);
  if (ok) { refreshStore(); refreshSettings(); }
  return NextResponse.json({ ok, status: ok ? 'approved' : 'failed', message }, { status: ok ? 200 : 502, headers: noStore });
}
