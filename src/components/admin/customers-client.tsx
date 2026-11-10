'use client';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export interface CustomerItem {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: string;
  city: string;
  joined: string;
  status: string;
  whatsapp?: boolean;
}

export function CustomersClient({ initial, total, demo = false }: { initial: CustomerItem[]; total?: number; demo?: boolean }) {
  const [customers] = useState<CustomerItem[]>(initial);
  const seg = usePathname().split('/')[1];
  const base = seg === 'owner' ? '/owner' : '/admin';
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
  });

  const exportCSV = () => {
    const headers = ['Customer Name', 'Email', 'Orders Count', 'Total Spent', 'City', 'Joined Date', 'Status'];
    const rows = customers.map((c) => [
      `"${c.name}"`,
      `"${c.email}"`,
      c.orders,
      `"${c.spent}"`,
      `"${c.city}"`,
      `"${c.joined}"`,
      `"${c.status}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AurNya_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer list exported to CSV');
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
          <h1 className="text-2xl font-bold font-serif text-white">Customers</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            {demo ? 'Sample customers (connect your database to see real ones)' : `${total ?? customers.length} registered customer account${(total ?? customers.length) === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 transition-colors flex items-center gap-2"
        >
          <span>⬇</span>
          <span>Export Customers</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="w-full sm:w-72">
        <input
          type="text"
          placeholder="Search by name, email or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#181521] px-3.5 py-2 text-xs text-white placeholder-[#5E566A] focus:outline-none focus:border-[#D4A843]"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/5 bg-[#14121A]/50">
              <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
                <th className="px-5 py-3">Customer Name</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Total Spent</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Customer Tier</th>
                <th className="px-5 py-3">WhatsApp</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-white">{c.name}</td>
                  <td className="px-5 py-3.5 text-[#736B7F]">{c.email}</td>
                  <td className="px-5 py-3.5 text-white font-medium">{c.orders} orders</td>
                  <td className="px-5 py-3.5 font-bold text-[#D4A843]">{c.spent}</td>
                  <td className="px-5 py-3.5 text-[#C7C0D2]">{c.city}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        c.status.includes('VIP')
                          ? 'bg-[#402C12] text-[#D4A843] border border-[#D4A843]/30'
                          : 'bg-[#153424] text-[#4ADE80]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[11px]">
                    {c.whatsapp ? <span className="text-[#4ADE80]">Subscribed</span> : <span className="text-[#736B7F]">{demo ? '—' : 'Not subscribed'}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(c)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-[#C7C0D2] hover:text-white hover:bg-white/10 hover:border-[#D4A843]/40 transition-colors"
                    >
                      View Orders
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#181521] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold font-serif text-white">
                  Customer Profile
                </h2>
                <p className="text-[11px] text-[#7E768B] mt-0.5">Joined {selectedCustomer.joined}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-[#8E869B] hover:text-white text-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-[#121018] p-3">
                  <div className="text-[10px] text-[#7E768B]">Name &amp; Tier</div>
                  <div className="font-bold text-white text-sm mt-0.5">{selectedCustomer.name}</div>
                  <div className="text-[10px] text-[#D4A843] font-semibold mt-1">{selectedCustomer.status}</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#121018] p-3">
                  <div className="text-[10px] text-[#7E768B]">Total Spent</div>
                  <div className="font-bold text-[#D4A843] text-sm mt-0.5">{selectedCustomer.spent}</div>
                  <div className="text-[10px] text-[#7E768B] mt-1">{selectedCustomer.orders} orders placed</div>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#121018] p-3.5 space-y-1">
                <div className="text-[10px] font-semibold uppercase text-[#736B7F]">Contact &amp; Location</div>
                <div className="text-white">{selectedCustomer.email}</div>
                <div className="text-[#8E869B]">{selectedCustomer.city}, India</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#121018] p-3.5 space-y-2">
                <div className="text-[10px] font-semibold uppercase text-[#736B7F]">Orders</div>
                {demo ? (
                  <p className="text-[#8E869B]">Sample customer. Connect your database to see real order history.</p>
                ) : (
                  <p className="text-[#C7C0D2]">
                    {selectedCustomer.orders} order{selectedCustomer.orders === 1 ? '' : 's'} placed ·{' '}
                    <a className="text-[#D4A843] underline" href={`${base}/orders?q=${encodeURIComponent(selectedCustomer.email)}`}>See this customer’s orders →</a>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
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
