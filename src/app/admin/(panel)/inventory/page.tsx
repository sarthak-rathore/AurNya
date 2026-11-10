import { requireAdminPage } from '@/lib/admin-auth';
import { InventoryView } from '@/components/admin/inventory-view';

export const metadata = { title: 'Inventory' };
export default async function Inventory({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage();
  return <InventoryView base="/admin" sp={await searchParams} />;
}
