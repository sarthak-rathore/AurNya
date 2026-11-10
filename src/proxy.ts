import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin-auth-core';
import { ROLE_COOKIE } from '@/lib/role-auth-core';
import { adminMayOpen, managerMayOpen, verifyStaffToken } from '@/lib/staff-session';

// Runs BEFORE any dashboard page is built.
// If a user is not signed in for their role, redirect them to that role's login page.
// (Every page and API route checks again: this is the first gate, not the only one.)
const toLogin = (req: NextRequest, path: string) => {
  const url = req.nextUrl.clone();
  url.pathname = path;
  url.search = '';
  const res = NextResponse.redirect(url);
  res.headers.set('Cache-Control', 'no-store');
  return res;
};
const redirectTo = (req: NextRequest, path: string) => {
  const url = req.nextUrl.clone();
  url.pathname = path;
  url.search = '';
  return NextResponse.redirect(url);
};

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sign-in pages are always accessible
  if (pathname === '/admin/login' || pathname === '/owner/login' || pathname === '/manager/login') return NextResponse.next();

  const owner = verifyStaffToken('owner', req.cookies.get(ROLE_COOKIE.owner)?.value);
  const admin = verifyStaffToken('admin', req.cookies.get(ADMIN_COOKIE)?.value);
  const manager = verifyStaffToken('manager', req.cookies.get(ROLE_COOKIE.manager)?.value);

  // Owner has access to /owner, /admin and /manager
  if (owner) return NextResponse.next();

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!admin) return toLogin(req, '/admin/login');
    // Owner-only sections: Users, Payments, Settings, WhatsApp delivery
    if (!adminMayOpen(pathname)) return redirectTo(req, '/admin');
    return NextResponse.next();
  }

  if (pathname === '/owner' || pathname.startsWith('/owner/')) return toLogin(req, '/owner/login');

  if (pathname === '/manager' || pathname.startsWith('/manager/')) {
    if (!manager && !admin) return toLogin(req, '/manager/login');
    if (!managerMayOpen(pathname)) return redirectTo(req, '/manager');
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/owner', '/owner/:path*', '/manager', '/manager/:path*'],
};
