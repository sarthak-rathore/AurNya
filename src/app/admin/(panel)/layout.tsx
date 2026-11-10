import { DarkShell } from '@/components/admin/dark-shell';
import { requireAdminPage } from '@/lib/admin-auth';
import { shellCounts } from '@/lib/shell-counts';

export const dynamic = 'force-dynamic';
export default async function Panel({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const c = await shellCounts();
  // An owner who opens /admin sees the owner's own dashboard chrome and tools, not the admin's.
  return (
    <DarkShell email={admin.email} role={admin.role === 'owner' ? 'owner' : 'admin'} todo={c.todo} lowStock={c.lowStock}>
      {children}
    </DarkShell>
  );
}
