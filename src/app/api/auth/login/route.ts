import { after, NextResponse } from 'next/server';
import { onCustomerSignIn } from '@/lib/whatsapp';
import { z } from 'zod';
import { verifyPassword, signToken, SESSION_COOKIE } from '@/lib/auth';
import { getUserByEmail, syncWishlist } from '@/db/accounts';
import { getDb } from '@/db/client';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  wishlistIds: z.array(z.number()).default([]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const data = schema.parse(body);
    const user = await getUserByEmail(data.email);
    if (!user) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    if (data.wishlistIds.length > 0) await syncWishlist(user.id, data.wishlistIds);
    const token = await signToken({ sub: user.id, email: user.email });
    const res = NextResponse.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
    after(() => onCustomerSignIn(user.id).catch((e) => console.error('[whatsapp] sign-in', e)));   // subscribe + welcome, after the response is sent
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    console.error('login error', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
