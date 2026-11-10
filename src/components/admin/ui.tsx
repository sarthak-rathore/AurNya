import Link from 'next/link';
import { formatINR } from '@/lib/money';
import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from '@/lib/order-status';

// Dark luxury design system tokens matching dashboard theme
export const input =
  'w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] outline-none focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843] disabled:opacity-60 transition-colors';
export const label = 'mb-1.5 block text-xs font-semibold text-[#D1CADB]';
export const btn =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
export const btnPrimary = `${btn} bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] font-bold shadow-md shadow-[#D4A843]/10`;
export const btnOutline = `${btn} border border-white/10 bg-white/5 hover:bg-white/10 text-white`;
export const btnDanger = `${btn} border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20`;
export const th =
  'px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#736B7F] bg-[#14121A]/50';
export const td = 'px-5 py-3.5 align-middle text-xs text-white';

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">{title}</h1>
        {sub && <p className="mt-0.5 text-xs text-[#968E9F]">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
    </div>
  );
}

export const Card = ({
  title,
  children,
  className = '',
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) => (
  <section
    className={`rounded-2xl border border-white/5 bg-[#181521] text-white p-6 shadow-xl ${className}`}
  >
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/5 pb-3">
        <h2 className="font-serif text-base font-bold text-white">{title}</h2>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <span
    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
      status === 'delivered'
        ? 'bg-[#153424] text-[#4ADE80]'
        : status === 'cancelled'
        ? 'bg-[#311C21] text-red-400'
        : 'bg-[#3A2E16] text-[#E5B558]'
    }`}
  >
    {STATUS_LABEL[status]}
  </span>
);

export const Money = ({ paise }: { paise: number }) => (
  <span className="tabular-nums font-semibold text-white">{formatINR(paise)}</span>
);

export function Stat({
  label: l,
  value,
  hint,
  tone = '',
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-[10px] uppercase font-semibold text-[#8E869B]">{l}</p>
      <p className={`mt-1 font-serif text-2xl font-bold text-white ${tone}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[#8E869B]">{hint}</p>}
    </>
  );
  const cls = 'rounded-2xl border border-white/5 bg-[#181521] p-5 shadow-xl';
  return href ? (
    <Link href={href} className={`${cls} block transition hover:border-[#D4A843]/40`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function NeedsDatabase() {
  return (
    <Card title="Connect your database first">
      <p className="text-xs text-[#C7C0D2]">
        The dashboard manages the live store, so it needs the database. Currently running in demo mode.
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-[#8E869B]">
        <li>Add <code>DATABASE_URL</code> to your environment variables (.env.local).</li>
        <li>Run <code>npm run db:migrate</code> once.</li>
        <li>Refresh this page.</li>
      </ol>
    </Card>
  );
}

export function Pager({
  page,
  pages,
  href,
}: {
  page: number;
  pages: number;
  href: (p: number) => string;
}) {
  if (pages <= 1) return null;
  const c =
    'rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors';
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-xs print:hidden">
      {page > 1 ? (
        <Link href={href(page - 1)} className={c}>
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-[#8E869B]">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={c}>
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
