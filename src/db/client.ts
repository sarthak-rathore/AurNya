import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import * as schema from './schema';

// Any Drizzle Postgres database: Neon in production, a local Postgres or an in-memory test database in tests.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, typeof schema>;

/** True when DATABASE_URL is set. Without it the site runs on the built-in demo data. */
export const hasDatabase = (): boolean => !!process.env.DATABASE_URL;

/** Neon addresses use Neon's own web-friendly driver (best for serverless hosting such as Vercel). Any other Postgres uses the standard driver. */
export const isNeonUrl = (url: string): boolean => { try { return new URL(url).hostname.endsWith('.neon.tech'); } catch { return false; } };
export const driverFor = (url: string): 'neon-http' | 'node-postgres' => (isNeonUrl(url) ? 'neon-http' : 'node-postgres');

// Remembered on globalThis so the dev server's hot reloading does not open a new connection pool every time.
const g = globalThis as unknown as { __aurnyaDb?: { url: string; db: Db } };

/** The shared connection for the website (server only). */
export function getDb(): Db | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (g.__aurnyaDb?.url === url) return g.__aurnyaDb.db;
  // Timeouts on the standard driver: never hang a visitor's page on a slow or unreachable database.
  const db = (isNeonUrl(url) ? drizzleNeon(neon(url), { schema }) : drizzlePg(new Pool({ connectionString: url, max: 3, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10_000, statement_timeout: 10_000, query_timeout: 10_000 }), { schema })) as unknown as Db;
  g.__aurnyaDb = { url, db };
  return db;
}
