import { DarkShell } from '@/components/admin/dark-shell';
import { requireRole } from '@/lib/role-auth';
import { shellCounts } from '@/lib/shell-counts';

export const dynamic = 'force-dynamic';
export default async function OwnerPanel({ children }: { children: React.ReactNode }) {
  const user = await requireRole('owner');
  const c = await shellCounts();
  return (
    <DarkShell email={user.email} role="owner" todo={c.todo} lowStock={c.lowStock}>
      {children}
    </DarkShell>
  );
}
