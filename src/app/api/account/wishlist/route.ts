import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getWishlistIds, toggleWishlistItem } from '@/db/accounts';
import { getDb } from '@/db/client';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ids: [] });
  return NextResponse.json({ ids: await getWishlistIds(session.sub) });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { productId } = await req.json() as { productId: number };
  const isNowInWishlist = await toggleWishlistItem(session.sub, productId);
  return NextResponse.json({ inWishlist: isNowInWishlist });
}
