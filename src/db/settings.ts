import { eq, sql } from 'drizzle-orm';
import type { Db } from './client';
import { settings } from './schema';

/** Reads one setting. Returns null when it does not exist. The caller must validate the shape (see parseAnnouncement). */
export async function readSetting(db: Db, key: string): Promise<unknown | null> {
  const [r] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1);
  return r ? r.value : null;
}

/** Creates or replaces one setting. The admin dashboard (Phase 6) uses this. */
export async function writeSetting(db: Db, key: string, value: unknown): Promise<void> {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: sql`now()` } });
}
