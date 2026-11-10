import { requireRole } from '@/lib/role-auth';

export const metadata = { title: 'Payments & Payouts' };

export default async function OwnerPayments() {
  await requireRole('owner');

  const transactions = [
    { id: 'PAY_AN42891', order: '#AN42891', method: 'Razorpay UPI', amount: '₹3,492', fee: '₹70', net: '₹3,422', status: 'Settled', date: 'Nov 7, 2026' },
    { id: 'PAY_AN42890', order: '#AN42890', method: 'Razorpay Card', amount: '₹5,999', fee: '₹120', net: '₹5,879', status: 'Settled', date: 'Nov 7, 2026' },
    { id: 'PAY_AN42889', order: '#AN42889', method: 'Razorpay NetBanking', amount: '₹2,899', fee: '₹58', net: '₹2,841', status: 'Settled', date: 'Nov 6, 2026' },
    { id: 'PAY_AN42888', order: '#AN42888', method: 'Cash on Delivery (COD)', amount: '₹1,799', fee: '₹0', net: '₹1,799', status: 'Pending Courier Remit', date: 'Nov 6, 2026' },
    { id: 'REF_AN42865', order: '#AN42865', method: 'Razorpay Refund', amount: '-₹3,249', fee: '₹0', net: '-₹3,249', status: 'Refunded', date: 'Nov 4, 2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">Payments &amp; Payouts</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            Razorpay settlements, COD reconciliations, and customer refunds
          </p>
        </div>
      <div role="note" className="rounded-xl border border-[#D4A843]/30 bg-[#D4A843]/5 px-4 py-2.5 text-[11px] text-[#E5B558]">Sample data: these figures are examples for now. Your real payments are in the Razorpay dashboard, and each online order shows its payment ID on the order page.</div>
        <button
          type="button"
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 transition-colors"
        >
          ⬇ Settlement Statement
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-4">
          <div className="text-xs text-[#8A8197] font-medium">Net Settled This Month</div>
          <div className="text-2xl font-bold text-white mt-1">₹10,98,740</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="text-xs text-amber-400 font-medium">Pending Payout (Razorpay)</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">₹34,850</div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-4">
          <div className="text-xs text-[#8A8197] font-medium">Total Refunds Processed</div>
          <div className="text-2xl font-bold text-red-400 mt-1">₹1,47,580</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/5 bg-[#14121A]/50">
              <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
                <th className="px-5 py-3">Transaction ID</th>
                <th className="px-5 py-3">Order Number</th>
                <th className="px-5 py-3">Payment Method</th>
                <th className="px-5 py-3">Gross Amount</th>
                <th className="px-5 py-3">Gateway Fee</th>
                <th className="px-5 py-3">Net Payout</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-mono text-[11px] text-[#A59CB0]">{t.id}</td>
                  <td className="px-5 py-3.5 font-bold text-[#D4A843]">{t.order}</td>
                  <td className="px-5 py-3.5 text-white">{t.method}</td>
                  <td className="px-5 py-3.5 font-semibold text-white">{t.amount}</td>
                  <td className="px-5 py-3.5 text-[#736B7F]">{t.fee}</td>
                  <td className="px-5 py-3.5 font-bold text-[#4ADE80]">{t.net}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        t.status === 'Settled'
                          ? 'bg-[#153424] text-[#4ADE80]'
                          : t.status === 'Refunded'
                          ? 'bg-[#311C21] text-red-400'
                          : 'bg-[#3A2E16] text-[#E5B558]'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#736B7F]">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
