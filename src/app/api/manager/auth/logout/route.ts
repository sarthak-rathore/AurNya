import { NextResponse } from 'next/server';
import { ROLE_COOKIE, roleCookieOptions } from '@/lib/role-auth';

export async function POST() {
  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set(ROLE_COOKIE.manager, '', { ...roleCookieOptions(), maxAge: 0 });
  return res;
}
