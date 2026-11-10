import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, isSameSiteRequest, readAdminConfig, type AdminConfig } from './admin-auth-core';
import type { UserRole } from './role-auth-core';
import { managerMayCall, resolveStaff, type StaffUser } from './staff-session';

export { ADMIN_COOKIE, ADMIN_SESSION_SECONDS };
export const adminCookieOptions = () => ({ httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: ADMIN_SESSION_SECONDS });

export const adminConfig = (): { config: AdminConfig } | { config: null; reason: string } => {
  const r = readAdminConfig();
  return r.ok ? { config: r.config } : { config: null, reason: r.reason };
};

/** Whoever is signed in to ANY dashboard (owner > admin > manager), or null. */
export async function getStaff(): Promise<StaffUser | null> {
  try { const store = await cookies(); return resolveStaff((n) => store.get(n)?.value); } catch { return null; }
}

/** The signed-in admin (an owner counts too: the owner can open everything). A manager does not count. */
export async function getAdmin(): Promise<{ email: string; role: UserRole } | null> {
  const s = await getStaff();
  return s && (s.role === 'owner' || s.role === 'admin') ? s : null;
}

/** For admin pages: send signed-out visitors to the sign-in page. */
export async function requireAdminPage(): Promise<{ email: string; role: UserRole }> {
  const a = await getAdmin(); if (!a) redirect('/admin/login'); return a;
}

const noStore = { 'Cache-Control': 'no-store' };
export const jsonError = (status: number, error: string) => NextResponse.json({ error }, { status, headers: noStore });

export type StaffApiResult = { ok: true; email: string; role: UserRole } | { ok: false; res: NextResponse };

/**
 * For admin API routes: must be signed in, and any change must come from this same site.
 * Owner and admin may call every /api/admin route. A manager may only call the order and stock routes.
 */
export async function requireAdminApi(req: Request): Promise<StaffApiResult> {
  if (req.method !== 'GET' && req.method !== 'HEAD' && !isSameSiteRequest(req.headers)) return { ok: false, res: jsonError(403, 'Request blocked: it did not come from this site.') };
  const s = await getStaff();
  if (!s) return { ok: false, res: jsonError(401, 'Please sign in again.') };
  if (s.role === 'manager') {
    let path = ''; try { path = new URL(req.url).pathname; } catch { /* ignore */ }
    if (!managerMayCall(path)) return { ok: false, res: jsonError(403, 'Your manager account cannot do that. Ask the owner or an admin.') };
  }
  return { ok: true, email: s.email, role: s.role };
}
