import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import {
  ROLE_COOKIE, ROLE_SESSION_SECONDS,
  checkRoleCredentials, isSameSiteRequest, readRoleConfig, signRoleToken,
  type UserRole, type RoleConfig,
} from './role-auth-core';
import { verifyStaffToken } from './staff-session';

export { ROLE_COOKIE, ROLE_SESSION_SECONDS };
export type { UserRole };

/** Login paths per role — used for redirects. */
export const ROLE_LOGIN: Record<UserRole, string> = {
  owner: '/owner/login',
  admin: '/admin/login',
  manager: '/manager/login',
};

/** Dashboard home per role. */
export const ROLE_HOME: Record<UserRole, string> = {
  owner: '/owner',
  admin: '/admin',
  manager: '/manager',
};

export const roleCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: ROLE_SESSION_SECONDS,
});

export const roleConfig = (role: UserRole): { config: RoleConfig } | { config: null; reason: string } => {
  const r = readRoleConfig(role);
  return r.ok ? { config: r.config } : { config: null, reason: r.reason };
};

/** Returns the signed-in user for a given role, or null. */
export async function getRole(role: UserRole): Promise<{ email: string; role: UserRole } | null> {
  try {
    const cookieStore = await cookies();
    // Accepts the role token and, for admins, the older admin-login token as well (same cookie name).
    return verifyStaffToken(role, cookieStore.get(ROLE_COOKIE[role])?.value);
  } catch { return null; }
}

/** Returns the first role that is currently signed in (owner > admin > manager). */
export async function getAnyRole(): Promise<{ email: string; role: UserRole } | null> {
  for (const role of ['owner', 'admin', 'manager'] as UserRole[]) {
    const r = await getRole(role);
    if (r) return r;
  }
  return null;
}

/** For role-protected pages: redirects to the role's login page if not signed in. */
export async function requireRole(role: UserRole): Promise<{ email: string; role: UserRole }> {
  // 1. Direct role
  const r = await getRole(role);
  if (r) return r;

  // 2. Owner has 100% access to all roles
  if (role !== 'owner') {
    const owner = await getRole('owner');
    if (owner) return { email: owner.email, role: 'owner' };
  }

  // 3. Admin has access to manager role
  if (role === 'manager') {
    const admin = await getRole('admin');
    if (admin) return { email: admin.email, role: 'admin' };
  }

  redirect(ROLE_LOGIN[role]);
}

/** Signs a role in and sets the cookie on a response. */
export function signRoleIn(role: UserRole, res: NextResponse): boolean {
  const c = readRoleConfig(role);
  if (!c.ok) return false;
  res.cookies.set(ROLE_COOKIE[role], signRoleToken(c.config), roleCookieOptions());
  return true;
}

/** Clears the role cookie (sign-out). */
export function signRoleOut(role: UserRole, res: NextResponse) {
  res.cookies.set(ROLE_COOKIE[role], '', { ...roleCookieOptions(), maxAge: 0 });
}

/** For role API routes: must be signed in, and state-changing requests must come from this site. */
export async function requireRoleApi(
  req: Request, role: UserRole
): Promise<{ ok: true; email: string; role: UserRole } | { ok: false; res: NextResponse }> {
  const noStore = { 'Cache-Control': 'no-store' };
  const err = (status: number, error: string) => NextResponse.json({ error }, { status, headers: noStore });
  if (req.method !== 'GET' && req.method !== 'HEAD' && !isSameSiteRequest(req.headers))
    return { ok: false, res: err(403, 'Request blocked: it did not come from this site.') };

  // 1. Direct role
  const r = await getRole(role);
  if (r) return { ok: true, email: r.email, role: r.role };

  // 2. Owner access to all roles
  if (role !== 'owner') {
    const owner = await getRole('owner');
    if (owner) return { ok: true, email: owner.email, role: 'owner' };
  }

  // 3. Admin access to manager
  if (role === 'manager') {
    const admin = await getRole('admin');
    if (admin) return { ok: true, email: admin.email, role: 'admin' };
  }

  return { ok: false, res: err(401, 'Please sign in again.') };
}

/** Validates credentials for a role. Used by login API routes. */
export function validateRoleLogin(role: UserRole, email: string, password: string): boolean {
  const c = readRoleConfig(role);
  if (!c.ok) return false;
  return checkRoleCredentials(c.config, email, password);
}

export { isSameSiteRequest, readRoleConfig, signRoleToken };
