import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzleLite } from 'drizzle-orm/pglite';
import { migrate as migrateLite } from 'drizzle-orm/pglite/migrator';
import path from 'node:path';
import { Pool } from 'pg';
import type { Db } from './client';
import * as schema from './schema';

// Test databases with the real migrations applied.
//  - "pglite": a real PostgreSQL engine running inside the test process. Needs no setup, so `npm test` works anywhere.
//  - "postgres": a real server, used too when TEST_DATABASE_URL is set (the same tests run against both).
export type Backend = 'pglite' | 'postgres';
export const backends = (): Backend[] => (process.env.TEST_DATABASE_URL ? ['pglite', 'postgres'] : ['pglite']);
const folder = () => path.resolve(process.cwd(), 'drizzle');

export async function openTestDb(kind: Backend): Promise<{ db: Db; close: () => Promise<void> }> {
  if (kind === 'pglite') {
    const lite = new PGlite();
    const db = drizzleLite(lite, { schema });
    await migrateLite(db, { migrationsFolder: folder() });
    return { db: db as unknown as Db, close: () => lite.close() };
  }
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });
  const db = drizzlePg(pool, { schema });
  await db.execute(sql`drop schema if exists public cascade`); await db.execute(sql`drop schema if exists drizzle cascade`); await db.execute(sql`create schema public`);
  await migratePg(db, { migrationsFolder: folder() });
  return { db: db as unknown as Db, close: () => pool.end() };
}

/** Runs a database statement that must be refused, and checks that the named rule is the one that refused it. */
export async function refused(run: () => Promise<unknown>, rule: string): Promise<void> {
  try { await run(); } catch (e) {
    const text = `${(e as Error).message} ${((e as { cause?: Error }).cause)?.message ?? ''}`;
    if (text.includes(rule)) return;
    throw new Error(`Refused, but not by "${rule}". Got: ${text}`);
  }
  throw new Error(`Expected the database to refuse this (rule "${rule}"), but it was accepted.`);
}
