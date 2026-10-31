import { defineConfig } from 'drizzle-kit';

// `npm run db:generate` reads src/db/schema.ts and writes a new SQL migration into ./drizzle (no database needed).
// Migrations are applied with `npm run db:migrate`, which uses src/db/cli.ts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '' },
});
