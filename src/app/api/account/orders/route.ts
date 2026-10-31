import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/db/client';
import { orders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { memoryStore } from '@/db/memory-store';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  if (!db) {
    const memOrders = memoryStore.orders
      .filter((o) => o.userId === session.sub)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
    return NextResponse.json({ orders: memOrders });
  }
  const userOrders = await db.select().from(orders).where(eq(orders.userId, session.sub)).orderBy(desc(orders.createdAt)).limit(50);
  return NextResponse.json({ orders: userOrders });
}
