'use client';
import { useState } from 'react';
import { formatINR } from '@/lib/money';
import { useSection } from './use-section';

export interface OrderItem {
  id: string;
  customer: string;
  email?: string;
  phone?: string;
  address?: string;
  item: string;
  amount: number; // in paise
  payment: string;
  status: string;
  date: string;
  type: string;
}

export function OrdersClient({ initial, role, overrides = {} }: { initial: OrderItem[]; role: string; overrides?: Record<string, string> }) {
  const saved = useSection<Record<string, string>>('orders-demo', overrides);
  const [orders, setOrders] = useState<OrderItem[]>(initial);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = ['All', 'Processing', 'Delivered', 'Cancelled'];

  const filtered = orders.filter((o) => {
    if (activeTab === 'Processing' && o.status !== 'Processing') return false;
    if (activeTab === 'Delivered' && o.status !== 'Delivered') return false;
    if (activeTab === 'Cancelled' && o.status !== 'Cancelled') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.item.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Items', 'Amount (Paise)', 'Payment Status', 'Fulfilment Status', 'Date'];
    const rows = orders.map((o) => [
      `"${o.id}"`,
      `"${o.customer}"`,
      `"${o.item}"`,
      o.amount,
      `"${o.payment}"`,
      `"${o.status}"`,
      `"${o.date}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AurNya_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders exported to CSV successfully');
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    // Saved on the server. An admin's or manager's change waits for the owner; the table only changes once it is really applied.
    const r = await saved.commit({ ...saved.value, [selectedOrder.id]: newStatus });
    if (r !== 'applied') { if (r === 'pending') showToast('Sent to the owner for approval'); return; }
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
    );
    setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    showToast(`Order ${selectedOrder.id} status changed to ${newStatus}`);
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
          <h1 className="text-2xl font-bold font-serif text-white">Orders Management</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            {orders.length} orders total · Sample orders (connect your database to see real ones)
          </p>
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

      {/* Controls: Search & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 text-xs">
          {tabs.map((tab) => {
            const count =
              tab === 'All'
                ? orders.length
                : orders.filter((o) => o.status === tab).length;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-3.5 py-1.5 transition-colors text-xs font-medium ${
                  active
                    ? 'bg-[#D4A843] text-[#14121A] font-bold shadow-md shadow-[#D4A843]/10'
                    : 'border border-white/10 text-[#C7C0D2] hover:bg-white/5'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#181521] px-3.5 py-1.5 text-xs text-white placeholder-[#5E566A] focus:outline-none focus:border-[#D4A843]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/5 bg-[#14121A]/50">
              <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Purchased Items</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Fulfilment Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[#D4A843]">{o.id}</td>
                  <td className="px-5 py-3.5 font-medium text-white">{o.customer}</td>
                  <td className="px-5 py-3.5 text-[#C7C0D2]">{o.item}</td>
                  <td className="px-5 py-3.5 font-semibold text-white">{formatINR(o.amount)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                        o.type === 'online'
                          ? 'bg-[#153424] text-[#4ADE80] border border-[#22C55E]/30'
                          : 'bg-[#1E2538] text-[#60A5FA] border border-[#3B82F6]/30'
                      }`}
                    >
                      {o.payment}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        o.status === 'Delivered'
                          ? 'bg-[#153424] text-[#4ADE80]'
                          : o.status === 'Cancelled'
                          ? 'bg-[#311C21] text-red-400'
                          : 'bg-[#3A2E16] text-[#E5B558]'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#736B7F]">{o.date}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(o)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-[#C7C0D2] hover:text-white hover:bg-white/10 hover:border-[#D4A843]/40 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-[#7E768B]">
                    No orders match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#181521] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-serif text-white">
                    Order {selectedOrder.id}
                  </h2>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      selectedOrder.status === 'Delivered'
                        ? 'bg-[#153424] text-[#4ADE80]'
                        : selectedOrder.status === 'Cancelled'
                        ? 'bg-[#311C21] text-red-400'
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

            <div className="space-y-4 text-xs">
              {/* Customer Box */}
              <div className="rounded-xl border border-white/5 bg-[#121018] p-3.5 space-y-1.5">
                <div className="text-[10px] font-semibold uppercase text-[#736B7F]">Customer &amp; Shipping</div>
                <div className="font-semibold text-white">{selectedOrder.customer}</div>
                <div className="text-[#C7C0D2]">{selectedOrder.email || 'customer@example.com'} · +91 98765 43210</div>
                <div className="text-[#8E869B]">14B, Heritage Crest, Bandra West, Mumbai, MH 400050</div>
              </div>

              {/* Items Box */}
              <div className="rounded-xl border border-white/5 bg-[#121018] p-3.5 space-y-2">
                <div className="text-[10px] font-semibold uppercase text-[#736B7F]">Ordered Items</div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-white font-medium">{selectedOrder.item}</span>
                  <span className="text-white font-semibold">{formatINR(selectedOrder.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8E869B] pt-2 border-t border-white/5">
                  <span>Payment ({selectedOrder.payment})</span>
                  <span>Free Express Delivery</span>
                </div>
              </div>

              {/* Status Update Control */}
              <div>
                <label className="block text-xs font-semibold text-[#C7C0D2] mb-1.5">
                  Update Fulfilment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Processing', 'Delivered', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateOrderStatus(st)}
                      className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                        selectedOrder.status === st
                          ? 'bg-[#D4A843] text-[#14121A] shadow-md shadow-[#D4A843]/10'
                          : 'border border-white/10 bg-[#121018] text-[#C7C0D2] hover:bg-white/5'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-[#C7C0D2]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
