'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  BagIcon, BoxIcon, RupeeCoinIcon, UsersIcon, EyeIcon,
  GoldRingIllustration, CalendarIcon, DownloadIcon, CreditCardIcon,
} from './icons';

// ── Top Header Controls ───────────────────────────────────────────────────────

export function DashboardHeaderControls({ exportData }: { exportData?: { collection: string; orders: string; aov: string; customers: string; products: string } }) {
  const [range, setRange] = useState('Last 30 Days');
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const ranges = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Year (2026)'];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'AURNYA LUXURY JEWELLERY - STORE PERFORMANCE REPORT',
        `Generated: ${new Date().toISOString()}`,
        `Period: ${range}`,
        '',
        'METRIC,VALUE,TREND',
        `Total Collection,${exportData?.collection ?? 'INR 1246320'},+28.4%`,
        `Total Orders,${exportData?.orders ?? '428'},+18.7%`,
        `Average Order Value,${exportData?.aov ?? 'INR 2912'},+8.9%`,
        `Total Customers,${exportData?.customers ?? '2964'},+34.2%`,
        `Total Products in Catalogue,${exportData?.products ?? '1248'},Live in Database`,
        'Website Sessions,Live Tracked,+41.3%',
        '',
        'CATEGORY,REVENUE SHARE',
        'Rings,32.4%',
        'Necklaces,24.8%',
        'Earrings,18.6%',
        'Bracelets,11.9%',
        'Pendants,7.3%',
        'Others,5.0%',
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AurNya_Store_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report exported to CSV successfully');
  };

  return (
    <div className="relative flex items-center gap-3">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#D4A843]/40 bg-[#1D1926] px-4 py-3 text-xs font-semibold text-white shadow-2xl flex items-center gap-2">
          <span className="text-[#4ADE80]">✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Date selector button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1A1722] px-3.5 py-2 text-xs font-medium text-[#D1CADB] hover:bg-white/5 transition-colors"
        >
          <CalendarIcon className="w-4 h-4 text-[#9D95A8]" />
          <span>{range}</span>
          <span className="text-[10px] text-[#7E768B]">▾</span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#181521] py-1 shadow-2xl z-50">
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRange(r);
                  setOpen(false);
                  showToast(`Viewing data for ${r}`);
                }}
                className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between ${
                  range === r
                    ? 'text-[#D4A843] font-semibold bg-white/5'
                    : 'text-[#C7C0D2] hover:bg-white/5'
                }`}
              >
                <span>{r}</span>
                {range === r && <span>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Export Report button */}
      <button
        type="button"
        onClick={handleExport}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1A1722] px-3.5 py-2 text-xs font-medium text-[#D1CADB] hover:bg-white/5 hover:border-[#D4A843]/40 transition-colors"
      >
        <DownloadIcon className="w-4 h-4 text-[#9D95A8]" />
        <span>Export Report</span>
      </button>
    </div>
  );
}

// ── Stat Cards ────────────────────────────────────────────────────────────────

interface FeaturedCardProps {
  label: string;
  value: string;
  trend: string;
}

export function StatCardFeatured({ label, value, trend }: FeaturedCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#D4A843]/30 bg-gradient-to-br from-[#4A3215]/60 via-[#271B0E]/80 to-[#181521] p-4 flex items-center justify-between shadow-lg shadow-[#D4A843]/5">
      <div className="flex items-start gap-3.5 z-10">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5E4018]/50 border border-[#D4A843]/30 text-[#D4A843]">
          <BagIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-[#A89FA3] font-medium">{label}</div>
          <div className="font-serif text-2xl font-bold tracking-tight text-white mt-0.5">{value}</div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#4ADE80] mt-1">
            <span>↑</span>
            <span>{trend}</span>
          </div>
        </div>
      </div>
      <div className="absolute -right-1 -bottom-1 opacity-90 pointer-events-none">
        <GoldRingIllustration className="w-20 h-20" />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  hint?: string;
  icon: 'orders' | 'aov' | 'customers' | 'products' | 'sessions';
}

export function StatCardStandard({ label, value, trend, hint, icon }: StatCardProps) {
  const iconNode = {
    orders: <BoxIcon className="w-5 h-5 text-[#9A91A5]" />,
    aov: <RupeeCoinIcon className="w-5 h-5 text-[#9A91A5]" />,
    customers: <UsersIcon className="w-5 h-5 text-[#9A91A5]" />,
    products: <BoxIcon className="w-5 h-5 text-[#9A91A5]" />,
    sessions: <EyeIcon className="w-5 h-5 text-[#9A91A5]" />,
  }[icon];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-4 flex items-start gap-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#9A91A5]">
        {iconNode}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-[#8A8197] font-medium truncate">{label}</div>
        <div className="text-xl font-bold text-white mt-0.5 tracking-tight">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#4ADE80] mt-1">
            <span>↑</span>
            <span>{trend}</span>
          </div>
        )}
        {hint && (
          <div className="text-[11px] font-medium text-[#E5B558] mt-1">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sales & Collection Analysis Dual-Axis Combo Chart ──────────────────────────

export function SalesAnalysisWidget() {
  const dates = ['Oct 8', 'Oct 11', 'Oct 14', 'Oct 17', 'Oct 20', 'Oct 23', 'Oct 26', 'Oct 29', 'Nov 1', 'Nov 4', 'Nov 7'];
  const bars = [45, 65, 80, 95, 120, 140, 160, 150, 175, 190, 210]; // paise/thousand units
  const line = [18, 22, 19, 25, 29, 36, 32, 28, 38, 42, 48]; // orders

  const W = 620;
  const H = 200;
  const PAD_L = 40;
  const PAD_R = 30;
  const PAD_T = 20;
  const PAD_B = 30;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const barMax = 250;
  const lineMax = 50;

  const xCoord = (idx: number) => PAD_L + (idx / (dates.length - 1)) * chartW;
  const yBar = (val: number) => PAD_T + chartH * (1 - val / barMax);
  const yLine = (val: number) => PAD_T + chartH * (1 - val / lineMax);

  // Generate smooth line path
  const linePath = line.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xCoord(i)} ${yLine(v)}`).join(' ');

  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white tracking-wide">Sales &amp; Collection Analysis</h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D4A843]" />
            <span className="text-[#9A91A5] text-[11px]">Total Collection (₹)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" />
            <span className="text-[#9A91A5] text-[11px]">Orders</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-52">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="goldBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E5B558" />
              <stop offset="100%" stopColor="#8A6521" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = PAD_T + chartH * pct;
            return (
              <line
                key={i}
                x1={PAD_L}
                y1={y}
                x2={W - PAD_R}
                y2={y}
                stroke="#2A2436"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            );
          })}

          {/* Left Y-axis labels (Collection) */}
          <text x={PAD_L - 8} y={PAD_T + 4} textAnchor="end" fontSize="9" fill="#71697E">2.5L</text>
          <text x={PAD_L - 8} y={PAD_T + chartH * 0.2 + 4} textAnchor="end" fontSize="9" fill="#71697E">2L</text>
          <text x={PAD_L - 8} y={PAD_T + chartH * 0.4 + 4} textAnchor="end" fontSize="9" fill="#71697E">1.5L</text>
          <text x={PAD_L - 8} y={PAD_T + chartH * 0.6 + 4} textAnchor="end" fontSize="9" fill="#71697E">1L</text>
          <text x={PAD_L - 8} y={PAD_T + chartH * 0.8 + 4} textAnchor="end" fontSize="9" fill="#71697E">50K</text>
          <text x={PAD_L - 8} y={PAD_T + chartH + 4} textAnchor="end" fontSize="9" fill="#71697E">0</text>

          {/* Right Y-axis labels (Orders) */}
          <text x={W - PAD_R + 8} y={PAD_T + 4} textAnchor="start" fontSize="9" fill="#71697E">50</text>
          <text x={W - PAD_R + 8} y={PAD_T + chartH * 0.25 + 4} textAnchor="start" fontSize="9" fill="#71697E">40</text>
          <text x={W - PAD_R + 8} y={PAD_T + chartH * 0.5 + 4} textAnchor="start" fontSize="9" fill="#71697E">30</text>
          <text x={W - PAD_R + 8} y={PAD_T + chartH * 0.75 + 4} textAnchor="start" fontSize="9" fill="#71697E">20</text>
          <text x={W - PAD_R + 8} y={PAD_T + chartH + 4} textAnchor="start" fontSize="9" fill="#71697E">10</text>

          {/* Golden Bars */}
          {bars.map((val, idx) => {
            const x = xCoord(idx) - 7;
            const y = yBar(val);
            const height = PAD_T + chartH - y;
            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width="14"
                height={height}
                fill="url(#goldBarGrad)"
                rx="3"
                className="hover:opacity-80 transition-opacity"
              >
                <title>{`Collection: ₹${val}K`}</title>
              </rect>
            );
          })}

          {/* Violet Orders Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Violet Line Dots */}
          {line.map((val, idx) => (
            <circle
              key={idx}
              cx={xCoord(idx)}
              cy={yLine(val)}
              r="4"
              fill="#8B5CF6"
              stroke="#181521"
              strokeWidth="2"
            >
              <title>{`Orders: ${val}`}</title>
            </circle>
          ))}

          {/* X-axis date labels */}
          {dates.map((d, idx) => (
            <text
              key={idx}
              x={xCoord(idx)}
              y={H - 8}
              textAnchor="middle"
              fontSize="9"
              fill="#71697E"
            >
              {d}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── Revenue by Category Donut Chart ───────────────────────────────────────────

export function RevenueByCategoryWidget() {
  const categories = [
    { name: 'Rings', percent: 32.4, color: '#8B5CF6' },
    { name: 'Necklaces', percent: 24.8, color: '#06B6D4' },
    { name: 'Earrings', percent: 18.6, color: '#F59E0B' },
    { name: 'Bracelets', percent: 11.9, color: '#10B981' },
    { name: 'Pendants', percent: 7.3, color: '#EC4899' },
    { name: 'Others', percent: 5.0, color: '#6B7280' },
  ];

  const R = 54;
  const cx = 75;
  const cy = 75;
  const strokeW = 18;
  const circ = 2 * Math.PI * R;

  let accumulated = 0;
  const arcs = categories.map((cat, idx) => {
    const dash = (cat.percent / 100) * circ;
    const gap = circ - dash;
    const offset = -(accumulated / 100) * circ;
    accumulated += cat.percent;

    return (
      <circle
        key={idx}
        cx={cx}
        cy={cy}
        r={R}
        fill="transparent"
        stroke={cat.color}
        strokeWidth={strokeW}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        className="transition-all hover:opacity-90"
      >
        <title>{`${cat.name}: ${cat.percent}%`}</title>
      </circle>
    );
  });

  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 flex flex-col justify-between">
      <h2 className="text-sm font-bold text-white tracking-wide mb-3">Revenue by Category</h2>

      <div className="flex items-center gap-4">
        {/* Donut SVG */}
        <div className="relative shrink-0">
          <svg width="150" height="150" viewBox="0 0 150 150">
            {arcs}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-bold text-sm text-white">₹12.46L</span>
            <span className="text-[10px] text-[#8A8197]">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5">
          {categories.map((c) => (
            <div key={c.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-[#9A91A5] text-[11px]">{c.name}</span>
              </div>
              <span className="text-white text-[11px] font-medium">{c.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────

export function QuickActionsWidget({ role }: { role: string }) {
  // A manager's dashboard only offers what a manager may open (orders, products list, stock).
  const actions = role === 'manager'
    ? [
        { label: 'Manage Orders', icon: '📦', href: `/${role}/orders` },
        { label: 'Stock & Inventory', icon: '📋', href: `/${role}/inventory` },
        { label: 'Product Catalogue', icon: '💍', href: `/${role}/products` },
        { label: 'My Requests', icon: '⏳', href: `/${role}/approvals` },
      ]
    : [
        { label: 'Add Product', icon: '+', href: `/${role}/products/new` },
        { label: 'Manage Orders', icon: '📦', href: `/${role}/orders` },
        { label: 'Create Coupon', icon: '🏷️', href: `/${role}/coupons` },
        { label: 'Update Banner', icon: '🖼️', href: `/${role}/banners` },
        { label: 'Edit Homepage', icon: '📝', href: `/${role}/content` },
        { label: 'View Reports', icon: '📊', href: `/${role}/analytics` },
      ];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 flex flex-col justify-between">
      <h2 className="text-sm font-bold text-white tracking-wide mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((act) => (
          <Link
            key={act.label}
            href={act.href}
            className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#201C2B] p-3 text-center hover:bg-white/5 hover:border-white/10 transition-colors"
          >
            <span className="text-base text-[#D4A843] mb-1">{act.icon}</span>
            <span className="text-[11px] font-medium text-[#C7BFD2]">{act.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Order Overview ────────────────────────────────────────────────────────────

export function OrderOverviewWidget({ data }: { data?: { total: number; delivered: { count: number; percent: string }; processing: { count: number; percent: string }; cancelled: { count: number; percent: string }; returned: { count: number; percent: string } } }) {
  const statuses = data ? [
    { label: 'Delivered', count: data.delivered.count, percent: data.delivered.percent, color: 'bg-[#4ADE80]', dot: '#4ADE80' },
    { label: 'Processing', count: data.processing.count, percent: data.processing.percent, color: 'bg-[#E5B558]', dot: '#E5B558' },
    { label: 'Cancelled', count: data.cancelled.count, percent: data.cancelled.percent, color: 'bg-[#F87171]', dot: '#F87171' },
    { label: 'Returned', count: data.returned.count, percent: data.returned.percent, color: 'bg-[#C084FC]', dot: '#C084FC' },
  ] : [
    { label: 'Delivered', count: 381, percent: '89.0%', color: 'bg-[#4ADE80]', dot: '#4ADE80' },
    { label: 'Processing', count: 24, percent: '5.6%', color: 'bg-[#E5B558]', dot: '#E5B558' },
    { label: 'Cancelled', count: 15, percent: '3.5%', color: 'bg-[#F87171]', dot: '#F87171' },
    { label: 'Returned', count: 8, percent: '1.9%', color: 'bg-[#C084FC]', dot: '#C084FC' },
  ];

  const total = data ? data.total : 428;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5">
      <div className="flex items-center gap-2 mb-3">
        <BagIcon className="w-4 h-4 text-[#9A91A5]" />
        <h2 className="text-xs font-bold text-[#8A8197] tracking-wider uppercase">Order Overview</h2>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-white">{total}</div>
        <div className="text-[11px] text-[#7E768B]">Total Orders</div>
      </div>

      <div className="space-y-2">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.dot }} />
              <span className="text-[#A49BAF] text-[11px]">{s.label}</span>
            </div>
            <div className="text-[11px] font-medium text-white">
              {s.count} <span className="text-[#7E768B]">({s.percent})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payment Summary ───────────────────────────────────────────────────────────

export function PaymentSummaryWidget({ data }: { data?: { totalCollection: string; successful: string; pending: string; refunds: string } }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5">
      <div className="flex items-center gap-2 mb-3">
        <CreditCardIcon className="w-4 h-4 text-[#9A91A5]" />
        <h2 className="text-xs font-bold text-[#8A8197] tracking-wider uppercase">Payment Summary</h2>
      </div>

      <div className="mb-4">
        <div className="font-serif text-2xl font-bold text-white">{data?.totalCollection ?? '₹12,46,320'}</div>
        <div className="text-[11px] text-[#7E768B]">Total Collection</div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#4ADE80]/20 text-[#4ADE80] text-[9px] font-bold">✓</span>
            <span className="text-[#A49BAF] text-[11px]">Successful Payments</span>
          </div>
          <span className="text-[11px] font-medium text-white">{data?.successful ?? '₹10,98,740'}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#E5B558]/20 text-[#E5B558] text-[9px]">⏳</span>
            <span className="text-[#A49BAF] text-[11px]">Pending</span>
          </div>
          <span className="text-[11px] font-medium text-white">{data?.pending ?? '₹0'}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F87171]/20 text-[#F87171] text-[9px]">↩</span>
            <span className="text-[#A49BAF] text-[11px]">Refunds</span>
          </div>
          <span className="text-[11px] font-medium text-white">{data?.refunds ?? '₹1,47,580'}</span>
        </div>
      </div>
    </div>
  );
}

// ── Inventory Status ──────────────────────────────────────────────────────────

export function InventoryStatusWidget({ data }: { data?: { total: string; inStock: string; lowStock: string; outOfStock: string } }) {
  const items = data ? [
    { label: 'In Stock', count: data.inStock, dot: '#4ADE80' },
    { label: 'Low Stock', count: data.lowStock, dot: '#E5B558' },
    { label: 'Out of Stock', count: data.outOfStock, dot: '#F87171' },
  ] : [
    { label: 'In Stock', count: '1,102', dot: '#4ADE80' },
    { label: 'Low Stock', count: '12', dot: '#E5B558' },
    { label: 'Out of Stock', count: '134', dot: '#F87171' },
  ];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5">
      <div className="flex items-center gap-2 mb-3">
        <BoxIcon className="w-4 h-4 text-[#9A91A5]" />
        <h2 className="text-xs font-bold text-[#8A8197] tracking-wider uppercase">Inventory Status</h2>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-white">{data?.total ?? '1,248'}</div>
        <div className="text-[11px] text-[#7E768B]">Total Products</div>
      </div>

      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: i.dot }} />
              <span className="text-[#A49BAF] text-[11px]">{i.label}</span>
            </div>
            <span className="text-[11px] font-medium text-white">{i.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Store Controls (Owner Only) ───────────────────────────────────────────────

export function StoreControlsWidget() {
  const [controls, setControls] = useState({
    live: true,
    orders: true,
    onlinePay: true,
    cod: true,
    maintenance: false,
  });

  const toggle = (k: keyof typeof controls) => setControls((c) => ({ ...c, [k]: !c[k] }));

  const rows: { key: keyof typeof controls; label: string; icon: string }[] = [
    { key: 'live', label: 'Website Live', icon: '🌐' },
    { key: 'orders', label: 'Accept Orders', icon: '📦' },
    { key: 'onlinePay', label: 'Online Payments (Razorpay/Stripe)', icon: '💳' },
    { key: 'cod', label: 'COD (Cash on Delivery)', icon: '💵' },
    { key: 'maintenance', label: 'Maintenance Mode', icon: '⚙️' },
  ];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5">
      <h2 className="text-xs font-bold text-[#8A8197] tracking-wider uppercase mb-4">
        Store Control (Owner)
      </h2>

      <div className="space-y-2.5">
        {rows.map((r) => {
          const active = controls[r.key];
          return (
            <div key={r.key} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-75">{r.icon}</span>
                <span className="text-[#C5BDD0] text-[11px]">{r.label}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => toggle(r.key)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  active ? 'bg-[#22C55E]' : 'bg-[#3A3347]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    active ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recent Orders Table ───────────────────────────────────────────────────────

export function RecentOrdersWidget({ role, orders: liveOrders }: { role: string; orders?: Array<{ id: string; customer: string; item: string; icon: string; amount: string; payment: string; status: string; date: string }> }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const sampleOrders = [
    { id: '#AN42891', customer: 'Priya Sharma', item: 'Ring (Gold, 18K)', icon: '💍', amount: '₹3,492', payment: 'Paid ✓', status: 'Delivered', date: 'Nov 7, 2026' },
    { id: '#AN42890', customer: 'Arjun Mehta', item: 'Necklace Set', icon: '📿', amount: '₹5,999', payment: 'Paid ✓', status: 'Processing', date: 'Nov 7, 2026' },
    { id: '#AN42889', customer: 'Neha Verma', item: 'Earrings (Diamond)', icon: '✨', amount: '₹2,899', payment: 'Paid ✓', status: 'Delivered', date: 'Nov 6, 2026' },
    { id: '#AN42888', customer: 'Rohit Singh', item: 'Bracelet (Silver)', icon: '⛓️', amount: '₹1,799', payment: 'COD', status: 'Processing', date: 'Nov 6, 2026' },
    { id: '#AN42887', customer: 'Kavya Iyer', item: 'Pendant (Rose Gold)', icon: '💎', amount: '₹3,249', payment: 'Paid ✓', status: 'Delivered', date: 'Nov 5, 2026' },
  ];

  const orders = liveOrders !== undefined ? liveOrders : sampleOrders;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white tracking-wide">Recent Orders</h2>
        <Link href={`/${role}/orders`} className="text-xs text-[#D4A843] hover:underline font-medium">
          View All →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-xs text-[#8E869B]">No orders placed yet.</p>
          <p className="text-[11px] text-[#635C6E] mt-1">Real customer orders will show up here as they are placed.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase text-[#736B7F]">
                <th className="pb-3 font-semibold">Order ID</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Items</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Payment</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-medium text-white">{o.id}</td>
                  <td className="py-3 text-[#C7C0D2]">{o.customer}</td>
                  <td className="py-3 text-[#A9A0B5]">
                    <span className="mr-1.5">{o.icon}</span>
                    {o.item}
                  </td>
                  <td className="py-3 font-semibold text-white">{o.amount}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                        o.payment.includes('Paid')
                          ? 'bg-[#153424] text-[#4ADE80] border border-[#22C55E]/30'
                          : 'bg-[#1E2538] text-[#60A5FA] border border-[#3B82F6]/30'
                      }`}
                    >
                      {o.payment}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                        o.status === 'Delivered'
                          ? 'bg-[#153424] text-[#4ADE80]'
                          : 'bg-[#3A2E16] text-[#E5B558]'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-[#797184]">{o.date}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(o)}
                      className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-[#C7C0D2] hover:text-white hover:bg-white/10 hover:border-[#D4A843]/40 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#181521] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-serif text-white">
                    Order {selectedOrder.id}
                  </h3>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      selectedOrder.status === 'Delivered'
                        ? 'bg-[#153424] text-[#4ADE80]'
                        : 'bg-[#3A2E16] text-[#E5B558]'
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#7E768B] mt-0.5">{selectedOrder.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-[#8E869B] hover:text-white text-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-white/5 bg-[#121018] p-3 space-y-1">
                <div className="text-[10px] uppercase font-semibold text-[#7E768B]">Customer</div>
                <div className="font-semibold text-white">{selectedOrder.customer}</div>
                <div className="text-[#8E869B]">Shipping to Mumbai, India · Express Courier</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#121018] p-3 space-y-1">
                <div className="text-[10px] uppercase font-semibold text-[#7E768B]">Item Details</div>
                <div className="flex items-center justify-between">
                  <span className="text-white">{selectedOrder.icon} {selectedOrder.item}</span>
                  <span className="text-white font-bold">{selectedOrder.amount}</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#121018] p-3 flex items-center justify-between">
                <span className="text-[#8E869B]">Payment Method</span>
                <span className="text-[#4ADE80] font-semibold">{selectedOrder.payment}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-[#C7C0D2]"
              >
                Close
              </button>
              <Link
                href={`/${role}/orders`}
                className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-4 py-2 shadow-md shadow-[#D4A843]/10"
              >
                Go to Orders
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Website Traffic Chart ─────────────────────────────────────────────────────

export function WebsiteTrafficWidget({ role }: { role: string }) {
  const points = [42, 38, 48, 44, 52, 60, 54, 62, 58, 68, 64, 76, 70, 74];
  const dates = ['Oct 8', 'Oct 13', 'Oct 18', 'Oct 23', 'Oct 28', 'Nov 2', 'Nov 7'];

  const W = 400;
  const H = 100;
  const PAD_L = 30;
  const PAD_R = 15;
  const PAD_T = 10;
  const PAD_B = 25;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = 80; // 8K

  const xCoord = (idx: number) => PAD_L + (idx / (points.length - 1)) * chartW;
  const yCoord = (val: number) => PAD_T + chartH * (1 - val / maxVal);

  const lineD = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xCoord(i)} ${yCoord(v)}`).join(' ');
  const areaD = `${lineD} L ${xCoord(points.length - 1)} ${PAD_T + chartH} L ${PAD_L} ${PAD_T + chartH} Z`;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white tracking-wide">Website Traffic</h2>
        {role !== 'manager' && (
        <Link href={`/${role}/analytics`} className="text-xs text-[#D4A843] hover:underline">
          View Report →
        </Link>
        )}
      </div>

      {/* 4 Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4 pb-3 border-b border-white/5">
        <div>
          <div className="text-sm font-bold text-white">48,920</div>
          <div className="text-[10px] text-[#4ADE80] font-medium">Sessions ↑ +41.3%</div>
        </div>
        <div>
          <div className="text-sm font-bold text-white">32,780</div>
          <div className="text-[10px] text-[#4ADE80] font-medium">Users ↑ +38.9%</div>
        </div>
        <div>
          <div className="text-sm font-bold text-white">2.34</div>
          <div className="text-[10px] text-[#8A8197]">Pages / Session</div>
        </div>
        <div>
          <div className="text-sm font-bold text-white">55.6%</div>
          <div className="text-[10px] text-[#8A8197]">Bounce Rate</div>
        </div>
      </div>

      {/* Area Wave Chart */}
      <div className="w-full h-28">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trafficWave" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Y Axis Labels */}
          <text x={PAD_L - 6} y={PAD_T + 4} textAnchor="end" fontSize="8" fill="#71697E">8K</text>
          <text x={PAD_L - 6} y={PAD_T + chartH * 0.25 + 4} textAnchor="end" fontSize="8" fill="#71697E">6K</text>
          <text x={PAD_L - 6} y={PAD_T + chartH * 0.5 + 4} textAnchor="end" fontSize="8" fill="#71697E">4K</text>
          <text x={PAD_L - 6} y={PAD_T + chartH * 0.75 + 4} textAnchor="end" fontSize="8" fill="#71697E">2K</text>
          <text x={PAD_L - 6} y={PAD_T + chartH + 4} textAnchor="end" fontSize="8" fill="#71697E">0</text>

          {/* Area Fill */}
          <path d={areaD} fill="url(#trafficWave)" />

          {/* Line */}
          <path d={lineD} fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* X Axis Date Labels */}
          {dates.map((d, i) => {
            const x = PAD_L + (i / (dates.length - 1)) * chartW;
            return (
              <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="8" fill="#71697E">
                {d}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── Alerts & Insights ─────────────────────────────────────────────────────────

export function AlertsAndInsightsWidget() {
  const alerts = [
    { icon: '⚠️', text: '12 products are low in stock', color: 'text-[#F87171]', bg: 'bg-[#311C21]/60 border border-[#F87171]/20' },
    { icon: 'ℹ️', text: '15 orders require action', color: 'text-[#60A5FA]', bg: 'bg-[#19263D]/60 border border-[#60A5FA]/20' },
    { icon: '📈', text: 'Sales increased by 28.4%', color: 'text-[#4ADE80]', bg: 'bg-[#152D21]/60 border border-[#4ADE80]/20' },
    { icon: '⭐', text: 'Top product: Diamond Ring (₹2.31L)', color: 'text-[#C084FC]', bg: 'bg-[#291B3A]/60 border border-[#C084FC]/20' },
  ];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">🔔</span>
        <h2 className="text-sm font-bold text-white tracking-wide">Alerts &amp; Insights</h2>
      </div>

      <div className="space-y-2.5">
        {alerts.map((a, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 rounded-xl p-3 ${a.bg} transition-colors`}
          >
            <span className="text-sm shrink-0">{a.icon}</span>
            <span className="text-xs text-[#E1DAEA] font-medium leading-tight">{a.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
