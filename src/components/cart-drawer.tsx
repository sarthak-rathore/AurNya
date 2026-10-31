'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { applyCoupon, subtotal } from '@/lib/cart';
import { formatINR } from '@/lib/money';
import type { LineIssue, Quote } from '@/lib/quote';
import { useShop } from '@/store/shop-context';
import { useModal } from '@/lib/use-modal';

type Answer = { key: string; quote?: Quote; failed?: boolean };

async function ask(body: unknown): Promise<Quote> {
  const r = await fetch('/api/cart/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}
const issueText = (i: LineIssue, available: number, qty: number, unit: number): string => ({
  unavailable: 'No longer available. Not included in your total.',
  variant_required: 'This option is not available. Not included in your total.',
  unknown_variant: 'This option is not available. Not included in your total.',
  out_of_stock: 'Sold out. Not included in your total.',
  qty_reduced: `Only ${available} available, so we counted ${qty}.`,
  price_changed: `Price is now ${formatINR(unit)}.`,
}[i]);

export function CartDrawer() {
  const { lines, drawerOpen, closeDrawer, setQty, remove, replaceLines, coupon, setCoupon, notify } = useShop();
  const [code, setCode] = useState(''); const [note, setNote] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  useModal(drawerOpen, panel, closeDrawer, closeRef);

  // What we send the server: only WHICH products, sizes and how many. It answers with the real prices, stock limits and discount.
  const request = useMemo(() => ({ lines: lines.map((l) => ({ productId: l.productId, variant: l.variant, qty: l.qty, expectedUnitPricePaise: l.pricePaise })), coupon }), [lines, coupon]);
  const key = JSON.stringify(request);
  useEffect(() => {
    if (!drawerOpen || request.lines.length === 0) return;
    let live = true;
    const timer = setTimeout(() => { ask(request).then((quote) => live && setAnswer({ key, quote })).catch(() => live && setAnswer({ key, failed: true })); }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [drawerOpen, key, request]);

  const current = answer?.key === key ? answer : null;
  const verified = current?.quote; const failed = !!current?.failed; const checking = drawerOpen && lines.length > 0 && !current;
  const sub = subtotal(lines); const local = applyCoupon(coupon, sub);
  // Until the server answers, show an instant estimate. Once it answers, its numbers win.
  const shownSub = verified ? verified.subtotalPaise : sub;
  const discount = verified ? verified.discountPaise : local.ok ? local.discount : 0;
  const total = verified ? verified.totalPaise : sub - discount;
  const couponOk = verified ? verified.coupon.ok : local.ok;
  const rowFor = (id: number, v: string | null) => verified?.lines.find((x) => x.productId === id && x.variant === v);

  const apply = async () => {
    if (!code.trim()) { setNote('Enter a code.'); return; }
    setNote('Checking…');
    try { const q = await ask({ ...request, coupon: code }); setNote(q.coupon.message || 'Enter a code.'); if (q.coupon.ok) { setCoupon(q.coupon.code); setCode(''); } }
    catch { setNote('We could not check that code just now. Please try again.'); }
  };
  const fixBag = () => {
    if (!verified) return;
    replaceLines(lines.flatMap((l) => { const r = rowFor(l.productId, l.variant); return !r ? [l] : r.counted ? [{ ...l, qty: r.qty, pricePaise: r.unitPricePaise }] : []; }));
    notify('Bag updated');
  };
  const status = checking ? 'Checking prices and stock…' : failed ? 'We could not double-check prices just now, so these totals are an estimate.' : verified ? 'Prices and stock checked by our server.' : '';

  return (
    <>
      <div onClick={closeDrawer} aria-hidden="true" className={`fixed inset-0 z-[80] bg-scrim/40 transition-opacity ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside ref={panel} role="dialog" aria-modal="true" aria-label="Shopping bag" aria-hidden={!drawerOpen} className={`fixed inset-y-0 right-0 z-[85] flex w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-300 ${drawerOpen ? '' : 'invisible translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4"><h2 className="font-serif text-2xl">Your bag</h2><button ref={closeRef} type="button" onClick={closeDrawer} aria-label="Close bag" className="h-10 w-10 text-2xl">×</button></div>
        <div className="flex-1 overflow-auto px-6 py-4">
          {lines.length === 0 ? (<div className="py-16 text-center"><p className="text-muted">Your bag is empty.</p><Link href="/shop" onClick={closeDrawer} className="mt-4 inline-block rounded-full bg-charcoal px-7 py-3 text-xs uppercase tracking-widest text-ivory">Continue shopping</Link></div>) : (
            <ul className="divide-y divide-charcoal/10">{lines.map((l) => {
              const r = rowFor(l.productId, l.variant);
              return (
                <li key={`${l.productId}-${l.variant}`} className="py-4"><div className="flex justify-between gap-3"><div><Link href={`/product/${l.slug}`} onClick={closeDrawer} className="font-serif text-lg">{l.name}</Link><p className="text-sm text-muted">{l.category}{l.variant ? ` · Size ${l.variant}` : ''}</p></div><p>{r ? (r.counted ? formatINR(r.lineTotalPaise) : '—') : formatINR(l.pricePaise * l.qty)}</p></div>
                  {r?.issues.map((i) => <p key={i} className="mt-1 text-xs text-gold-ink">{issueText(i, r.available, r.qty, r.unitPricePaise)}</p>)}
                  <div className="mt-2 flex items-center gap-4"><div className="flex items-center rounded-full border border-charcoal/20"><button type="button" aria-label={`Decrease ${l.name}`} className="h-9 w-9" onClick={() => setQty(l.productId, l.variant, l.qty - 1)}>−</button><span className="w-5 text-center">{l.qty}</span><button type="button" aria-label={`Increase ${l.name}`} className="h-9 w-9" onClick={() => setQty(l.productId, l.variant, l.qty + 1)}>+</button></div><button type="button" className="text-sm underline" onClick={() => remove(l.productId, l.variant)}>Remove</button></div></li>);
            })}</ul>)}
        </div>
        {lines.length > 0 && (
          <div className="space-y-3 border-t border-charcoal/10 px-6 py-5 text-sm">
            {verified?.hasIssues && <div role="alert" className="rounded-xl bg-cream px-3 py-2 text-xs">Some items in your bag have changed. <button type="button" onClick={fixBag} className="underline">Update bag</button></div>}
            <div className="flex gap-2"><label htmlFor="coupon" className="sr-only">Coupon code</label><input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="flex-1 rounded-full border border-charcoal/20 bg-surface px-4 py-2" /><button type="button" onClick={apply} className="rounded-full border border-charcoal px-5 py-2 text-xs uppercase tracking-widest">Apply</button></div>
            <p role="status" className="min-h-4 text-xs text-muted">{note || (verified ? verified.coupon.message : local.ok ? local.message : '')}{coupon && verified && !verified.coupon.ok && <> <button type="button" onClick={() => { setCoupon(''); setNote(''); }} className="underline">Remove code</button></>}</p>
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(shownSub)}</span></div>
            {couponOk && discount > 0 && <div className="flex justify-between text-success"><span>Discount ({coupon})</span><span>−{formatINR(discount)}</span></div>}
            <p className="text-xs text-muted">Shipping and applicable tax are calculated at checkout.</p>
            <div className="flex justify-between text-base font-medium"><span>Estimated total</span><span>{formatINR(total)}</span></div>
            <p className="text-xs text-muted" aria-live="polite">{status}</p>
            <Link href="/checkout" onClick={closeDrawer} className="block w-full rounded-full bg-charcoal py-3 text-center text-xs uppercase tracking-widest text-ivory transition hover:bg-plum">
              Checkout · {formatINR(total)}
            </Link>
            <button type="button" onClick={closeDrawer} className="w-full text-center text-xs uppercase tracking-widest underline">Continue shopping</button>
          </div>)}
      </aside>
    </>
  );
}
