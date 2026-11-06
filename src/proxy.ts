import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, readAdminConfig, verifyAdminToken } from '@/lib/admin-auth-core';

// Runs BEFORE any admin page is built. A visitor who is not signed in as admin is sent to the sign-in page and
// nothing from the dashboard is rendered for them. (Every admin page and API route also checks for itself.)
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();
  const cfg = readAdminConfig();
  const ok = cfg.ok && verifyAdminToken(cfg.config, req.cookies.get(ADMIN_COOKIE)?.value);
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone(); url.pathname = '/admin/login'; url.search = '';
  const res = NextResponse.redirect(url); res.headers.set('Cache-Control', 'no-store'); return res;
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
