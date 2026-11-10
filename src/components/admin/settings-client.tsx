'use client';
import { useState } from 'react';
import { useSection } from './use-section';

export type SavedSettings = Partial<Record<'storeName' | 'tagline' | 'supportEmail' | 'supportPhone' | 'storeAddress' | 'gstin' | 'freeShippingThreshold' | 'standardShippingFee' | 'maxCodAmount' | 'returnDays' | 'metaTitle' | 'metaDescription' | 'ga4Id' | 'pixelId', string>> & { toggles?: Record<string, boolean> };

export function SettingsClient({ saved = {} }: { saved?: SavedSettings }) {
  const sec = useSection<SavedSettings>('settings', saved);
  const [toast, setToast] = useState<string | null>(null);

  // General Store State
  const [storeName, setStoreName] = useState(saved.storeName ?? 'AurNya Luxury Jewellery');
  const [tagline, setTagline] = useState(saved.tagline ?? 'Timeless Handcrafted Indian Luxury');
  const [supportEmail, setSupportEmail] = useState(saved.supportEmail ?? 'concierge@aurnya.com');
  const [supportPhone, setSupportPhone] = useState(saved.supportPhone ?? '+91 98200 12345');
  const [storeAddress, setStoreAddress] = useState(saved.storeAddress ?? '14B, Heritage Crest, Linking Road, Bandra West, Mumbai, MH 400050');
  const [gstin, setGstin] = useState(saved.gstin ?? '27AADCA1234F1Z8');

  // Order & Logistics
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(saved.freeShippingThreshold ?? '999');
  const [standardShippingFee, setStandardShippingFee] = useState(saved.standardShippingFee ?? '99');
  const [maxCodAmount, setMaxCodAmount] = useState(saved.maxCodAmount ?? '15000');
  const [returnDays, setReturnDays] = useState(saved.returnDays ?? '7');

  // Switches / Toggles
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    orderEmailAlerts: true,
    lowStockSmsAlerts: true,
    customerReviewAlerts: false,
    dailySalesDigest: true,
    maintenanceMode: false,
    twoFactorAuth: true,
    ...(saved.toggles ?? {}),
  });

  // SEO & Social
  const [metaTitle, setMetaTitle] = useState(saved.metaTitle ?? 'AurNya | Fine Handcrafted Jewellery & Solitaires');
  const [metaDescription, setMetaDescription] = useState(saved.metaDescription ?? 'Discover AurNya’s heirloom jewellery collections: 18K/22K gold rings, diamond earrings, handcrafted necklaces and bridal couture.');
  const [ga4Id, setGa4Id] = useState(saved.ga4Id ?? 'G-AURNYA2026');
  const [pixelId, setPixelId] = useState(saved.pixelId ?? 'FB-AURNYA-8921');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    showToast('Changed. Press Save All Changes to apply it.');
  };

  // Saved on the server. An admin's or manager's save waits for the owner's approval.
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const value: SavedSettings = { storeName, tagline, supportEmail, supportPhone, storeAddress, gstin, freeShippingThreshold, standardShippingFee, maxCodAmount, returnDays, metaTitle, metaDescription, ga4Id, pixelId, toggles };
    const r = await sec.commit(value);
    if (r === 'applied') showToast('Store settings saved ✓');
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
          <h1 className="text-2xl font-bold font-serif text-white">Store Settings</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            Configure store profile, regional standards, shipping thresholds, and notification rules
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-5 py-2.5 transition-all shadow-md shadow-[#D4A843]/10"
        >
          Save All Changes
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Profile Card */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">General Store Profile</h2>
            <p className="text-[11px] text-[#8E869B]">Public business credentials displayed on receipts &amp; invoices</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Store Name *</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Brand Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Concierge Phone</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#D4A843] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Store Currency</label>
              <input
                type="text"
                disabled
                value="Indian Rupee (₹ INR)"
                className="w-full rounded-xl border border-white/10 bg-[#121018]/50 px-3.5 py-2.5 text-xs text-[#8E869B] cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Boutique Flagship Address</label>
            <textarea
              rows={2}
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            />
          </div>
        </div>

        {/* Shipping & Checkout Rules */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">Shipping &amp; Checkout Rules</h2>
            <p className="text-[11px] text-[#8E869B]">Set delivery fee calculations and return windows</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Free Shipping Above (₹)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
              />
              <p className="text-[10px] text-[#8E869B] mt-1">Orders above this get free delivery</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Standard Shipping Fee (₹)</label>
              <input
                type="number"
                value={standardShippingFee}
                onChange={(e) => setStandardShippingFee(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
              />
              <p className="text-[10px] text-[#8E869B] mt-1">Charged when subtotal is below threshold</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Max. COD Order Value (₹)</label>
              <input
                type="number"
                value={maxCodAmount}
                onChange={(e) => setMaxCodAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
              />
              <p className="text-[10px] text-[#8E869B] mt-1">Higher amounts require online prepayment</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Return / Exchange Window</label>
              <input
                type="text"
                value={`${returnDays} Days from delivery`}
                onChange={(e) => setReturnDays(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
              />
              <p className="text-[10px] text-[#8E869B] mt-1">Hassle-free reverse pick up period</p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-2 border-t border-white/5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#736B7F]">Store Alerts &amp; Security</h3>

            <div className="flex items-center justify-between text-xs">
              <div>
                <div className="font-medium text-white">Instant Order Email Notifications</div>
                <div className="text-[11px] text-[#8E869B]">Notify store admin immediately when a customer orders</div>
              </div>
              <button
                type="button"
                onClick={() => toggle('orderEmailAlerts')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  toggles.orderEmailAlerts ? 'bg-[#22C55E]' : 'bg-[#3A3347]'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition mt-0.5 ml-0.5 ${
                  toggles.orderEmailAlerts ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <div className="font-medium text-white">Low Stock SMS Alerts</div>
                <div className="text-[11px] text-[#8E869B]">Send alert when inventory dips below 5 units</div>
              </div>
              <button
                type="button"
                onClick={() => toggle('lowStockSmsAlerts')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  toggles.lowStockSmsAlerts ? 'bg-[#22C55E]' : 'bg-[#3A3347]'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition mt-0.5 ml-0.5 ${
                  toggles.lowStockSmsAlerts ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <div className="font-medium text-white">Daily Performance Summary Digest</div>
                <div className="text-[11px] text-[#8E869B]">Receive 9:00 PM evening WhatsApp / email sales summary</div>
              </div>
              <button
                type="button"
                onClick={() => toggle('dailySalesDigest')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  toggles.dailySalesDigest ? 'bg-[#22C55E]' : 'bg-[#3A3347]'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition mt-0.5 ml-0.5 ${
                  toggles.dailySalesDigest ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* SEO & Tracking Card */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4 lg:col-span-2">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">SEO &amp; Marketing Tracking Tags</h2>
            <p className="text-[11px] text-[#8E869B]">Google Search Console, Analytics 4, and Meta Advertising integration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Global Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Google Analytics 4 Measurement ID</label>
              <input
                type="text"
                value={ga4Id}
                onChange={(e) => setGa4Id(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#D4A843] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Global Meta Description</label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Meta Pixel ID (Facebook / Instagram Ads)</label>
              <input
                type="text"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="1234567890"
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#D4A843] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-6 py-2.5 transition-all shadow-md shadow-[#D4A843]/10"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
