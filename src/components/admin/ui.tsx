import Link from 'next/link';
import { formatINR } from '@/lib/money';
import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from '@/lib/order-status';

// Shared look for every admin screen. Same colours as the shop (they follow light and dark mode).
export const input = 'w-full rounded-xl border border-charcoal/20 bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-gold-ink focus:ring-1 focus:ring-gold-ink disabled:opacity-60';
export const label = 'mb-1 block text-xs font-medium uppercase tracking-[.1em] text-muted';
export const btn = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium uppercase tracking-[.12em] transition disabled:cursor-not-allowed disabled:opacity-50';
export const btnPrimary = `${btn} bg-charcoal text-ivory hover:bg-plum`;
export const btnOutline = `${btn} border border-charcoal/40 hover:bg-charcoal hover:text-ivory`;
export const btnDanger = `${btn} border border-danger/50 text-danger hover:bg-danger hover:text-ivory`;
export const th = 'px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[.12em] text-muted';
export const td = 'px-4 py-3 align-middle';

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-serif text-4xl">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
    </div>
  );
}
export const Card = ({ title, children, className = '', action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) => (
  <section className={`rounded-2xl border border-charcoal/10 bg-surface p-5 ${className}`}>
    {(title || action) && <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-serif text-2xl">{title}</h2>{action}</div>}
    {children}
  </section>
);
export const StatusBadge = ({ status }: { status: OrderStatus }) => <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
export const Money = ({ paise }: { paise: number }) => <span className="tabular-nums">{formatINR(paise)}</span>;

export function Stat({ label: l, value, hint, tone = '', href }: { label: string; value: React.ReactNode; hint?: string; tone?: string; href?: string }) {
  const body = <><p className="text-[11px] uppercase tracking-[.12em] text-muted">{l}</p><p className={`mt-1 font-serif text-3xl ${tone}`}>{value}</p>{hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}</>;
  const cls = 'rounded-2xl border border-charcoal/10 bg-surface p-4';
  return href ? <Link href={href} className={`${cls} block transition hover:border-gold-ink`}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function NeedsDatabase() {
  return (
    <Card title="Connect your database first">
      <p className="text-sm">The dashboard manages the live store, so it needs the database. Right now the site is running on its built-in demo data, which cannot be edited.</p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>Add <code>DATABASE_URL</code> to your environment variables (Vercel: Settings → Environment Variables).</li>
        <li>Run <code>npm run db:migrate</code> once, then <code>npm run db:seed</code> if you want the sample products to start with.</li>
        <li>Redeploy, then come back here.</li>
      </ol>
    </Card>
  );
}

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const c = 'rounded-full border border-charcoal/30 px-4 py-1.5 text-xs uppercase tracking-widest hover:bg-charcoal hover:text-ivory';
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm print:hidden">
      {page > 1 ? <Link href={href(page - 1)} className={c}>← Previous</Link> : <span />}
      <span className="text-muted">Page {page} of {pages}</span>
      {page < pages ? <Link href={href(page + 1)} className={c}>Next →</Link> : <span />}
    </nav>
  );
}

/** Builds a query string, leaving out empty values. */
export const qs = (o: Record<string, string | number | undefined | null>): string => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '' && v !== 1) p.set(k, String(v)); const s = p.toString(); return s ? `?${s}` : ''; };
