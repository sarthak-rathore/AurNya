import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { products } from '@/data/products';

const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = path.join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; });
const src = files(path.resolve(process.cwd(), 'src')).filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'));

test('browser code never imports database or server-only code (it would ship to every visitor)', () => {
  const serverOnly = /from ['"](@\/db\/|@\/lib\/catalog['"]|@\/lib\/catalog-memory|@\/lib\/coupon-store|@\/lib\/settings|pg['"]|drizzle-orm|@neondatabase)/;
  const bad = src.filter((f) => /^['"]use client['"]/m.test(readFileSync(f, 'utf8')) && serverOnly.test(readFileSync(f, 'utf8')));
  assert.deepEqual(bad.map((f) => path.relative(process.cwd(), f)), []);
});
test('no secrets are read in browser code', () => {
  const bad = src.filter((f) => /^['"]use client['"]/m.test(readFileSync(f, 'utf8')) && /process\.env\.(?!NEXT_PUBLIC_)/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(bad.map((f) => path.relative(process.cwd(), f)), []);
});
test('the demo products are consistent', () => {
  assert.equal(new Set(products.map((p) => p.id)).size, products.length); assert.equal(new Set(products.map((p) => p.slug)).size, products.length); assert.equal(new Set(products.map((p) => p.sku)).size, products.length);
  for (const p of products) {
    assert.ok(Number.isInteger(p.pricePaise) && p.pricePaise >= 0, p.slug);
    if (p.originalPricePaise !== undefined) assert.ok(p.originalPricePaise > p.pricePaise, p.slug);
    if (p.variants) assert.equal(p.stock, Object.values(p.variants.optionStock ?? {}).reduce((a, b) => a + b, 0), `${p.slug}: total stock must equal the sum of its sizes`);
  }
});
test('the saved migrations match src/db/schema.ts (nothing was changed without generating a migration)', () => {
  const tmp = `.tmp-migration-check-${process.pid}`;   // drizzle-kit wants a folder path relative to the project
  cpSync(path.resolve(process.cwd(), 'drizzle'), path.resolve(process.cwd(), tmp), { recursive: true });
  try {
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const out = execFileSync(npxCmd, ['drizzle-kit', 'generate', '--dialect=postgresql', '--schema=./src/db/schema.ts', `--out=./${tmp}`], { encoding: 'utf8', cwd: process.cwd(), shell: true });
    assert.match(out, /No schema changes/i, 'schema.ts changed: run `npm run db:generate` and commit the new file in drizzle/');
  } finally { rmSync(path.resolve(process.cwd(), tmp), { recursive: true, force: true }); }
});
