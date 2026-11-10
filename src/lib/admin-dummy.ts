/*
 * Dummy / demo data for the admin dashboard.
 *
 * This data is shown ONLY when there is no real database connected, or when the
 * real database has zero orders/products (freshly seeded). Once real data exists,
 * callers should prefer live DB queries.
 *
 * Rule: isDemoMode() === true  → show dummy data with a [DEMO] badge
 *       isDemoMode() === false → never use this file; query the DB instead
 */

import type { DashboardStats } from '@/db/admin-stats';
import { isDemoMode as checkDemoMode } from './demo-mode';

/** Returns true when dummy data should be displayed. */
export function isDemoMode(dbAvailable: boolean, productCount: number, orderCount: number): boolean {
  if (!checkDemoMode()) return false;
  return !dbAvailable || (productCount === 0 && orderCount === 0);
}

// ── Dummy stat cards ──────────────────────────────────────────────────────────

export const DUMMY_STATS: DashboardStats = {
  todayPaise: 0,
  todayOrders: 0,
  monthPaise: 1_24_63_200,   // ₹12,46,320
  monthOrders: 428,
  toPack: 24,
  toShip: 15,
  awaitingPayment: 8,
  codToConfirm: 8,
  days: generateDays(),
  top: [
    { name: 'Diamond Ring (22K)', qty: 48, paise: 2_31_00_000 },
    { name: 'Gold Necklace Set', qty: 36, paise: 1_79_40_000 },
    { name: 'Earrings (Diamond)', qty: 72, paise: 97_20_000 },
    { name: 'Bracelet (Silver)', qty: 55, paise: 48_95_000 },
    { name: 'Pendant (Rose Gold)', qty: 29, paise: 36_25_000 },
  ],
  recent: [
    { id: 'dummy-1', orderNumber: 42891, status: 'delivered', email: 'priya.sharma@gmail.com', totalPaise: 3_49_200, createdAt: daysAgo(0) },
    { id: 'dummy-2', orderNumber: 42890, status: 'paid', email: 'arjun.mehta@gmail.com', totalPaise: 5_99_000, createdAt: daysAgo(0) },
    { id: 'dummy-3', orderNumber: 42889, status: 'delivered', email: 'neha.verma@gmail.com', totalPaise: 2_89_900, createdAt: daysAgo(1) },
    { id: 'dummy-4', orderNumber: 42888, status: 'paid', email: 'rohit.singh@gmail.com', totalPaise: 1_79_900, createdAt: daysAgo(1) },
    { id: 'dummy-5', orderNumber: 42887, status: 'delivered', email: 'kavya.iyer@gmail.com', totalPaise: 3_24_900, createdAt: daysAgo(2) },
  ],
  attention: [],
  lowStock: [
    { key: 'diamond-ring-7', productId: 1, variantId: null, sku: 'DR-7', slug: 'diamond-ring', name: 'Diamond Ring', option: 'Size 7', stock: 2, status: 'active' },
    { key: 'gold-chain-16', productId: 2, variantId: null, sku: 'GC-16', slug: 'gold-chain', name: 'Gold Chain', option: '16 inch', stock: 3, status: 'active' },
    { key: 'pearl-earring', productId: 3, variantId: null, sku: 'PE-1', slug: 'pearl-earrings', name: 'Pearl Earrings', option: null, stock: 5, status: 'active' },
  ],
  lowStockCount: 12,
  productCount: 1248,
};

// ── Extended dummy data for the rich dashboard ────────────────────────────────

export const DUMMY_OVERVIEW = {
  totalCollection: 1_24_63_200,  // ₹12,46,320
  prevCollection: 97_00_000,
  totalOrders: 428,
  prevOrders: 361,
  avgOrderValue: 2_91_200,       // ₹2,912
  prevAvgOrder: 2_67_600,
  totalCustomers: 2964,
  prevCustomers: 2209,
  totalProducts: 1248,
  lowInStock: 12,
  websiteSessions: 48920,
  prevSessions: 34600,
};

