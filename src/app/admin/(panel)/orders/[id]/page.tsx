import { requireAdminPage } from '@/lib/admin-auth';
import { OrderDetailView } from '@/components/admin/order-detail-view';

export const metadata = { title: 'Order' };
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();   // the sign-in check must come first: pages build in parallel with their layout
  const { id } = await params;
  return <OrderDetailView id={id} base="/admin" />;
}
