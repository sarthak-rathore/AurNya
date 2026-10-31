import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OrderClient } from './order-client';

export const metadata: Metadata = {
  title: 'Order Confirmation',
  robots: { index: false },
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted">Loading order…</div>}>
      <OrderClient orderId={id} />
    </Suspense>
  );
}
