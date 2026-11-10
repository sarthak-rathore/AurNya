import { desc } from 'drizzle-orm';
import type { Db } from './client';
import { adminAudit } from './schema';

type Runner = Pick<Db, 'insert'>;
/** Writes one line to the activity history. Never throws: a logging problem must not undo a change the owner already made. */
export async function audit(db: Runner, actor: string, action: string, entity: string, entityId: string | number | null, summary = ''): Promise<void> {
  try { await db.insert(adminAudit).values({ actor, action, entity, entityId: entityId === null ? null : String(entityId), summary: summary.slice(0, 300) }); }
  catch (e) { console.error('[admin] could not write activity log', e); }
}

export const recentActivity = (db: Db, limit = 100) => db.select().from(adminAudit).orderBy(desc(adminAudit.id)).limit(limit);
