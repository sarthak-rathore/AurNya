import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROLE_COOKIE, readRoleConfig, verifyRoleToken } from '@/lib/role-auth-core';
import { RoleLoginForm } from '@/components/admin/role-login-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manager Sign In' };

export default async function ManagerLogin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ROLE_COOKIE.manager)?.value;
  const c = readRoleConfig('manager');

  if (c.ok && token) {
    const verified = verifyRoleToken(c.config, token);
    if (verified) redirect('/manager');
  }

  return c.ok
    ? <RoleLoginForm role="manager" />
    : (
      <div className="min-h-screen bg-[#0F0D13] flex items-center justify-center p-4" data-theme="dark">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 max-w-sm text-sm text-emerald-300">
          <p className="font-semibold mb-2">Manager portal not configured</p>
          <p className="text-emerald-400/70">{c.reason}</p>
        </div>
      </div>
    );
}
