import { Card, NeedsDatabase, PageHeader, td, th } from '@/components/admin/ui';
import { recentActivity } from '@/db/admin-audit';
import { getDb } from '@/db/client';
import { formatIstDateTime } from '@/lib/admin-format';
import { requireRole } from '@/lib/role-auth';

export const metadata = { title: 'Activity log' };
export default async function Activity() {
  await requireRole('owner');   // the sign-in check must come first: pages build in parallel with their layout
  const db = getDb(); if (!db) return <><PageHeader title="Activity log" /><NeedsDatabase /></>;
  const rows = await recentActivity(db, 200);
  return (
    <>
      <PageHeader title="Activity log" sub="Every change made from this dashboard, newest first (last 200)." />
      <Card>
        {rows.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>When (IST)</th><th className={th}>Who</th><th className={th}>What</th></tr></thead><tbody className="divide-y divide-charcoal/10">
          {rows.map((r) => <tr key={r.id}><td className={`${td} whitespace-nowrap text-muted`}>{formatIstDateTime(r.createdAt)}</td><td className={td}>{r.actor}</td><td className={td}>{r.summary || `${r.action} ${r.entity}`}</td></tr>)}
        </tbody></table></div>}
      </Card>
    </>
  );
}
