'use client';
import {
  DashboardHeaderControls,
  StatCardFeatured,
  StatCardStandard,
  SalesAnalysisWidget,
  RevenueByCategoryWidget,
  QuickActionsWidget,
  OrderOverviewWidget,
  PaymentSummaryWidget,
  InventoryStatusWidget,
  StoreControlsWidget,
  RecentOrdersWidget,
  WebsiteTrafficWidget,
  AlertsAndInsightsWidget,
} from './dashboard-widgets';
import type { UserRole } from '@/lib/role-auth';

export interface LiveRecentOrder {
  id: string;
  customer: string;
  item: string;
  icon: string;
  amount: string;
  payment: string;
  status: string;
  date: string;
}

export interface LiveTotals {
  collection: string;
  orders: string;
  aov: string;
  customers: string;
  products: string;
  lowStock: number;
  isRealDb?: boolean;
  recentOrders?: LiveRecentOrder[];
  orderOverview?: {
    total: number;
    delivered: { count: number; percent: string };
    processing: { count: number; percent: string };
    cancelled: { count: number; percent: string };
    returned: { count: number; percent: string };
  };
  paymentSummary?: {
    totalCollection: string;
    successful: string;
    pending: string;
    refunds: string;
  };
  inventoryStatus?: {
    total: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
  };
}

interface DashboardClientProps {
  role: UserRole;
  isDemo?: boolean;
  /** Real numbers for all cards and widgets (provided when a real database is connected). */
  live?: LiveTotals;
}

export function DashboardClient({ role, isDemo = false, live }: DashboardClientProps) {
  const isReal = Boolean(live && live.isRealDb);

  return (
    <div className="space-y-6">
      {/* Title & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">Dashboard</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            {isReal ? 'Live operational overview of your store' : 'Complete overview of your jewelry store (Demo Mode)'}
          </p>
        </div>
        <DashboardHeaderControls exportData={live} />
      </div>

      <div
        role="note"
        className={`rounded-xl border px-4 py-2.5 text-[11px] ${
          isReal
            ? 'border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#4ADE80]'
            : 'border-[#D4A843]/30 bg-[#D4A843]/10 text-[#E5B558]'
        }`}
      >
        {isReal
          ? live?.orders === '0'
            ? '🟢 Live Store Database Connected: Store is active with 0 orders placed so far. Live figures will update in real time as customers order.'
            : '🟢 Live Store Active: Showing live sales, real customer orders, and catalogue inventory directly from your database.'
          : '⚡ Demo Mode Active: Showing sample demo metrics. When real database is connected and DEMO_MODE=false, live real data will replace this.'}
      </div>

      {/* 6 Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCardFeatured
          label="Total Collection"
          value={live?.collection ?? '₹12,46,320'}
          trend={live ? 'Live from store' : '+28.4% vs previous 30 days'}
        />
        <StatCardStandard
          label="Total Orders"
          value={live?.orders ?? '428'}
          trend={live ? undefined : '+18.7%'}
          icon="orders"
        />
        <StatCardStandard
          label="Avg. Order Value"
          value={live?.aov ?? '₹2,912'}
          trend={live ? undefined : '+8.9%'}
          icon="aov"
        />
        <StatCardStandard
          label="Total Customers"
          value={live?.customers ?? '2,964'}
          trend={live ? undefined : '+34.2%'}
          icon="customers"
        />
        <StatCardStandard
          label="Total Products"
          value={live?.products ?? '1,248'}
          hint={live ? `${live.lowStock} low in stock` : '12 Low in Stock'}
          icon="products"
        />
        <StatCardStandard
          label="Website Status"
          value={isReal ? 'Online' : 'Demo'}
          trend={isReal ? 'Live' : undefined}
          icon="sessions"
        />
      </div>

      {/* Row 2: Sales & Collection Analysis (50%) + Revenue by Category (28%) + Quick Actions (22%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 xl:col-span-6">
          <SalesAnalysisWidget />
        </div>
        <div className="lg:col-span-3 xl:col-span-3">
          <RevenueByCategoryWidget />
        </div>
        <div className="lg:col-span-3 xl:col-span-3">
          <QuickActionsWidget role={role} />
        </div>
      </div>

      {/* Row 3: 4 Column Cards (Order Overview, Payment Summary, Inventory Status, Store Control) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OrderOverviewWidget data={live?.orderOverview} />
        <PaymentSummaryWidget data={live?.paymentSummary} />
        <InventoryStatusWidget data={live?.inventoryStatus} />
        {role === 'owner' ? (
          <StoreControlsWidget />
        ) : (
          <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 flex flex-col justify-between">
            <h2 className="text-xs font-bold text-[#8A8197] tracking-wider uppercase mb-2">Store Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#C5BDD0]">
                <span>Store Operation</span>
                <span className="text-[#4ADE80] font-semibold">Active &amp; Online</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#C5BDD0]">
                <span>Accepting Orders</span>
                <span className="text-[#4ADE80] font-semibold">Yes</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#C5BDD0]">
                <span>Payment Gateways</span>
                <span className="text-[#4ADE80] font-semibold">Operational</span>
              </div>
            </div>
            <p className="text-[10px] text-[#716A7D] mt-3">Store controls managed by Owner</p>
          </div>
        )}
      </div>

      {/* Row 4: Recent Orders (50%) + Website Traffic (30%) + Alerts & Insights (20%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 xl:col-span-6">
          <RecentOrdersWidget role={role} orders={live?.recentOrders} />
        </div>
        <div className="lg:col-span-3 xl:col-span-3">
          <WebsiteTrafficWidget role={role} />
        </div>
        <div className="lg:col-span-3 xl:col-span-3">
          <AlertsAndInsightsWidget />
        </div>
      </div>
    </div>
  );
}
