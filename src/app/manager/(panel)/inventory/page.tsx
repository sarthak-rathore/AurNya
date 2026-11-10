import { requireRole } from '@/lib/role-auth';
import { InventoryView } from '@/components/admin/inventory-view';

export const metadata = { title: 'Inventory' };
export default async function Inventory({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole('manager');
  return <InventoryView base="/manager" sp={await searchParams} />;
}
