'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatINR } from '@/lib/money';
import { estimatedDeliveryRange } from '@/lib/shipping';

/* ── Types ──────────────────────────────────────────────────────────── */
interface OrderRow {
  id: string; orderNumber: number; status: string; email: string; phone?: string | null;
  shippingAddress: Record<string, string> | null;
  couponCode?: string | null;
  subtotalPaise: number; discountPaise: number; shippingPaise: number; taxPaise: number; totalPaise: number;
  paymentMethod: string; paymentId?: string | null;
  createdAt: string;
}
interface OrderItem {
  id: number; nameSnapshot: string; skuSnapshot: string;
  optionLabelSnapshot?: string | null; optionValueSnapshot?: string | null;
  unitPricePaise: number; qty: number; lineTotalPaise: number;
}
interface OrderEvent {
  id: number; status: string; note?: string | null; createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Awaiting payment', color: 'bg-amber-100 text-amber-800' },
  paid:            { label: 'Payment confirmed', color: 'bg-emerald-100 text-emerald-800' },
  packed:          { label: 'Being packed', color: 'bg-blue-100 text-blue-800' },
  shipped:         { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800' },
  delivered:       { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled:       { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  refunded:        { label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
};

export function OrderClient({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get('placed') === '1';

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Guest lookup: email + orderNumber from URL params
  const guestEmail = searchParams.get('email');
  const guestOrderNumber = searchParams.get('orderNumber');

  useEffect(() => {
    let url = `/api/orders/${orderId}`;
    const params = new URLSearchParams();
    if (guestEmail) params.set('email', guestEmail);
    if (guestOrderNumber) params.set('orderNumber', guestOrderNumber);
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error ?? 'Not found')))
      .then((d: { order: OrderRow; items: OrderItem[]; events: OrderEvent[] }) => {
        setOrder(d.order);
        setItems(d.items);
        setEvents(d.events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      })
      .catch((e: string) => setError(typeof e === 'string' ? e : 'Could not load order.'))
      .finally(() => setLoading(false));
  }, [orderId, guestEmail, guestOrderNumber]);

  if (loading) return <div className="py-24 text-center text-muted">Loading order…</div>;
  if (error || !order) return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="text-muted">{error || 'Order not found.'}</p>
      <Link href="/shop" className="mt-6 inline-block rounded-full bg-charcoal px-7 py-3 text-xs uppercase tracking-widest text-ivory">Shop now</Link>
    </div>
  );

  const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-surface text-muted' };
  const addr = order.shippingAddress;
  const delivery = estimatedDeliveryRange(new Date(order.createdAt));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-10">

      {/* Confirmation header */}
      {justPlaced && (
        <div className="mb-8 rounded-3xl bg-sage/30 p-8 text-center">
          <div className="mb-3 text-4xl">✓</div>
          <h1 className="font-serif text-4xl">Order placed!</h1>
          <p className="mt-2 text-muted">Thank you! A confirmation email is on its way to <strong>{order.email}</strong>.</p>
        </div>
      )}

      {!justPlaced && <h1 className="mb-8 font-serif text-5xl">Your order</h1>}

      {/* Order header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[.12em] text-muted">Order #{order.orderNumber}</p>
          <p className="text-sm text-muted">{fmtDate(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
      </div>

      <div className="space-y-6">
        {/* Items */}
        <section className="rounded-3xl border border-charcoal/10 bg-ivory p-6">
          <h2 className="mb-4 font-serif text-2xl">Items</h2>
          <ul className="divide-y divide-charcoal/10">
            {items.map(item => (
              <li key={item.id} className="flex justify-between py-3 text-sm">
                <span>
                  {item.nameSnapshot}
                  {item.optionValueSnapshot ? ` · Size ${item.optionValueSnapshot}` : ''}
                  {' '}× {item.qty}
                </span>
                <span>{formatINR(item.lineTotalPaise)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-charcoal/10 pt-4 text-sm">
            <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatINR(order.subtotalPaise)}</span></div>
            {order.discountPaise > 0 && <div className="flex justify-between text-success"><span>Discount ({order.couponCode})</span><span>−{formatINR(order.discountPaise)}</span></div>}
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span>{order.shippingPaise === 0 ? 'Free' : formatINR(order.shippingPaise)}</span>
            </div>
            <div className="flex justify-between border-t border-charcoal/10 pt-2 text-base font-medium">
              <span>Total</span><span>{formatINR(order.totalPaise)}</span>
            </div>
            <p className="text-xs text-muted">
              Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online'}{order.paymentId ? ` · Ref: ${order.paymentId}` : ''}
            </p>
          </div>
        </section>

        {/* Shipping address */}
        {addr && (
          <section className="rounded-3xl border border-charcoal/10 bg-ivory p-6">
            <h2 className="mb-4 font-serif text-2xl">Shipping to</h2>
            <p className="font-medium">{addr.recipientName}</p>
            <p className="text-sm text-muted">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
            <p className="text-sm text-muted">{addr.city}, {addr.state} {addr.pincode}</p>
            <p className="text-sm text-muted">{addr.country}{addr.phone ? ` · ${addr.phone}` : ''}</p>
            <div className="mt-4 rounded-xl bg-sage/20 px-4 py-3">
              <p className="text-sm font-medium">Estimated delivery: {delivery.from} – {delivery.to}</p>
              <p className="text-xs text-muted">3–7 business days after dispatch</p>
            </div>
          </section>
        )}

        {/* Order timeline */}
        <section className="rounded-3xl border border-charcoal/10 bg-ivory p-6">
          <h2 className="mb-4 font-serif text-2xl">Order timeline</h2>
          <ol className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-charcoal/10">
            {events.map((ev) => {
              const st = STATUS_LABELS[ev.status] ?? { label: ev.status, color: '' };
              return (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-charcoal/20 bg-ivory" />
                  <p className="text-sm font-medium">{st.label}</p>
                  {ev.note && <p className="text-xs text-muted">{ev.note}</p>}
                  <p className="text-xs text-muted">{fmtDate(ev.createdAt)}</p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className="rounded-full bg-charcoal px-7 py-3 text-xs uppercase tracking-widest text-ivory hover:bg-plum">Continue shopping</Link>
        <Link href="/account" className="rounded-full border border-charcoal px-7 py-3 text-xs uppercase tracking-widest hover:bg-charcoal hover:text-ivory">My account</Link>
      </div>
    </div>
  );
}
