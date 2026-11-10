import { requireRole } from '@/lib/role-auth';
import { OrderDetailView } from '@/components/admin/order-detail-view';

export const metadata = { title: 'Order' };
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('owner');   // the sign-in check must come first: pages build in parallel with their layout
  const { id } = await params;
  return <OrderDetailView id={id} base="/owner" />;
}
