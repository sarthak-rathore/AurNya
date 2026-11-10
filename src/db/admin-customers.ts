import { desc, sql } from 'drizzle-orm';
import type { Db } from './client';
import { users } from './schema';

// Drizzle drops the table name in single-table selects, which makes a bare "id" ambiguous inside a sub-query. Spell it out.
const uid = sql.raw('"users"."id"');

export interface CustomerRow { id: string; name: string; email: string; phone: string | null; orders: number; spentPaise: number; city: string; joined: Date; whatsapp: boolean }

/** Customers with how many orders they placed and how much they spent (cancelled and refunded orders do not count). Newest first, capped. */
export async function listCustomers(db: Db, limit = 500): Promise<{ rows: CustomerRow[]; total: number }> {
  const rows = await db.select({
    id: users.id, first: users.firstName, last: users.lastName, email: users.email, phone: users.phone, joined: users.createdAt,
    optIn: users.whatsappOptInAt, optOut: users.whatsappOptedOutAt,
    orders: sql<number>`coalesce((select count(*) from orders o where o.user_id = ${uid} and o.status not in ('cancelled','refunded','pending_payment')), 0)::int`,
    spent: sql<number>`coalesce((select sum(o.total_paise) from orders o where o.user_id = ${uid} and o.status not in ('cancelled','refunded','pending_payment')), 0)::float8`,
    city: sql<string | null>`(select a.city from user_addresses a where a.user_id = ${uid} order by a.is_default desc, a.id asc limit 1)`,
  }).from(users).orderBy(desc(users.createdAt)).limit(limit);
  const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  return {
    total: Number(t?.n ?? rows.length),
    rows: rows.map((r) => ({
      id: r.id, name: `${r.first} ${r.last}`.trim() || r.email.split('@')[0]!, email: r.email, phone: r.phone, orders: Number(r.orders), spentPaise: Number(r.spent),
      city: r.city ?? '—', joined: r.joined, whatsapp: !!r.optIn && (!r.optOut || r.optOut < r.optIn),
    })),
  };
}
