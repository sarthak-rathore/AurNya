// The life of an order, in one place. The admin dashboard only ever offers (and the server only ever accepts) the moves listed here.

export const ORDER_STATUSES = ['pending_payment', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PayMethod = 'razorpay' | 'cod';

export const isOrderStatus = (v: unknown): v is OrderStatus => typeof v === 'string' && (ORDER_STATUSES as readonly string[]).includes(v);

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment', paid: 'Paid', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
};
/** What the owner clicks to make each move. */
export const ACTION_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment', paid: 'Mark as paid', packed: 'Mark as packed', shipped: 'Mark as shipped', delivered: 'Mark as delivered', cancelled: 'Cancel order', refunded: 'Refund order',
};

/**
 * Where an order may go next.
 *  - Cash on delivery orders are confirmed by the owner, so they may be packed straight from "awaiting payment".
 *  - Online orders become "paid" by Razorpay itself (the payment check and the webhook). The owner can still mark one paid by hand if the webhook was missed.
 *  - Cancelled and refunded are final.
 */
export function allowedNext(status: OrderStatus, method: PayMethod): OrderStatus[] {
  switch (status) {
    case 'pending_payment': return method === 'cod' ? ['packed', 'paid', 'cancelled'] : ['paid', 'cancelled'];
    case 'paid': return ['packed', 'cancelled', 'refunded'];
    case 'packed': return ['shipped', 'cancelled', 'refunded'];
    case 'shipped': return ['delivered', 'refunded'];
    case 'delivered': return ['refunded'];
    default: return [];
  }
}
export const canTransition = (from: OrderStatus, to: OrderStatus, method: PayMethod): boolean => allowedNext(from, method).includes(to);

/** Orders that count as real sales in the dashboard numbers. */
export const SALE_STATUSES: readonly OrderStatus[] = ['paid', 'packed', 'shipped', 'delivered'];

export const STATUS_TONE: Record<OrderStatus, string> = {
  pending_payment: 'bg-amber-100 text-amber-900', paid: 'bg-emerald-100 text-emerald-900', packed: 'bg-sky-100 text-sky-900',
  shipped: 'bg-indigo-100 text-indigo-900', delivered: 'bg-green-100 text-green-900', cancelled: 'bg-red-100 text-red-800', refunded: 'bg-zinc-200 text-zinc-800',
};

/** How long an unpaid online order may hold its stock before it is released (minutes). */
export const UNPAID_HOLD_MINUTES = 60;
