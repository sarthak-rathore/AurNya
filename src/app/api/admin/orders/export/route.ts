import { NextResponse } from 'next/server';
import { exportOrders } from '@/db/admin-orders';
import { getDb } from '@/db/client';
import { jsonError, requireAdminApi } from '@/lib/admin-auth';
import { formatIstDateTime, paiseToRupees } from '@/lib/admin-format';
import { toCsv } from '@/lib/csv';
import { isOrderStatus, STATUS_LABEL } from '@/lib/order-status';

export async function GET(req: Request) {
  const a = await requireAdminApi(req); if (!a.ok) return a.res;
  const db = getDb(); if (!db) return jsonError(503, 'The admin dashboard needs a database.');
  const sp = new URL(req.url).searchParams; const status = sp.get('status') ?? '';
  const rows = await exportOrders(db, { status: isOrderStatus(status) ? status : undefined, q: sp.get('q') ?? undefined });
  const rs = (n: number) => paiseToRupees(n) || '0';
  const csv = toCsv([['Order', 'Date (IST)', 'Status', 'Customer', 'Email', 'Phone', 'Items', 'Subtotal (INR)', 'Discount (INR)', 'Shipping (INR)', 'Total (INR)', 'Coupon', 'Payment', 'Payment ref', 'Courier', 'Tracking', 'Ship to'],
    ...rows.map(({ o, items }) => { const ad = (o.shippingAddress ?? {}) as Record<string, string>; return [o.orderNumber, formatIstDateTime(o.createdAt), STATUS_LABEL[o.status], ad.recipientName, o.email, o.phone, items, rs(o.subtotalPaise), rs(o.discountPaise), rs(o.shippingPaise), rs(o.totalPaise), o.couponCode, o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online', o.paymentId, o.courier, o.trackingNumber, [ad.line1, ad.line2, ad.city, ad.state, ad.pincode].filter(Boolean).join(', ')]; })]);
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="aurnya-orders-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' } });
}
