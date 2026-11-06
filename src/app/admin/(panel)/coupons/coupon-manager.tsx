'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/components/admin/api';
import { Card, btnOutline, btnPrimary, input, label, td, th } from '@/components/admin/ui';
import { useAction } from '@/components/admin/use-action';

export interface CouponRow { id: number; code: string; kind: 'percent' | 'fixed'; value: string; minSubtotal: string; startsAt: string; endsAt: string; maxRedemptions: string; redemptions: number; isActive: boolean; isDemo: boolean; live: boolean }
type Form = Omit<CouponRow, 'id' | 'redemptions' | 'isDemo' | 'live'> & { id?: number };
const blank: Form = { code: '', kind: 'percent', value: '10', minSubtotal: '0', startsAt: '', endsAt: '', maxRedemptions: '', isActive: true };

export function CouponManager({ rows }: { rows: CouponRow[] }) {
  const router = useRouter(); const a = useAction(); const [f, setF] = useState<Form>(blank); const [rowErr, setRowErr] = useState('');
  const editing = f.id !== undefined; const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const body = () => ({ code: f.code, kind: f.kind, value: f.value, minSubtotal: f.minSubtotal, startsAt: f.startsAt || null, endsAt: f.endsAt || null, maxRedemptions: f.maxRedemptions, isActive: f.isActive });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await a.run(() => adminFetch(editing ? `/api/admin/coupons/${f.id}` : '/api/admin/coupons', editing ? 'PUT' : 'POST', body()), editing ? 'Coupon updated ✓' : 'Coupon created ✓');
    if (ok) { setF(blank); router.refresh(); }
  }
  async function toggle(r: CouponRow) { setRowErr(''); const x = await adminFetch(`/api/admin/coupons/${r.id}`, 'PATCH', { isActive: !r.isActive }); if (x.ok) router.refresh(); else setRowErr(x.error); }
  async function remove(r: CouponRow) { if (!window.confirm(`Delete coupon ${r.code}? Past orders keep their discount.`)) return; setRowErr(''); const x = await adminFetch(`/api/admin/coupons/${r.id}`, 'DELETE'); if (x.ok) router.refresh(); else setRowErr(x.error); }
  const describe = (r: CouponRow) => `${r.kind === 'percent' ? `${r.value}% off` : `₹${r.value} off`}${r.minSubtotal !== '0' ? `, minimum ₹${r.minSubtotal}` : ''}`;
  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Card className="!p-0 xl:order-1">
        {rows.length === 0 ? <p className="p-6 text-sm text-muted">No coupons yet. Create the first one.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Code</th><th className={th}>Discount</th><th className={th}>Used</th><th className={th}>Valid</th><th className={th}>State</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-charcoal/10">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={`${td} font-mono font-medium`}>{r.code}{r.isDemo && <span className="block font-sans text-xs font-normal text-muted">sample</span>}</td>
                <td className={td}>{describe(r)}</td>
                <td className={td}>{r.redemptions}{r.maxRedemptions ? ` / ${r.maxRedemptions}` : ''}</td>
                <td className={`${td} text-xs text-muted`}>{r.startsAt ? r.startsAt.replace('T', ' ') : 'any time'}{r.endsAt ? <><br />to {r.endsAt.replace('T', ' ')}</> : ''}</td>
                <td className={td}><span className={`rounded-full px-3 py-1 text-xs ${r.live ? 'bg-emerald-100 text-emerald-900' : 'bg-zinc-200 text-zinc-800'}`}>{r.live ? 'Live' : r.isActive ? 'Not live now' : 'Off'}</span></td>
                <td className={`${td} whitespace-nowrap`}><button type="button" onClick={() => { setF({ id: r.id, code: r.code, kind: r.kind, value: r.value, minSubtotal: r.minSubtotal, startsAt: r.startsAt, endsAt: r.endsAt, maxRedemptions: r.maxRedemptions, isActive: r.isActive }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mr-3 underline">Edit</button><button type="button" onClick={() => toggle(r)} className="mr-3 underline">{r.isActive ? 'Switch off' : 'Switch on'}</button><button type="button" onClick={() => remove(r)} className="text-danger underline">Delete</button></td>
              </tr>))}
          </tbody></table></div>)}
        {rowErr && <p role="alert" className="p-4 text-sm text-danger">{rowErr}</p>}
      </Card>
      <Card title={editing ? `Edit ${f.code}` : 'New coupon'}>
        <form onSubmit={submit} className="space-y-4">
          <div><label htmlFor="code" className={label}>Code *</label><input id="code" required value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} disabled={editing} className={`${input} font-mono`} placeholder="FESTIVE10" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="kind" className={label}>Type</label><select id="kind" value={f.kind} onChange={(e) => set('kind', e.target.value as Form['kind'])} className={input}><option value="percent">Percent off</option><option value="fixed">Fixed ₹ off</option></select></div>
            <div><label htmlFor="val" className={label}>{f.kind === 'percent' ? 'Percent (1–100)' : 'Amount (₹)'}</label><input id="val" required inputMode="decimal" value={f.value} onChange={(e) => set('value', e.target.value)} className={input} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="min" className={label}>Minimum spend (₹)</label><input id="min" inputMode="decimal" value={f.minSubtotal} onChange={(e) => set('minSubtotal', e.target.value)} className={input} /></div>
            <div><label htmlFor="max" className={label}>Total uses allowed</label><input id="max" type="number" min={1} value={f.maxRedemptions} onChange={(e) => set('maxRedemptions', e.target.value)} className={input} placeholder="Unlimited" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="from" className={label}>Starts (IST)</label><input id="from" type="datetime-local" value={f.startsAt} onChange={(e) => set('startsAt', e.target.value)} className={input} /></div>
            <div><label htmlFor="to" className={label}>Ends (IST)</label><input id="to" type="datetime-local" value={f.endsAt} onChange={(e) => set('endsAt', e.target.value)} className={input} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Switched on</label>
          <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={a.busy} className={btnPrimary}>{a.busy ? 'Saving…' : editing ? 'Save coupon' : 'Create coupon'}</button>{editing && <button type="button" onClick={() => { setF(blank); a.setError(''); }} className={btnOutline}>Cancel</button>}{a.message}</div>
        </form>
        <p className="mt-4 text-xs text-muted">A code cannot be renamed once created. Each order counts one use; cancelled orders give the use back.</p>
      </Card>
    </div>
  );
}
