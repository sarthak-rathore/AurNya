'use client';
import { useState } from 'react';
import { useSection } from './use-section';
import { WhatsappBroadcast } from './whatsapp-broadcast';

export interface Campaign {
  id: string;
  name: string;
  channel: string;
  budget: string;
  spent: string;
  clicks: string;
  conversions: number;
  revenue: string;
  status: 'Active' | 'Paused';
}

export function MarketingClient({ saved, wa }: { saved?: Campaign[]; wa?: { configured: boolean; subscribers: number } }) {
  const [toast, setToast] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Campaigns
  const defaults: Campaign[] = [
    { id: '1', name: 'Festive Diwali Gold Glow', channel: 'Instagram & Meta Ads', budget: '₹50,000', spent: '₹38,400', clicks: '14,280', conversions: 112, revenue: '₹3,91,104', status: 'Active' },
    { id: '2', name: 'First Order 15% Welcome (FIRST15)', channel: 'Email Newsletter', budget: '₹5,000', spent: '₹3,200', clicks: '4,850', conversions: 89, revenue: '₹1,98,400', status: 'Active' },
    { id: '3', name: 'Bridal Heritage Solitaire Preview', channel: 'WhatsApp Concierge', budget: '₹12,000', spent: '₹8,900', clicks: '2,400', conversions: 34, revenue: '₹2,03,966', status: 'Active' },
    { id: '4', name: 'Abandoned Cart Recovery SMS', channel: 'SMS Automated Flow', budget: '₹8,000', spent: '₹4,100', clicks: '3,120', conversions: 45, revenue: '₹1,30,950', status: 'Active' },
  ];
  const sec = useSection<Campaign[]>('marketing', saved ?? defaults);
  const campaigns = sec.value;

  // Form Fields
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('Instagram & Meta Ads');
  const [budget, setBudget] = useState('₹25,000');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleCampaignStatus = async (id: string) => {
    const c = campaigns.find((x) => x.id === id);
    if (!c) return;
    const next: Campaign['status'] = c.status === 'Active' ? 'Paused' : 'Active';
    const r = await sec.commit(campaigns.map((x) => (x.id === id ? { ...x, status: next } : x)));
    if (r === 'applied') showToast(`Campaign "${c.name}" is now ${next}`);
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newC: Campaign = {
      id: String(Date.now()),
      name: name.trim(),
      channel,
      budget,
      spent: '₹0',
      clicks: '0',
      conversions: 0,
      revenue: '₹0',
      status: 'Active',
    };

    const r = await sec.commit([newC, ...campaigns]);
    setIsModalOpen(false);
    setName('');
    if (r === 'applied') showToast(`Campaign "${newC.name}" saved`);
  };

  const exportAudienceCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'AURNYA LUXURY JEWELLERY - VIP NEWSLETTER AUDIENCE',
        `Exported: ${new Date().toISOString()}`,
        '',
        'EMAIL,NAME,SUBSCRIBED DATE,LIFETIME PURCHASES,STATUS',
        'priya.sharma@gmail.com,Priya Sharma,2026-10-12,4,Active Subscriber',
        'arjun.mehta@gmail.com,Arjun Mehta,2026-10-18,2,Active Subscriber',
        'neha.verma@gmail.com,Neha Verma,2026-10-24,3,Active Subscriber',
        'kavya.iyer@gmail.com,Kavya Iyer,2026-09-29,5,VIP Member',
        'ananya.pandey@gmail.com,Ananya Pandey,2026-10-02,1,Active Subscriber',
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'AurNya_Subscribers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscriber list exported to CSV');
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
          <h1 className="text-2xl font-bold font-serif text-white">Marketing &amp; Outreach</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            Manage multi-channel campaigns, promotional discount funnels, and VIP subscriber lists
          </p>
        </div>

      {wa && <WhatsappBroadcast configured={wa.configured} subscribers={wa.subscribers} />}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-4 py-2.5 transition-all shadow-md shadow-[#D4A843]/10 flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Create Campaign</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 shadow-xl">
          <div className="text-xs text-[#8E869B] font-medium">Active Marketing Campaigns</div>
          <div className="text-2xl font-bold text-white mt-1">
            {campaigns.filter((c) => c.status === 'Active').length}
          </div>
          <div className="text-[11px] text-[#4ADE80] mt-1 font-semibold">Across Meta, WhatsApp &amp; Email</div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 shadow-xl">
          <div className="text-xs text-[#8E869B] font-medium">Total Email Subscribers</div>
          <div className="text-2xl font-bold text-white mt-1">1,420</div>
          <div className="text-[11px] text-[#4ADE80] mt-1 font-semibold">38.4% Average Open Rate</div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 shadow-xl">
          <div className="text-xs text-[#8E869B] font-medium">WhatsApp VIP Concierge List</div>
          <div className="text-2xl font-bold text-white mt-1">860</div>
          <div className="text-[11px] text-[#4ADE80] mt-1 font-semibold">82% Read Rate (Instant Delivery)</div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#181521] p-5 shadow-xl">
          <div className="text-xs text-[#8E869B] font-medium">Blended Return on Ad Spend (ROAS)</div>
          <div className="text-2xl font-bold text-[#D4A843] mt-1">4.8x</div>
          <div className="text-[11px] text-[#4ADE80] mt-1 font-semibold">₹9,24,422 Gross Sales Generated</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-white">Live Promotional Campaigns</h2>
            <p className="text-[11px] text-[#8E869B] mt-0.5">Real-time performance tracking and revenue conversion</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/5 bg-[#14121A]/50">
              <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
                <th className="px-5 py-3">Campaign Name</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Budget / Spent</th>
                <th className="px-5 py-3">Clicks</th>
                <th className="px-5 py-3">Conversions</th>
                <th className="px-5 py-3">Attributed Revenue</th>
                <th className="px-5 py-3 text-right">Status / Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-white">{c.name}</td>
                  <td className="px-5 py-3.5 text-[#C7C0D2]">
                    <span className="inline-block rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-[#D1CADB]">
                      {c.channel}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#A59CB0]">{c.spent} / {c.budget}</td>
                  <td className="px-5 py-3.5 font-medium text-white">{c.clicks}</td>
                  <td className="px-5 py-3.5 font-medium text-white">{c.conversions} orders</td>
                  <td className="px-5 py-3.5 font-bold text-[#D4A843]">{c.revenue}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleCampaignStatus(c.id)}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                        c.status === 'Active'
                          ? 'bg-[#153424] text-[#4ADE80] hover:bg-emerald-900/50'
                          : 'bg-[#2E2838] text-[#8E869B] hover:bg-zinc-700'
                      }`}
                    >
                      {c.status === 'Active' ? '● Active (Running)' : '○ Paused'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audience Section */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-base font-bold font-serif text-white">VIP Audience &amp; Newsletter Lists</h2>
            <p className="text-[11px] text-[#8E869B]">Export customer emails for Meta Custom Audiences and Klaviyo/Mailchimp sync</p>
          </div>
          <button
            type="button"
            onClick={exportAudienceCSV}
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 transition-colors flex items-center gap-2"
          >
            <span>⬇</span>
            <span>Export Subscribers CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-white/5 bg-[#121018] p-4 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-[#736B7F]">Email Newsletter</div>
            <div className="font-bold text-white text-base">1,420 Active</div>
            <p className="text-[11px] text-[#8E869B]">Weekly Friday showcase of new arrivals and seasonal private sales</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#121018] p-4 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-[#736B7F]">WhatsApp Broadcast Club</div>
            <div className="font-bold text-white text-base">860 Members</div>
            <p className="text-[11px] text-[#8E869B]">High-value customer channel for early access to solitaire launches</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#121018] p-4 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-[#736B7F]">SMS Remarketing Flow</div>
            <div className="font-bold text-white text-base">3,490 Contacts</div>
            <p className="text-[11px] text-[#8E869B]">Automatic 2-hour recovery reminders for abandoned checkout carts</p>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#181521] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-base font-bold font-serif text-white">Create Promotional Campaign</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8E869B] hover:text-white text-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D1CADB] mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Season Solitaire Special"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:outline-none focus:border-[#D4A843]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1CADB] mb-1">
                  Marketing Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A843]"
                >
                  <option value="Instagram & Meta Ads">Instagram &amp; Meta Ads</option>
                  <option value="Email Newsletter">Email Newsletter</option>
                  <option value="WhatsApp Concierge">WhatsApp Concierge</option>
                  <option value="Google Performance Max">Google Performance Max</option>
                  <option value="SMS Automated Flow">SMS Automated Flow</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1CADB] mb-1">
                  Budget Allocation (₹)
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="₹25,000"
                  className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A843]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
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
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
