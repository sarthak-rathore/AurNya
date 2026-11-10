import { ADMIN_COOKIE, readAdminConfig, verifyAdminToken } from './admin-auth-core';
import { ROLE_COOKIE, readRoleConfig, verifyRoleToken, type UserRole } from './role-auth-core';

/*
 * One place that answers "who is signed in?" for owner, admin and manager (pure: no Next.js imports, so the
 * proxy, the pages and the API routes all use exactly the same rule).
 *
 * Why this exists: the admin sign-in page historically set a "legacy admin" cookie (signed by admin-auth-core) while
 * role-checked pages (requireRole('admin')) only understood the newer role token. Both use the cookie name `aur_admin`,
 * so an admin could open the dashboard but was bounced back to the login page from Orders. Now both token formats
 * are accepted everywhere.
 */
export interface StaffUser { email: string; role: UserRole }
type Env = Record<string, string | undefined>;

/** Verifies the cookie value for ONE role. The admin role also accepts the legacy admin token. */
export function verifyStaffToken(role: UserRole, token: string | undefined | null, env: Env = process.env, now = Date.now()): StaffUser | null {
  if (!token) return null;
  const rc = readRoleConfig(role, env);
  if (rc.ok) { const v = verifyRoleToken(rc.config, token, now); if (v) return { email: v.email, role }; }
  if (role === 'admin') {
    const lc = readAdminConfig(env);
    if (lc.ok) { const v = verifyAdminToken(lc.config, token, now); if (v) return { email: v.email, role: 'admin' }; }
  }
  return null;
}

/** The signed-in staff member, highest role first (owner > admin > manager). `get` reads a cookie by name. */
export function resolveStaff(get: (name: string) => string | undefined, env: Env = process.env, now = Date.now()): StaffUser | null {
  for (const role of ['owner', 'admin', 'manager'] as UserRole[]) {
    const cookieName = role === 'admin' ? ADMIN_COOKIE : ROLE_COOKIE[role];
    const u = verifyStaffToken(role, get(cookieName), env, now);
    if (u) return u;
  }
  return null;
}

/** Which dashboard areas each role may open (used by the proxy). Owner may open everything. */
export const MANAGER_PAGES = ['/manager', '/manager/orders', '/manager/products', '/manager/inventory', '/manager/approvals'] as const;
export const ADMIN_BLOCKED = ['/admin/users', '/admin/settings', '/admin/payments', '/admin/whatsapp'] as const;

const under = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/** True when a manager may open this /manager page. `/manager` itself only matches exactly (the old check let every sub-path through). */
export function managerMayOpen(pathname: string): boolean {
  if (pathname === '/manager') return true;
  return MANAGER_PAGES.filter((p) => p !== '/manager').some((p) => under(pathname, p));
}
export const adminMayOpen = (pathname: string): boolean => !ADMIN_BLOCKED.some((p) => under(pathname, p));

/** API areas a manager may call. Everything else under /api/admin is for admin and owner only. */
export const MANAGER_API = ['/api/admin/orders', '/api/admin/inventory'] as const;
export const managerMayCall = (pathname: string): boolean => MANAGER_API.some((p) => under(pathname, p));
