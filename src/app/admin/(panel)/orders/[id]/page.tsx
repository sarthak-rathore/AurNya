import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Money, NeedsDatabase, PageHeader, StatusBadge, td, th } from '@/components/admin/ui';
import { getOrderDetail } from '@/db/admin-orders';
import { getDb } from '@/db/client';
import { formatIstDateTime, whatsappDigits } from '@/lib/admin-format';
import { STATUS_LABEL, allowedNext, type OrderStatus, type PayMethod } from '@/lib/order-status';
import { OrderActions } from './order-actions';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'Order' };
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();   // the sign-in check must come first: pages build in parallel with their layout
  const { id } = await params; const db = getDb();
  if (!db) return <><PageHeader title="Order" /><NeedsDatabase /></>;
  const d = await getOrderDetail(db, id); if (!d) notFound();
  const { order: o, items, events, account } = d;
  const status = o.status as OrderStatus; const method = (o.paymentMethod === 'cod' ? 'cod' : 'razorpay') as PayMethod;
  const ad = (o.shippingAddress ?? {}) as Record<string, string | null>;
  const wa = whatsappDigits(o.phone ?? ad.phone);
  return (
    <>
      <PageHeader title={`Order #${o.orderNumber}`} sub={`Placed ${formatIstDateTime(o.createdAt)}`}
        actions={<StatusBadge status={status} />} />
      <p className="mb-4 text-sm print:hidden"><Link href="/admin/orders" className="underline">← All orders</Link></p>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="Items">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Item</th><th className={th}>SKU</th><th className={th}>Price</th><th className={th}>Qty</th><th className={`${th} text-right`}>Total</th></tr></thead><tbody className="divide-y divide-charcoal/10">
              {items.map((i) => <tr key={i.id}><td className={td}>{i.productId ? <Link className="underline" href={`/admin/products/${i.productId}`}>{i.nameSnapshot}</Link> : i.nameSnapshot}{i.optionValueSnapshot && <span className="block text-xs text-muted">{i.optionLabelSnapshot ?? 'Option'}: {i.optionValueSnapshot}</span>}</td><td className={`${td} text-muted`}>{i.skuSnapshot}</td><td className={td}><Money paise={i.unitPricePaise} /></td><td className={td}>{i.qty}</td><td className={`${td} text-right`}><Money paise={i.lineTotalPaise} /></td></tr>)}
            </tbody></table></div>
            <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd><Money paise={o.subtotalPaise} /></dd></div>
              {o.discountPaise > 0 && <div className="flex justify-between"><dt className="text-muted">Discount ({o.couponCode})</dt><dd>−<Money paise={o.discountPaise} /></dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{o.shippingPaise === 0 ? 'Free' : <Money paise={o.shippingPaise} />}</dd></div>
              <div className="flex justify-between border-t border-charcoal/10 pt-2 text-base font-medium"><dt>Total</dt><dd><Money paise={o.totalPaise} /></dd></div>
              {method === 'cod' && <p className="pt-1 text-xs text-gold-ink">Collect {`₹${(o.totalPaise / 100).toLocaleString('en-IN')}`} in cash on delivery.</p>}
            </dl>
          </Card>
          <Card title="Timeline">
            <p className="mb-3 text-xs text-muted print:hidden">The customer sees these notes on their order page.</p>
            <ol className="space-y-3 text-sm">{events.map((e) => <li key={e.id} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-ink" /><span><strong>{STATUS_LABEL[e.status as OrderStatus] ?? e.status}</strong> <span className="text-muted">· {formatIstDateTime(e.createdAt)}</span>{e.note && <span className="block text-muted">{e.note}</span>}</span></li>)}</ol>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Ship to">
            <address className="text-sm not-italic leading-relaxed"><strong>{ad.recipientName}</strong><br />{ad.line1}{ad.line2 ? <>, {ad.line2}</> : null}<br />{ad.city}, {ad.state} {ad.pincode}<br />{ad.country}</address>
            <p className="mt-3 text-sm"><a className="underline" href={`mailto:${o.email}`}>{o.email}</a>{(o.phone ?? ad.phone) && <><br /><a className="underline" href={`tel:${o.phone ?? ad.phone}`}>{o.phone ?? ad.phone}</a></>}</p>
            {wa && <p className="mt-2 text-sm print:hidden"><a className="underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${ad.recipientName ?? ''}, this is AurNya about your order #${o.orderNumber}.`)}`}>Message on WhatsApp ↗</a></p>}
            {account && <p className="mt-2 text-xs text-muted">Has an account: {account.firstName} {account.lastName}</p>}
          </Card>
          <Card title="Payment">
            <p className="text-sm">{method === 'cod' ? 'Cash on delivery' : 'Online (Razorpay)'}{o.paymentId && <><br /><span className="text-muted">Reference: {o.paymentId}</span></>}</p>
          </Card>
          {(o.courier || o.trackingNumber) && <Card title="Tracking"><p className="text-sm">Courier: <strong>{o.courier}</strong>{o.trackingNumber && <><br />Number: <strong>{o.trackingNumber}</strong></>}{o.trackingUrl && <><br /><a className="underline" href={o.trackingUrl} target="_blank" rel="noopener noreferrer">Open tracking link ↗</a></>}</p></Card>}
          <OrderActions orderId={o.id} status={status} next={allowedNext(status, method)} method={method} hasOnlinePayment={method === 'razorpay' && !!o.paymentId} adminNote={o.adminNote ?? ''} courier={o.courier ?? ''} trackingNumber={o.trackingNumber ?? ''} trackingUrl={o.trackingUrl ?? ''} stockHeld={o.stockHeld} />
        </div>
      </div>
    </>
  );
}
