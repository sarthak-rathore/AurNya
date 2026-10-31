import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getUserById, getAddresses } from '@/db/accounts';
import { getDb } from '@/db/client';
import { orders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { memoryStore } from '@/db/memory-store';
import { AccountClient } from './account-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Account', robots: { index: false } };

export default async function AccountPage() {
  const session = await getSessionUser();
  if (!session) redirect('/?auth=login');
  const [user, addresses, db] = await Promise.all([
    getUserById(session.sub),
    getAddresses(session.sub),
    Promise.resolve(getDb()),
  ]);
  if (!user) redirect('/?auth=login');
  const userOrders = db
    ? await db.select().from(orders).where(eq(orders.userId, session.sub)).orderBy(desc(orders.createdAt)).limit(20)
    : (memoryStore.orders.filter(o => o.userId === session.sub).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20) as unknown as typeof orders.$inferSelect[]);
  return <AccountClient user={user} addresses={addresses} orders={userOrders} />;
}
