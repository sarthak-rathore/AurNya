'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/components/admin/api';
import { Card, btnDanger, btnOutline, btnPrimary, input, label } from '@/components/admin/ui';
import { useAction } from '@/components/admin/use-action';
import { ACTION_LABEL, STATUS_LABEL, type OrderStatus, type PayMethod } from '@/lib/order-status';

const COURIERS = ['Delhivery', 'Blue Dart', 'DTDC', 'India Post', 'Xpressbees', 'Ecom Express', 'Shiprocket', 'Hand delivery'];
interface Props { orderId: string; status: OrderStatus; next: OrderStatus[]; method: PayMethod; hasOnlinePayment: boolean; adminNote: string; courier: string; trackingNumber: string; trackingUrl: string; stockHeld: boolean }

export function OrderActions(p: Props) {
  const router = useRouter(); const a = useAction(); const n = useAction(); const t = useAction();
  const [pick, setPick] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState(''); const [courier, setCourier] = useState(p.courier); const [tracking, setTracking] = useState(p.trackingNumber); const [url, setUrl] = useState(p.trackingUrl);
  const [paymentId, setPaymentId] = useState(''); const [restock, setRestock] = useState(p.status === 'paid' || p.status === 'packed'); const [refundOnline, setRefundOnline] = useState(p.hasOnlinePayment);
  const [adminNote, setAdminNote] = useState(p.adminNote);
  const post = (body: unknown) => adminFetch(`/api/admin/orders/${p.orderId}`, 'POST', body);

  async function confirm() {
    if (!pick) return;
    const ok = await a.run(() => post({ action: 'status', to: pick, note, courier, trackingNumber: tracking, trackingUrl: url, paymentId, restock: pick === 'refunded' ? restock : false, refundOnline: (pick === 'refunded' || pick === 'cancelled') && refundOnline }), `Now “${STATUS_LABEL[pick]}” ✓`);
    if (ok) { setPick(null); setNote(''); router.refresh(); }
  }
  const danger = pick === 'cancelled' || pick === 'refunded';
  const canTrack = p.status === 'shipped' || p.status === 'delivered';
  return (
    <>
      <Card title="Update this order">
        {p.next.length === 0 ? <p className="text-sm text-muted">This order is {STATUS_LABEL[p.status].toLowerCase()}. No further changes are possible.</p> : (
          <>
            <div className="flex flex-wrap gap-2">{p.next.map((s) => <button key={s} type="button" onClick={() => { setPick(s === pick ? null : s); a.setError(''); }} aria-pressed={pick === s} className={s === 'cancelled' || s === 'refunded' ? `${btnDanger} ${pick === s ? '!bg-danger !text-ivory' : ''}` : `${btnOutline} ${pick === s ? '!bg-charcoal !text-ivory' : ''}`}>{ACTION_LABEL[s]}</button>)}</div>
            {pick && (
              <div className="mt-4 space-y-3 rounded-xl bg-cream/60 p-4">
                {pick === 'shipped' && <>
                  <div><label htmlFor="courier" className={label}>Courier *</label><input id="courier" list="couriers" value={courier} onChange={(e) => setCourier(e.target.value)} className={input} placeholder="Choose or type" /><datalist id="couriers">{COURIERS.map((c) => <option key={c} value={c} />)}</datalist></div>
                  <div><label htmlFor="trk" className={label}>Tracking number</label><input id="trk" value={tracking} onChange={(e) => setTracking(e.target.value)} className={input} /></div>
                  <div><label htmlFor="url" className={label}>Tracking link (optional)</label><input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} className={input} placeholder="https://…" /></div>
                </>}
                {pick === 'paid' && <div><label htmlFor="pid" className={label}>Payment reference (optional)</label><input id="pid" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className={input} placeholder="UPI or Razorpay reference" /></div>}
                {pick === 'cancelled' && <p className="text-sm">The pieces go back into stock{p.stockHeld ? '' : ' (this older order never took stock, so none is added)'}.</p>}
                {(pick === 'refunded' || pick === 'cancelled') && p.hasOnlinePayment && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={refundOnline} onChange={(e) => setRefundOnline(e.target.checked)} className="mt-1" /><span>Send the money back through Razorpay now (full amount). Untick if you already refunded it yourself.</span></label>}
                {pick === 'refunded' && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="mt-1" /><span>Put the items back in stock (tick only if the pieces are back with you and sellable).</span></label>}
                <div><label htmlFor="note" className={label}>Note for the customer (optional)</label><input id="note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} className={input} placeholder="Shown on their order page" /></div>
                <p className="text-xs text-muted">The customer is emailed about this change.</p>
                <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={a.busy} onClick={confirm} className={danger ? btnDanger : btnPrimary}>{a.busy ? 'Saving…' : `Confirm: ${ACTION_LABEL[pick]}`}</button><button type="button" onClick={() => setPick(null)} className={btnOutline}>Back</button></div>
              </div>)}
            <div className="mt-2">{a.message}</div>
          </>)}
      </Card>
      {canTrack && (
        <Card title="Fix tracking details">
          <div className="space-y-3">
            <div><label htmlFor="c2" className={label}>Courier</label><input id="c2" list="couriers" value={courier} onChange={(e) => setCourier(e.target.value)} className={input} /></div>
            <div><label htmlFor="t2" className={label}>Tracking number</label><input id="t2" value={tracking} onChange={(e) => setTracking(e.target.value)} className={input} /></div>
            <div><label htmlFor="u2" className={label}>Tracking link</label><input id="u2" type="url" value={url} onChange={(e) => setUrl(e.target.value)} className={input} /></div>
            <div className="flex items-center gap-3"><button type="button" disabled={t.busy} onClick={async () => { if (await t.run(() => post({ action: 'tracking', courier, trackingNumber: tracking, trackingUrl: url }))) router.refresh(); }} className={btnOutline}>Save tracking</button>{t.message}</div>
          </div>
        </Card>)}
      <Card title="Private note" className="print:hidden">
        <label htmlFor="an" className="sr-only">Private note</label>
        <textarea id="an" rows={3} maxLength={2000} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className={input} placeholder="Only you can see this (for example: gift message, customer asked to deliver after 6 pm)." />
        <div className="mt-2 flex items-center gap-3"><button type="button" disabled={n.busy} onClick={() => n.run(() => post({ action: 'note', adminNote }))} className={btnOutline}>Save note</button>{n.message}</div>
      </Card>
      <p className="print:hidden"><button type="button" onClick={() => window.print()} className={btnOutline}>Print packing slip</button></p>
    </>
  );
}