export const DUMMY_REVENUE_BY_CATEGORY = [
  { name: 'Rings', percent: 32.4, color: '#D4A843' },
  { name: 'Necklaces', percent: 24.8, color: '#8B6914' },
  { name: 'Earrings', percent: 18.6, color: '#B8A050' },
  { name: 'Bracelets', percent: 11.9, color: '#6B4F1A' },
  { name: 'Pendants', percent: 7.3, color: '#C4832A' },
  { name: 'Others', percent: 5.0, color: '#3D2B0A' },
];

export const DUMMY_ORDER_OVERVIEW = {
  total: 428,
  delivered: { count: 381, pct: 89.0 },
  processing: { count: 24, pct: 5.6 },
  cancelled: { count: 15, pct: 3.5 },
  returned: { count: 8, pct: 1.9 },
};

export const DUMMY_PAYMENT_SUMMARY = {
  totalCollection: 1_24_63_200,
  successful: { amount: 1_09_87_400, label: 'Successful Payments' },
  pending: { amount: 0, label: 'Pending Payments' },
  refunds: { amount: 1_47_580, label: 'Refunds' },
};

export const DUMMY_INVENTORY_STATUS = {
  total: 1248,
  inStock: 1102,
  lowStock: 12,
  outOfStock: 134,
};

export const DUMMY_WEBSITE_TRAFFIC = {
  sessions: 48920,
  sessionsTrend: 41.3,
  users: 32780,
  usersTrend: 38.9,
  pagesPerSession: 2.34,
  bounceRate: 55.6,
  chart: generateTrafficPoints(),
};

export const DUMMY_RECENT_ORDERS = [
  { id: '#AN42891', customer: 'Priya Sharma', items: 'Ring (Gold, 18K)', amount: 3492, payment: 'Paid', status: 'Delivered', date: 'Nov 7, 2026', paymentType: 'online' },
  { id: '#AN42890', customer: 'Arjun Mehta', items: 'Necklace Set', amount: 5999, payment: 'Paid', status: 'Processing', date: 'Nov 7, 2026', paymentType: 'online' },
  { id: '#AN42889', customer: 'Neha Verma', items: 'Earrings (Diamond)', amount: 2899, payment: 'Paid', status: 'Delivered', date: 'Nov 6, 2026', paymentType: 'online' },
  { id: '#AN42888', customer: 'Rohit Singh', items: 'Bracelet (Silver)', amount: 1799, payment: 'COD', status: 'Processing', date: 'Nov 6, 2026', paymentType: 'cod' },
  { id: '#AN42887', customer: 'Kavya Iyer', items: 'Pendant (Rose Gold)', amount: 3249, payment: 'Paid', status: 'Delivered', date: 'Nov 5, 2026', paymentType: 'online' },
];

export const DUMMY_SALES_CHART = generateSalesChart();

export const DUMMY_ALERTS = [
  { type: 'warning' as const, text: '12 products are low in stock' },
  { type: 'info' as const, text: '15 orders require action' },
  { type: 'success' as const, text: 'Sales increased by 28.4%' },
  { type: 'star' as const, text: 'Top product: Diamond Ring (₹2.31L)' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function generateDays(): DashboardStats['days'] {
  const base = [1_20_000, 85_000, 2_10_000, 1_65_000, 90_000, 3_40_000, 2_80_000,
    1_50_000, 1_95_000, 2_60_000, 3_10_000, 2_75_000, 4_20_000, 3_85_000];
  return base.map((paise, i) => {
    const d = daysAgo(13 - i);
    return { day: d.toISOString().slice(0, 10), paise, n: Math.round(paise / 29_000) };
  });
}

function generateSalesChart() {
  const labels = ['Oct 8','Oct 11','Oct 14','Oct 17','Oct 20','Oct 23','Oct 26','Oct 29','Nov 1','Nov 4','Nov 7'];
  const collection = [80_000, 1_20_000, 95_000, 1_80_000, 2_10_000, 1_60_000, 2_40_000, 1_90_000, 2_80_000, 3_20_000, 3_85_000];
  const orders = [12, 18, 14, 26, 31, 24, 36, 28, 41, 48, 55];
  return { labels, collection, orders };
}

function generateTrafficPoints() {
  return [2800, 3200, 2600, 4100, 3800, 5200, 4600, 6100, 5400, 7200, 6800, 8400, 7600, 9200, 8900, 10400, 9800, 11600];
}
