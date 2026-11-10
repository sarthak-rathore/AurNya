import { NextResponse } from 'next/server';
import { listChanges } from '@/db/approvals';
import { getDb } from '@/db/client';
import { getStaff } from '@/lib/admin-auth';

const noStore = { 'Cache-Control': 'no-store' };

/**
 * The approvals feed the dashboards poll every few seconds.
 *  - Owner: every pending request, plus the latest decided ones.
 *  - Admin / manager: only their own requests and what the owner decided.
 */
export async function GET() {
  const who = await getStaff();
  if (!who) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401, headers: noStore });
  try {
    const { items, pending } = await listChanges(getDb(), who);
    return NextResponse.json({
      role: who.role, pending,
      items: items.map((r) => ({
        id: r.id, by: r.actorEmail, byRole: r.actorRole, section: r.section, summary: r.summary, method: r.method, path: r.path,
        status: r.status, decidedBy: r.decidedBy, decisionNote: r.decisionNote, resultMessage: r.resultMessage,
        createdAt: r.createdAt.toISOString(), decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
        // The raw data is only for the owner, who needs to see exactly what would change.
        body: who.role === 'owner' ? r.body : undefined,
      })),
    }, { headers: noStore });
  } catch (e) {
    console.error('[approvals] list failed', e);
    return NextResponse.json({ error: 'Could not load approvals.' }, { status: 500, headers: noStore });
  }
}
