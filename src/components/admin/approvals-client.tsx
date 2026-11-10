'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { notify } from '@/lib/notify';

type Item = {
  id: string; by: string; byRole: string; section: string; summary: string; method: string; path: string; body?: unknown;
  status: 'pending' | 'approved' | 'rejected' | 'failed'; decidedBy: string | null; decisionNote: string | null; resultMessage: string | null;
  createdAt: string; decidedAt: string | null;
};
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const tone: Record<Item['status'], string> = {
  pending: 'bg-[#3A2E16] text-[#E5B558]', approved: 'bg-[#153424] text-[#4ADE80]', rejected: 'bg-[#2E2838] text-[#A59CB0]', failed: 'bg-[#311C21] text-red-400',
};
const label: Record<Item['status'], string> = { pending: 'Waiting', approved: 'Approved', rejected: 'Rejected', failed: 'Could not apply' };

export function ApprovalsClient({ role }: { role: 'owner' | 'admin' | 'manager' }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const owner = role === 'owner';

  const load = useCallback(async () => {
    try { const r = await fetch('/api/approvals', { cache: 'no-store' }); if (r.ok) { setItems(((await r.json()) as { items: Item[] }).items); setLoaded(true); } } catch { /* retry next tick */ }
  }, []);
  useEffect(() => { const first = setTimeout(() => void load(), 0); const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 4000); return () => { clearTimeout(first); clearInterval(t); }; }, [load]);

  async function decide(id: string, decision: 'approve' | 'reject' | 'retry') {
    setBusy(id);
    const r = await fetch(`/api/approvals/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision }) });
    const d = (await r.json().catch(() => ({}))) as { error?: string; message?: string };
    notify(r.ok ? (decision === 'reject' ? 'Change rejected. Nothing was changed.' : `Approved and applied. ${d.message ?? ''}`.trim()) : (d.error ?? 'Could not apply that change.'), r.ok ? 'ok' : 'error');
    setBusy(null); await load(); router.refresh();
  }

  const pending = items.filter((i) => i.status === 'pending');
  const rest = items.filter((i) => i.status !== 'pending');
  const card = (i: Item) => (
    <div key={i.id} className="rounded-2xl border border-white/5 bg-[#181521] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${tone[i.status]}`}>{label[i.status]}</span>
            <span className="text-[10px] uppercase tracking-wider text-[#736B7F]">{i.section}</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-white">{i.summary}</p>
          <p className="mt-0.5 text-[11px] text-[#8E869B]">
            {owner ? <>Requested by <span className="text-[#C7C0D2]">{i.by}</span> ({i.byRole})</> : 'Requested by you'} · {when(i.createdAt)}
            {i.decidedBy && i.decidedAt && <> · decided by {i.decidedBy} · {when(i.decidedAt)}</>}
          </p>
          {i.resultMessage && i.status !== 'pending' && <p className={`mt-1 text-[11px] ${i.status === 'failed' ? 'text-red-400' : 'text-[#8E869B]'}`}>{i.resultMessage}</p>}
        </div>
        {owner && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {i.status === 'pending' && (<>
              <button type="button" disabled={busy === i.id} onClick={() => decide(i.id, 'approve')} className="rounded-xl bg-[#D4A843] px-4 py-2 text-xs font-bold text-[#14121A] hover:bg-[#E5B558] disabled:opacity-50">{busy === i.id ? 'Applying…' : 'Approve'}</button>
              <button type="button" disabled={busy === i.id} onClick={() => decide(i.id, 'reject')} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-[#C7C0D2] hover:bg-white/5 disabled:opacity-50">Reject</button>
            </>)}
            {i.status === 'failed' && <button type="button" disabled={busy === i.id} onClick={() => decide(i.id, 'retry')} className="rounded-xl border border-[#D4A843]/40 px-4 py-2 text-xs font-semibold text-[#D4A843] hover:bg-[#D4A843]/10 disabled:opacity-50">Retry</button>}
          </div>
        )}
      </div>
      {owner && i.body !== undefined && i.body !== null && (
        <div className="mt-3">
          <button type="button" onClick={() => setOpen(open === i.id ? null : i.id)} className="text-[11px] text-[#D4A843] hover:underline">{open === i.id ? 'Hide details' : 'Show exactly what will change'}</button>
          {open === i.id && <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-[#121018] p-3 text-[11px] leading-relaxed text-[#C7C0D2]">{`${i.method} ${i.path}\n${JSON.stringify(i.body, null, 2)}`}</pre>}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-white">{owner ? 'Approvals' : 'My Requests'}</h1>
        <p className="text-xs text-[#968E9F] mt-0.5">
          {owner ? 'Every change an admin or manager makes waits here. Nothing is applied until you approve it.' : 'Your changes are sent to the owner. They go live only after the owner approves them.'}
        </p>
      </div>
      <section aria-label="Waiting" className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#8A8197]">Waiting ({pending.length})</h2>
        {!loaded ? <p className="text-xs text-[#8E869B]">Loading…</p> : pending.length === 0 ? <p className="rounded-2xl border border-white/5 bg-[#181521] p-5 text-xs text-[#8E869B]">Nothing is waiting right now.</p> : pending.map(card)}
      </section>
      {rest.length > 0 && (
        <section aria-label="History" className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8A8197]">History</h2>
          {rest.map(card)}
        </section>
      )}
    </div>
  );
}
