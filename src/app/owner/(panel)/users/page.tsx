import { Card, PageHeader, td, th } from '@/components/admin/ui';
import { requireRole } from '@/lib/role-auth';
import { readRoleConfig, type UserRole } from '@/lib/role-auth-core';

export const metadata = { title: 'Users & Access' };
export const dynamic = 'force-dynamic';

const ROLES: { role: UserRole; label: string; can: string }[] = [
  { role: 'owner', label: 'Owner', can: 'Everything. Approves or rejects every change made by the admin and the manager.' },
  { role: 'admin', label: 'Admin', can: 'Products, stock, orders, coupons, website content, marketing. Every change waits for the owner’s approval.' },
  { role: 'manager', label: 'Manager', can: 'Orders and stock only. Every change waits for the owner’s approval.' },
];

/** Who can sign in to the dashboards. These accounts live in your environment file (not the database), so this screen only shows them. */
export default async function UsersPage() {
  await requireRole('owner');
  const rows = ROLES.map((r) => { const c = readRoleConfig(r.role); return { ...r, email: c.ok ? c.config.email : null, reason: c.ok ? '' : c.reason }; });
  return (
    <div className="space-y-6">
      <PageHeader title="Users & Access" sub="The people who can sign in to the dashboards. Their emails and passwords are set in your environment file." />
      <Card className="!p-0">
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr><th className={th}>Role</th><th className={th}>Sign-in email</th><th className={th}>What they can do</th><th className={th}>Status</th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.role}><td className={`${td} font-semibold`}>{r.label}</td><td className={td}>{r.email ?? '—'}</td><td className={`${td} text-[#8E869B]`}>{r.can}</td>
                <td className={td}>{r.email ? <span className="text-[#4ADE80]">Active</span> : <span className="text-[#E5B558]">Not set up</span>}</td></tr>
            ))}
          </tbody></table></div>
      </Card>
      <Card title="How to add or change a person">
        <ol className="list-decimal space-y-1 pl-5 text-xs text-[#C7C0D2]">
          <li>Open your environment file (<code>.env.local</code>, or Environment Variables on your host).</li>
          <li>Set <code>OWNER_EMAIL</code> / <code>OWNER_PASSWORD</code>, <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code> and <code>MANAGER_EMAIL</code> / <code>MANAGER_PASSWORD</code>.</li>
          <li>Restart (or redeploy) the site. The old password stops working straight away.</li>
        </ol>
      </Card>
    </div>
  );
}
