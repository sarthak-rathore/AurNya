import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROLE_COOKIE, readRoleConfig, verifyRoleToken } from '@/lib/role-auth-core';
import { RoleLoginForm } from '@/components/admin/role-login-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Owner Sign In' };

export default async function OwnerLogin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ROLE_COOKIE.owner)?.value;
  const c = readRoleConfig('owner');

  if (c.ok && token) {
    const verified = verifyRoleToken(c.config, token);
    if (verified) redirect('/owner');
  }

  return c.ok
    ? <RoleLoginForm role="owner" />
    : (
      <div className="min-h-screen bg-[#0F0D13] flex items-center justify-center p-4" data-theme="dark">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 max-w-sm text-sm text-amber-300">
          <p className="font-semibold mb-2">Owner portal not configured</p>
          <p className="text-amber-400/70">{c.reason}</p>
        </div>
      </div>
    );
}
