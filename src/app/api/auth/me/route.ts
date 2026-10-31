import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUserById, getWishlistIds } from '@/db/accounts';
import { getDb } from '@/db/client';

export async function GET() {
  if (!getDb()) return NextResponse.json({ user: null });
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ user: null });
  const user = await getUserById(session.sub);
  if (!user) return NextResponse.json({ user: null });
  const wishlistIds = await getWishlistIds(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone }, wishlistIds });
}
