// Database command line:  npm run db:migrate | db:seed | db:purge-demo | db:check
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema';
import { purgeDemo, seedDemo, seedDemoUser } from './seed';

// Tiny .env reader so beginners only have to fill .env.local. Real environment variables always win.
for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const mask = (url: string) => url.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@');
const fail = (msg: string): never => { console.error(`\n${msg}\n`); process.exit(1); };

async function main() {
  const [rawCmd, ...rawFlags] = process.argv.slice(2);
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  // `prebuild` runs automatically before `npm run build`: nothing to do in demo mode, a readiness check when a database is set.
  if (rawCmd === 'prebuild' && !process.env.DATABASE_URL) return;
  const cmd = rawCmd === 'prebuild' ? 'check' : rawCmd; const flags = rawCmd === 'prebuild' ? ['--build'] : rawFlags;
  if (!['migrate', 'seed', 'purge-demo', 'check'].includes(cmd ?? '')) fail('Usage: npm run db:migrate | db:seed | db:purge-demo | db:check');
  if (!url) fail('DATABASE_URL is not set. Add it to .env.local (see README, "Setting up the database").');
  console.log(`Database: ${mask(url!)}`);

  if (cmd === 'check') {
    // Uses the same driver the live website uses, so this proves the real connection path works.
    const { getDb, driverFor } = await import('./client');
    const building = flags.includes('--build');   // run automatically before `npm run build`, so a missing migration gives plain instructions
    const db = getDb(); if (!db) fail('DATABASE_URL is not set.');
    console.log(`Driver: ${driverFor(process.env.DATABASE_URL!)}`);
    const rowsOf = (r: unknown) => ((r as { rows?: unknown[] }).rows ?? (r as unknown[])) as Record<string, number>[];
    try { await db!.execute(sql`select 1`); } catch (e) {
      fail(`Cannot reach the database.\n${e instanceof Error ? e.message : e}\n\nCheck DATABASE_URL (Neon: use the POOLED connection string) and that the database is running.`);
    }
    const journal = JSON.parse(readFileSync(path.resolve(process.cwd(), 'drizzle/meta/_journal.json'), 'utf8')) as { entries: unknown[] };
    let applied = 0;
    try { applied = Number(rowsOf(await db!.execute(sql`select count(*)::int as n from drizzle.__drizzle_migrations`))[0].n); } catch { /* table missing: nothing applied yet */ }
    if (applied < journal.entries.length) {
      fail(`The database is not up to date: ${journal.entries.length - applied} of ${journal.entries.length} migrations still need to run.\n\nFix: run   npm run db:migrate   (then   npm run db:seed   for the sample products on a brand-new database).`);
    }
    const n = rowsOf(await db!.execute(sql`select (select count(*)::int from products) as products, (select count(*)::int from categories) as categories, (select count(*)::int from coupons) as coupons`))[0];
    console.log(`Connected. Migrations: ${applied}/${journal.entries.length} applied. Rows: ${JSON.stringify(n)}`);
    if (Number(n.products) === 0) console.log('Note: there are no products yet. Run   npm run db:seed   for the sample catalogue, or add your own.');
    if (building) console.log('Database is ready for the build.');
    return;
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema });
  try {
    if (cmd === 'migrate') { await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') }); console.log('Migrations are up to date.'); }
    if (cmd === 'seed') { const r = await seedDemo(db, { force: flags.includes('--force') }); console.log('Seeded sample data:', JSON.stringify(r)); const u = await seedDemoUser(db); console.log('Demo user:', u.created ? `Created: ${u.email} / ${u.password} (${u.ordersCreated} demo orders)` : `Already exists: ${u.email}`); }
    if (cmd === 'purge-demo') { const r = await purgeDemo(db); console.log('Removed sample data:', JSON.stringify(r)); }
  } finally { await pool.end(); }
}
main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
