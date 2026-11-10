'use client';
import { useState } from 'react';
import { useSection } from './use-section';

export interface CouponItem {
  code: string;
  kind: string;
  minSubtotal: string;
  redemptions: number;
  max: number;
  status: string;
}

export function CouponsClient({ initial }: { initial: CouponItem[] }) {
  const sec = useSection<CouponItem[]>('coupons-demo', initial);
  const items = sec.value;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CouponItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [kind, setKind] = useState('10% OFF');
  const [minSubtotal, setMinSubtotal] = useState('₹1,000');
  const [max, setMax] = useState<number>(200);
  const [status, setStatus] = useState('Active');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    setEditingItem(null);
    setCode('');
    setKind('10% OFF');
    setMinSubtotal('₹1,000');
    setMax(200);
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEdit = (item: CouponItem) => {
    setEditingItem(item);
    setCode(item.code);
    setKind(item.kind);
    setMinSubtotal(item.minSubtotal);
    setMax(item.max);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    if (editingItem) {
      const next = items.map((c) =>
        c.code === editingItem.code
          ? { ...c, code: code.toUpperCase().trim(), kind, minSubtotal, max: Number(max), status }
          : c
      );
      const r = await sec.commit(next);
      setIsModalOpen(false);
      if (r === 'applied') showToast(`Coupon "${code}" updated successfully`);
      return;
    } else {
      const newItem: CouponItem = {
        code: code.toUpperCase().trim(),
        kind,
        minSubtotal,
        redemptions: 0,
        max: Number(max) || 100,
        status,
      };
      const r = await sec.commit([newItem, ...items]);
      setIsModalOpen(false);
      if (r === 'applied') showToast(`Coupon "${code}" created successfully`);
    }
  };

  const handleDelete = async (codeToDelete: string) => {
    if (confirm(`Are you sure you want to delete coupon ${codeToDelete}?`)) {
      const r = await sec.commit(items.filter((c) => c.code !== codeToDelete));
      setIsModalOpen(false);
      if (r === 'applied') showToast('Coupon removed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#D4A843]/40 bg-[#1D1926] px-4 py-3 text-xs font-semibold text-white shadow-2xl flex items-center gap-2">
          <span className="text-[#4ADE80]">✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">Coupons &amp; Offers</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            Create promotional discount codes and track customer redemptions
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-4 py-2.5 transition-all shadow-md shadow-[#D4A843]/10 flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/5 bg-[#14121A]/50">
              <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
                <th className="px-5 py-3">Coupon Code</th>
                <th className="px-5 py-3">Discount Value</th>
                <th className="px-5 py-3">Min. Subtotal</th>
                <th className="px-5 py-3">Redemptions</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((c) => (
                <tr key={c.code} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-bold tracking-wider text-[#D4A843] font-mono">{c.code}</td>
                  <td className="px-5 py-3.5 font-semibold text-white">{c.kind}</td>
                  <td className="px-5 py-3.5 text-[#C7C0D2]">{c.minSubtotal}</td>
                  <td className="px-5 py-3.5 text-[#A59CB0]">{c.redemptions} / {c.max} used</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        c.status === 'Active'
                          ? 'bg-[#153424] text-[#4ADE80]'
                          : 'bg-[#2E2838] text-[#A59CB0]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-[#C7C0D2] hover:text-white hover:bg-white/10 hover:border-[#D4A843]/40 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#181521] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-base font-bold font-serif text-white">
                {editingItem ? `Edit Coupon: ${editingItem.code}` : 'Create New Coupon'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8E869B] hover:text-white text-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#C7C0D2] mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white uppercase font-mono placeholder-[#5E566A] focus:outline-none focus:border-[#D4A843]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#C7C0D2] mb-1">
                    Discount Type &amp; Value
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20% OFF or ₹500 Flat OFF"
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:outline-none focus:border-[#D4A843]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#C7C0D2] mb-1">
                    Min. Subtotal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹2,000"
                    value={minSubtotal}
                    onChange={(e) => setMinSubtotal(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:outline-none focus:border-[#D4A843]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#C7C0D2] mb-1">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={max}
                    onChange={(e) => setMax(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A843]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#C7C0D2] mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A843]"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingItem.code)}
                    className="text-xs text-red-400 hover:text-red-300 underline font-medium"
                  >
                    Delete Coupon
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-[#C7C0D2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-4 py-2 shadow-md shadow-[#D4A843]/10"
                  >
                    {editingItem ? 'Save Changes' : 'Create Coupon'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
