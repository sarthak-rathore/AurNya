'use client';
import { useState } from 'react';

export function AnalyticsClient() {
  const [period, setPeriod] = useState('Last 30 Days');
  const [toast, setToast] = useState<string | null>(null);

  const periods = ['Today', 'Last 7 Days', 'Last 30 Days', 'Year to Date'];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const topProducts = [
    { rank: 1, name: 'Royal Solitaire Diamond Ring (18K)', sku: 'AUR-RING-001', category: 'Rings', units: 142, revenue: '₹4,95,864', conv: '4.8%' },
    { rank: 2, name: 'Kundan Heritage Bridal Choker', sku: 'AUR-NECK-004', category: 'Necklaces', units: 68, revenue: '₹4,07,932', conv: '3.9%' },
    { rank: 3, name: 'Classic Pavé Diamond Studs', sku: 'AUR-EAR-002', category: 'Earrings', units: 94, revenue: '₹2,72,506', conv: '5.2%' },
    { rank: 4, name: 'Handcrafted Tennis Bracelet', sku: 'AUR-BRAC-007', category: 'Bracelets', units: 48, revenue: '₹1,53,552', conv: '3.1%' },
    { rank: 5, name: 'Rose Gold Floral Pendant', sku: 'AUR-PEND-003', category: 'Pendants', units: 36, revenue: '₹1,16,964', conv: '2.8%' },
  ];

  const trafficSources = [
    { source: 'Instagram & Meta Ads', sessions: '21,770', share: '44.5%', revenue: '₹5,54,612', color: '#E1306C' },
    { source: 'Google Organic & SEO', sessions: '15,260', share: '31.2%', revenue: '₹3,88,852', color: '#4285F4' },
    { source: 'Direct & Bookmarks', sessions: '8,855', share: '18.1%', revenue: '₹2,25,584', color: '#D4A843' },
    { source: 'WhatsApp & Referrals', sessions: '3,035', share: '6.2%', revenue: '₹77,272', color: '#25D366' },
  ];

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'AURNYA LUXURY JEWELLERY - ANALYTICS & INSIGHTS REPORT',
        `Reporting Period: ${period}`,
        `Export Timestamp: ${new Date().toISOString()}`,
        '',
        'METRIC,VALUE,BENCHMARK',
        'Store Conversion Rate,3.42%,+0.8% vs industry avg',
        'Repeat Customer Rate,28.6%,+3.2% vs previous period',
        'Cart Abandonment Rate,41.2%,Down 5.4%',
        'Average Order Value,INR 2912,+8.9%',
        'Website Sessions,48920,+41.3%',
        '',
        'PRODUCT,SKU,CATEGORY,UNITS SOLD,TOTAL REVENUE,CONVERSION RATE',
        ...topProducts.map(
          (p) => `"${p.name}","${p.sku}","${p.category}",${p.units},"${p.revenue}","${p.conv}"`
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AurNya_Analytics_${period.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Analytics dataset exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#D4A843]/40 bg-[#1D1926] px-4 py-3 text-xs font-semibold text-white shadow-2xl flex items-center gap-2">
          <span className="text-[#4ADE80]">✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">Analytics &amp; Reports</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            Deep-dive into sales conversions, customer acquisition funnels, and revenue metrics
          </p>
        </div>
      <div role="note" className="rounded-xl border border-[#D4A843]/30 bg-[#D4A843]/5 px-4 py-2.5 text-[11px] text-[#E5B558]">Sample data: these figures are examples for now. Live reports are planned for the next phase; the Orders, Customers and Products screens already show real data.</div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-[#121018] border border-white/10 rounded-xl p-1 text-xs">
            {periods.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPeriod(p);
                  showToast(`Showing analytics for ${p}`);
                }}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  period === p
                    ? 'bg-[#D4A843] text-[#14121A] font-bold shadow-md shadow-[#D4A843]/10'
                    : 'text-[#8E869B] hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportCSV}
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 transition-colors flex items-center gap-2"
          >
            <span>⬇</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 shadow-xl">
          <div className="text-xs text-[#8E869B] font-medium">Store Conversion Rate</div>
          <div className="text-2xl font-bold text-white mt-1">3.42%</div>
          <div className="text-[11px] font-semibold text-[#4ADE80] mt-1.5 flex items-center gap-1">
            <span>↑ +0.8%</span>
            <span className="text-[#8E869B] font-normal">vs prev 30 days</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 shadow-xl">
          <div className="text-xs text-[#8E869B] font-medium">Repeat Customer Rate</div>
          <div className="text-2xl font-bold text-white mt-1">28.6%</div>
          <div className="text-[11px] font-semibold text-[#4ADE80] mt-1.5 flex items-center gap-1">
            <span>↑ +3.2%</span>
            <span className="text-[#8E869B] font-normal">heirloom collectors</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 shadow-xl">
          <div className="text-xs text-[#8E869B] font-medium">Cart Abandonment Rate</div>
          <div className="text-2xl font-bold text-white mt-1">41.2%</div>
          <div className="text-[11px] font-semibold text-[#4ADE80] mt-1.5 flex items-center gap-1">
            <span>↓ -5.4%</span>
            <span className="text-[#8E869B] font-normal">lower than luxury avg</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 shadow-xl">
          <div className="text-xs text-[#8E869B] font-medium">Average Order Value (AOV)</div>
          <div className="text-2xl font-bold text-white mt-1">₹2,912</div>
          <div className="text-[11px] font-semibold text-[#4ADE80] mt-1.5 flex items-center gap-1">
            <span>↑ +8.9%</span>
            <span className="text-[#8E869B] font-normal">higher bridal cart size</span>
          </div>
        </div>
      </div>

      {/* Grid: Traffic Sources & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Acquisition Channels */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">Traffic &amp; Acquisition Channels</h2>
            <p className="text-[11px] text-[#8E869B]">Where your 48,920 boutique visitors came from</p>
          </div>

          <div className="space-y-4">
            {trafficSources.map((t) => (
              <div key={t.source} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white">{t.source}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#8E869B]">{t.sessions} visits ({t.share})</span>
                    <span className="font-semibold text-[#D4A843]">{t.revenue}</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-[#121018] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: t.share, backgroundColor: t.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device & Platform Breakdown */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">Shopper Platform Breakdown</h2>
            <p className="text-[11px] text-[#8E869B]">User engagement across device screen sizes</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-white/5 bg-[#121018] p-4">
              <span className="text-xl">📱</span>
              <div className="font-bold text-white text-lg mt-1">78.4%</div>
              <div className="text-[10px] text-[#8E869B] mt-0.5">Mobile (iOS &amp; Android)</div>
              <div className="text-[10px] text-[#4ADE80] mt-1 font-semibold">38,350 visits</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#121018] p-4">
              <span className="text-xl">💻</span>
              <div className="font-bold text-white text-lg mt-1">20.1%</div>
              <div className="text-[10px] text-[#8E869B] mt-0.5">Desktop &amp; Laptop</div>
              <div className="text-[10px] text-[#4ADE80] mt-1 font-semibold">9,830 visits</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#121018] p-4">
              <span className="text-xl">📟</span>
              <div className="font-bold text-white text-lg mt-1">1.5%</div>
              <div className="text-[10px] text-[#8E869B] mt-0.5">Tablet &amp; iPad</div>
              <div className="text-[10px] text-[#4ADE80] mt-1 font-semibold">740 visits</div>
            </div>
          </div>

          <div className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/5 p-3.5 text-xs text-[#E5B558] space-y-1">
            <div className="font-bold">✨ AI Luxury Intelligence Insight</div>
            <p className="text-[11px] text-[#C7BFD2]">
              Mobile shoppers convert 32% faster on WhatsApp COD confirmations. Instagram ads driving to Rings category show the highest return on ad spend (5.4x ROAS).
            </p>
          </div>
        </div>
      </div>

      {/* Top 5 Products Table */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-white">Top 5 Best-Selling Pieces</h2>
            <p className="text-[11px] text-[#8E869B] mt-0.5">Ranked by gross sales volume and conversion rate</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/5 bg-[#14121A]/50">
              <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Jewellery Design</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Units Sold</th>
                <th className="px-5 py-3">Gross Revenue</th>
                <th className="px-5 py-3 text-right">View-to-Cart Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topProducts.map((p) => (
                <tr key={p.sku} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[#D4A843]">#{p.rank}</td>
                  <td className="px-5 py-3.5 font-semibold text-white">{p.name}</td>
                  <td className="px-5 py-3.5 text-[#736B7F] font-mono">{p.sku}</td>
                  <td className="px-5 py-3.5 text-[#C7C0D2]">{p.category}</td>
                  <td className="px-5 py-3.5 font-semibold text-white">{p.units} orders</td>
                  <td className="px-5 py-3.5 font-bold text-[#D4A843]">{p.revenue}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-[#4ADE80]">{p.conv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
