import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, isSameSiteRequest, readAdminConfig, verifyAdminToken, type AdminConfig } from './admin-auth-core';

export { ADMIN_COOKIE, ADMIN_SESSION_SECONDS };
export const adminCookieOptions = () => ({ httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: ADMIN_SESSION_SECONDS });

export const adminConfig = (): { config: AdminConfig } | { config: null; reason: string } => {
  const r = readAdminConfig();
  return r.ok ? { config: r.config } : { config: null, reason: r.reason };
};

/** The signed-in admin, read from the cookie. Null when signed out or when admin sign-in is not configured. */
export async function getAdmin(): Promise<{ email: string } | null> {
  const c = readAdminConfig(); if (!c.ok) return null;
  try { return verifyAdminToken(c.config, (await cookies()).get(ADMIN_COOKIE)?.value); } catch { return null; }
}

/** For admin pages: send signed-out visitors to the sign-in page. */
export async function requireAdminPage(): Promise<{ email: string }> {
  const a = await getAdmin(); if (!a) redirect('/admin/login'); return a;
}

const noStore = { 'Cache-Control': 'no-store' };
export const jsonError = (status: number, error: string) => NextResponse.json({ error }, { status, headers: noStore });

/** For admin API routes: must be signed in, and any change must come from this same site. */
export async function requireAdminApi(req: Request): Promise<{ ok: true; email: string } | { ok: false; res: NextResponse }> {
  if (req.method !== 'GET' && req.method !== 'HEAD' && !isSameSiteRequest(req.headers)) return { ok: false, res: jsonError(403, 'Request blocked: it did not come from this site.') };
  const a = await getAdmin();
  if (!a) return { ok: false, res: jsonError(401, 'Please sign in again.') };
  return { ok: true, email: a.email };
}
