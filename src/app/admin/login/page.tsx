import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, readAdminConfig, verifyAdminToken } from '@/lib/admin-auth-core';
import { RoleLoginForm } from '@/components/admin/role-login-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin Sign In' };

export default async function AdminLogin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const c = readAdminConfig();

  if (c.ok && token) {
    const verified = verifyAdminToken(c.config, token);
    if (verified) redirect('/admin');
  }

  return c.ok
    ? <RoleLoginForm role="admin" />
    : (
      <div className="min-h-screen bg-[#0F0D13] flex items-center justify-center p-4" data-theme="dark">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6 max-w-sm text-sm text-blue-300">
          <p className="font-semibold mb-2">Admin portal not configured</p>
          <p className="text-blue-400/70">{c.reason}</p>
        </div>
      </div>
    );
}
