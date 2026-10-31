import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, signToken, SESSION_COOKIE } from '@/lib/auth';
import { createUser, getUserByEmail } from '@/db/accounts';
import { getDb } from '@/db/client';

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).default(''),
  phone: z.string().max(20).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const data = schema.parse(body);
    const existing = await getUserByEmail(data.email);
    if (existing) return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    const passwordHash = await hashPassword(data.password);
    const user = await createUser({ email: data.email, passwordHash, firstName: data.firstName, lastName: data.lastName, phone: data.phone });
    const token = await signToken({ sub: user.id, email: user.email });
    const res = NextResponse.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    console.error('register error', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
