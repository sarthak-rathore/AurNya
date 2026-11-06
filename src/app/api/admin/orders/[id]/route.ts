import { getOrderDetail, saveAdminNote, transitionOrder, updateTracking } from '@/db/admin-orders';
import { AdminError } from '@/db/admin-errors';
import { sendOrderStatusUpdate } from '@/lib/email';
import { jsonError } from '@/lib/admin-auth';
import { adminRoute, ok } from '@/lib/admin-route';
import { refreshStore } from '@/lib/admin-revalidate';
import { orderActionSchema } from '@/lib/admin-schemas';
import { refundRazorpayPayment } from '@/lib/razorpay';

export const POST = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return jsonError(404, 'That order was not found.');
  return adminRoute(req, orderActionSchema, async ({ db, actor, body }) => {
    if (body.action === 'note') { await saveAdminNote(db, id, body.adminNote, actor); return ok(); }
    if (body.action === 'tracking') { await updateTracking(db, id, body, actor); return ok(); }
    // Optional: send the money back through Razorpay first. If Razorpay says no, the order is left exactly as it was.
    let refundNote = '';
    if (body.refundOnline && (body.to === 'refunded' || body.to === 'cancelled')) {
      const d = await getOrderDetail(db, id); if (!d) throw new AdminError(404, 'That order was not found.');
      if (d.order.paymentMethod !== 'razorpay' || !d.order.paymentId) throw new AdminError(400, 'This order has no online payment to refund.');
      if (d.order.status === 'refunded' || d.order.status === 'cancelled') throw new AdminError(409, 'This order is already closed.');
      const r = await refundRazorpayPayment(d.order.paymentId, d.order.totalPaise, `aur-${d.order.orderNumber}`);
      if (!r.ok) throw new AdminError(502, r.error);
      refundNote = `Refund ${r.refundId} sent to the customer's original payment method.`;
    }
    const r = await transitionOrder(db, id, { ...body, note: [body.note, refundNote].filter(Boolean).join(' ') || null }, actor);
    refreshStore();   // stock may have changed on a cancel
    sendOrderStatusUpdate(r.email, r.orderNumber, r.to, { courier: r.courier, trackingNumber: r.trackingNumber, trackingUrl: r.trackingUrl }, id).catch(console.error);
    return ok({ status: r.to });
  });
};
