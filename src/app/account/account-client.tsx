'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/store/auth-context';
import { useShop } from '@/store/shop-context';
import type { UserProfile, UserAddress } from '@/lib/types';
import { formatINR } from '@/lib/money';

/* ── Interfaces ──────────────────────────────────────────────────────────── */
interface OrderRow {
  id: string;
  orderNumber: number;
  status: string;
  totalPaise: number;
  paymentMethod?: string;
  createdAt: Date | string;
}

interface Props {
  user: UserProfile;
  addresses: UserAddress[];
  orders: OrderRow[];
}

type TabKey =
  | 'overview'
  | 'digital-gold'
  | 'profile'
  | 'payments'
  | 'addresses'
  | 'wishlist'
  | 'orders'
  | 'gift-card'
  | 'aurpass'
  | 'ring-size';

/* ── Status Color Mapping ─────────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  pending_payment: { label: 'Awaiting Payment', badge: 'bg-amber-100 text-amber-900 border border-amber-300' },
  paid:            { label: 'Payment Confirmed', badge: 'bg-emerald-100 text-emerald-900 border border-emerald-300' },
  packed:          { label: 'Packed & Inspected', badge: 'bg-blue-100 text-blue-900 border border-blue-300' },
  shipped:         { label: 'In Transit', badge: 'bg-indigo-100 text-indigo-900 border border-indigo-300' },
  delivered:       { label: 'Delivered', badge: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-semibold' },
  cancelled:       { label: 'Cancelled', badge: 'bg-rose-100 text-rose-900 border border-rose-300' },
  refunded:        { label: 'Refunded', badge: 'bg-stone-200 text-stone-900 border border-stone-300' },
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Svg Icons matching Tanishq account tabs ─────────────────────────────── */
const Icons = {
  user: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>,
  gold: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 3v5M8 8l4-5 4 5"/></svg>,
  doc: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  card: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  pin: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  heart: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  box: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  gift: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  pass: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
  ring: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="14" r="7"/><path d="M9 4h6l2 3H7l2-3z"/></svg>,
};

export function AccountClient({ user, addresses, orders }: Props) {
  const { logout } = useAuth();
  const { wishlist } = useShop();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Edit personal info state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone ?? '+91 9525509617');
  const [dob, setDob] = useState('14 Aug 1998');
  const [anniversary, setAnniversary] = useState('—');
  const [coins] = useState(250); // AurNya Coins rewards
  const [profileMsg, setProfileMsg] = useState('');

  // Address state
  const [addrList, setAddrList] = useState<UserAddress[]>(addresses);
  const [addingAddr, setAddingAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: 'Home', recipientName: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', phone: '' });

  // Password change state
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confPw, setConfPw] = useState('');
  const [pwMsg, setPwMsg] = useState({ text: '', error: false });

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg('Saving…');
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, phone }),
    });
    setProfileMsg(res.ok ? '✓ Details saved successfully' : 'Failed to save');
    if (res.ok) {
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileMsg('');
      }, 1000);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confPw) {
      setPwMsg({ text: 'New passwords do not match.', error: true });
      return;
    }
    const r = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
    });
    const d = await r.json() as { message?: string; error?: string };
    if (r.ok) {
      setPwMsg({ text: d.message ?? 'Password updated!', error: false });
      setCurPw(''); setNewPw(''); setConfPw('');
    } else {
      setPwMsg({ text: d.error ?? 'Failed to update', error: true });
    }
  }

  async function addAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAddr, isDefault: addrList.length === 0 }),
    });
    if (r.ok) {
      const d = await r.json() as { address: UserAddress };
      setAddrList(p => [...p, d.address]);
      setAddingAddr(false);
      setNewAddr({ label: 'Home', recipientName: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', phone: '' });
    }
  }

  async function deleteAddr(id: number) {
    await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
    setAddrList(p => p.filter(a => a.id !== id));
  }

  async function setDefaultAddr(id: number) {
    await fetch(`/api/account/addresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    setAddrList(p => p.map(a => ({ ...a, isDefault: a.id === id })));
  }

  /* ── Sidebar Tab Config ─────────────────────────────────────────────── */
  const tabs = [
    { key: 'overview',     label: 'Overview',              icon: Icons.user, badge: null },
    { key: 'digital-gold', label: 'AurNya Digital Gold',   icon: Icons.gold, badge: null },
    { key: 'profile',      label: 'Personal Information',  icon: Icons.doc,  badge: null },
    { key: 'payments',     label: 'Saved Payments Method', icon: Icons.card, badge: null },
    { key: 'addresses',    label: 'Address Book',          icon: Icons.pin,  badge: null },
    { key: 'wishlist',     label: 'Wishlist',              icon: Icons.heart, badge: wishlist.length > 0 ? String(wishlist.length) : null },
    { key: 'orders',       label: 'Order History',         icon: Icons.box,  badge: orders.length > 0 ? String(orders.length) : null },
    { key: 'gift-card',    label: 'Gift Card Balance',     icon: Icons.gift, badge: null },
    { key: 'aurpass',      label: 'AurPass VIP',           icon: Icons.pass, badge: null },
    { key: 'ring-size',    label: 'Ring Size Guide',       icon: Icons.ring, badge: 'New' },
  ] as const;

  const currentTabObj = tabs.find(t => t.key === activeTab);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#221c25] py-6 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* ── Breadcrumb matching Tanishq: Home | My Account | Tab ── */}
        <nav className="mb-4 text-xs tracking-wider text-[#6b6070] flex items-center gap-2">
          <Link href="/" className="hover:text-[#832729] font-medium">Home</Link>
          <span>|</span>
          <button onClick={() => setActiveTab('overview')} className="hover:text-[#832729] font-medium">My Account</button>
          <span>|</span>
          <span className="text-[#832729] font-semibold">{currentTabObj?.label}</span>
        </nav>

        {/* ── Title bar with signout ── */}
        <div className="mb-6 flex items-center justify-between border-b border-[#e5d8d0] pb-4">
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#1f1a24] tracking-tight">My Account</h1>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest font-semibold text-[#832729] hover:underline"
          >
            Sign Out
          </button>
        </div>

        {/* ── Two Column Layout (Tanishq Style) ── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">

          {/* ──── LEFT SIDEBAR NAVIGATION ──── */}
          <aside className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-[#ecdcd5] bg-white shadow-sm">
              <nav aria-label="Account Tabs" className="divide-y divide-[#f2e6e1]">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as TabKey)}
                      className={`flex w-full items-center justify-between px-5 py-3.5 text-left text-sm transition ${
                        isActive
                          ? 'bg-[#832729] text-white font-medium shadow-inner'
                          : 'text-[#2e2632] hover:bg-[#faf4f0] hover:text-[#832729]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-white' : 'text-[#832729]'}>
                          <Icon />
                        </span>
                        <span className="tracking-wide text-[13px] font-medium">{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          tab.badge === 'New'
                            ? (isActive ? 'bg-[#f4d180] text-[#4d1618]' : 'bg-[#faecd0] text-[#734b07]')
                            : (isActive ? 'bg-white/20 text-white' : 'bg-[#f2e6e1] text-[#832729]')
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* ──── HELPLINE BOX (Like Tanishq Customer Care) ──── */}
            <div className="rounded-xl border border-[#ecdcd5] bg-[#fffaf5] p-5 text-xs text-[#4a3f3b] shadow-sm">
              <p className="font-bold text-sm text-[#832729] mb-1">Customer Care Support</p>
              <p className="leading-relaxed text-[#4a3f3b]">
                If you have any questions or issues with an order, please contact our Concierge team at{' '}
                <a href="mailto:customercare@aurnya.com" className="font-bold text-[#832729] underline">customercare@aurnya.com</a>{' '}
                or call toll free{' '}
                <a href="tel:18002660123" className="font-bold text-[#832729]">1800-266-0123</a>.
              </p>
              <p className="mt-2 text-[11px] font-semibold text-[#735359]">Available 24/7 · Mon to Sun</p>
            </div>
          </aside>

          {/* ──── RIGHT MAIN CONTENT PANEL ──── */}
          <main className="space-y-6 text-[#221c25]">

            {/* ═════════ 1. TAB: OVERVIEW ═════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-up">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl md:text-3xl text-[#1f1a24] font-medium">Account Overview</h2>
                </div>

                {/* Personal Information Box (Identical to Image 3) */}
                <div className="rounded-xl border border-[#ecdcd5] bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between border-b border-[#f2e6e1] pb-3">
                    <h3 className="font-bold text-base text-[#832729]">Personal Information</h3>
                    <button
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="rounded-md border border-[#832729] px-4 py-1.5 text-xs font-semibold text-[#832729] hover:bg-[#832729] hover:text-white transition"
                    >
                      {isEditingProfile ? 'Cancel' : 'Edit Details'}
                    </button>
                  </div>

                  {!isEditingProfile ? (
                    <div className="space-y-3 text-sm text-[#2e2632]">
                      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] items-center">
                        <span className="text-[#6b6070] font-normal">Name</span>
                        <span className="font-semibold text-[#1f1a24]">: {user.firstName} {user.lastName}</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] items-center">
                        <span className="text-[#6b6070] font-normal">Date of birth</span>
                        <span className="font-medium text-[#1f1a24]">: {dob}</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] items-center">
                        <span className="text-[#6b6070] font-normal">Anniversary date</span>
                        <span className="font-medium text-[#1f1a24]">: {anniversary}</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] items-center">
                        <span className="text-[#6b6070] font-normal">Phone number</span>
                        <span className="font-medium text-[#1f1a24]">: {phone}</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] items-center">
                        <span className="text-[#6b6070] font-normal">Email address</span>
                        <span className="font-medium text-[#1f1a24]">: {user.email}</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] items-center">
                        <span className="text-[#6b6070] font-normal">AurNya Coins</span>
                        <span className="font-bold text-[#832729]">: {coins} Coins (Value: ₹{coins})</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={saveProfile} className="space-y-4 pt-2">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">First Name</label>
                          <input value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm focus:border-[#832729] focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Last Name</label>
                          <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm focus:border-[#832729] focus:outline-none" />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Date of Birth</label>
                          <input value={dob} onChange={e => setDob(e.target.value)} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm focus:border-[#832729] focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Phone Number</label>
                          <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm focus:border-[#832729] focus:outline-none" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="submit" className="rounded-full bg-[#832729] px-6 py-2 text-xs uppercase font-semibold tracking-wider text-white hover:bg-black">
                          Save Changes
                        </button>
                        {profileMsg && <span className="text-xs text-emerald-800 font-bold">{profileMsg}</span>}
                      </div>
                    </form>
                  )}
                </div>

                {/* Quick KPI Stat Highlights */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#ecdcd5] bg-white p-4 text-center shadow-sm">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-[#6b6070]">Orders Placed</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-[#1f1a24]">{orders.length}</p>
                  </div>
                  <div className="rounded-xl border border-[#ecdcd5] bg-white p-4 text-center shadow-sm">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-[#6b6070]">In Transit</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-indigo-800">
                      {orders.filter(o => ['packed', 'shipped'].includes(o.status)).length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#ecdcd5] bg-white p-4 text-center shadow-sm">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-[#6b6070]">Saved Addresses</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-[#1f1a24]">{addrList.length}</p>
                  </div>
                  <div className="rounded-xl border border-[#ecdcd5] bg-white p-4 text-center shadow-sm">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-[#6b6070]">AurPass Tier</p>
                    <p className="mt-1 font-serif text-xl font-bold text-[#832729]">Gold VIP</p>
                  </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="rounded-xl border border-[#ecdcd5] bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between border-b border-[#f2e6e1] pb-3">
                    <h3 className="font-serif text-xl font-medium text-[#1f1a24]">Recent Orders</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-semibold text-[#832729] hover:underline">
                      View All Orders →
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <p className="text-sm text-[#6b6070]">No orders yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 2).map(o => (
                        <div key={o.id} className="flex items-center justify-between rounded-lg border border-[#f2e6e1] bg-[#fdfbf9] p-4 text-sm">
                          <div>
                            <span className="font-bold text-[#1f1a24]">Order #{o.orderNumber}</span>
                            <span className="ml-3 text-xs text-[#6b6070]">{fmtDate(o.createdAt)}</span>
                            <p className="text-xs font-medium text-[#4a3f3b] mt-0.5">Total: {formatINR(o.totalPaise)}</p>
                          </div>
                          <Link href={`/order/${o.id}`} className="rounded-full bg-[#832729] px-4 py-1.5 text-xs text-white font-medium uppercase tracking-wider hover:bg-black transition">
                            Track →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═════════ 2. TAB: ORDER HISTORY (Identical to Image 2) ═════════ */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-up">
                <h2 className="font-serif text-2xl md:text-3xl text-[#1f1a24] font-medium">Order History</h2>

                {orders.length === 0 ? (
                  /* Empty state matching Tanishq: Delivery Box illustration + Text + Continue Shopping */
                  <div className="rounded-xl border border-[#ecdcd5] bg-white py-16 px-6 text-center shadow-sm">
                    {/* Illustrated Open Box graphic */}
                    <div className="mx-auto mb-6 w-32 h-32 relative flex items-center justify-center">
                      <div className="w-24 h-24 border-2 border-[#d6c7bf] bg-[#faf4f0] rounded-lg relative flex items-center justify-center shadow-inner">
                        <div className="w-16 h-12 border border-[#b8a79d] bg-white rounded flex items-center justify-center text-2xl">
                          📦
                        </div>
                      </div>
                      <span className="absolute -top-1 -right-1 text-2xl animate-bounce">✨</span>
                    </div>

                    <h3 className="font-serif text-2xl text-[#832729] font-bold">No Order Details Yet !</h3>
                    <p className="mt-1 text-sm font-medium text-[#6b6070]">Add AurNya To Your Jewellery Wardrobe</p>
                    <Link
                      href="/shop"
                      className="mt-6 inline-block rounded-md bg-[#832729] px-8 py-3 text-xs uppercase font-semibold tracking-widest text-white transition hover:bg-black shadow"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => {
                      const st = STATUS_MAP[o.status] ?? { label: o.status, badge: 'bg-stone-100 text-stone-900 border border-stone-300' };
                      return (
                        <div key={o.id} className="rounded-xl border border-[#ecdcd5] bg-white p-5 shadow-sm transition hover:border-[#832729]">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f2e6e1] pb-3">
                            <div>
                              <span className="font-serif text-lg font-bold text-[#832729]">Order #{o.orderNumber}</span>
                              <span className="ml-3 text-xs font-medium text-[#6b6070]">Placed on {fmtDate(o.createdAt)}</span>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.badge}`}>
                              {st.label}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-[#1f1a24]">Total Amount: {formatINR(o.totalPaise)}</p>
                              <p className="text-xs text-[#6b6070] mt-0.5">Payment: {o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment (Razorpay)'}</p>
                            </div>
                            <div className="flex gap-2">
                              <Link
                                href={`/order/${o.id}`}
                                className="rounded-full bg-[#832729] px-5 py-2 text-xs uppercase font-semibold tracking-wider text-white hover:bg-black transition shadow-sm"
                              >
                                View Order &amp; Track →
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═════════ 3. TAB: PERSONAL INFORMATION & SECURITY ═════════ */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-up">
                <h2 className="font-serif text-2xl md:text-3xl text-[#1f1a24] font-medium">Personal Information</h2>

                <div className="rounded-xl border border-[#ecdcd5] bg-white p-6 shadow-sm">
                  <h3 className="font-serif text-xl mb-4 border-b border-[#f2e6e1] pb-3 text-[#832729] font-medium">Edit Profile</h3>
                  <form onSubmit={saveProfile} className="space-y-4 max-w-xl">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">First name</label>
                        <input value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-4 py-2.5 text-sm focus:border-[#832729] focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Last name</label>
                        <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-4 py-2.5 text-sm focus:border-[#832729] focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Email (Cannot be changed)</label>
                      <input value={user.email} disabled className="w-full rounded-lg border border-[#d6c7bf] bg-[#f5ede8] text-[#4a3f3b] px-4 py-2.5 text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Phone</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-4 py-2.5 text-sm focus:border-[#832729] focus:outline-none" />
                    </div>
                    <button type="submit" className="rounded-full bg-[#832729] px-7 py-2.5 text-xs uppercase font-semibold tracking-wider text-white hover:bg-black shadow">
                      Save Profile
                    </button>
                    {profileMsg && <p className="text-xs text-emerald-800 font-bold">{profileMsg}</p>}
                  </form>
                </div>

                {/* Change Password */}
                <div className="rounded-xl border border-[#ecdcd5] bg-white p-6 shadow-sm">
                  <h3 className="font-serif text-xl mb-4 border-b border-[#f2e6e1] pb-3 text-[#832729] font-medium">Change Password</h3>
                  <form onSubmit={savePassword} className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Current Password</label>
                      <input type="password" required value={curPw} onChange={e => setCurPw(e.target.value)} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-4 py-2.5 text-sm focus:border-[#832729] focus:outline-none" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">New Password (8+ chars)</label>
                        <input type="password" required minLength={8} value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-4 py-2.5 text-sm focus:border-[#832729] focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Confirm New Password</label>
                        <input type="password" required minLength={8} value={confPw} onChange={e => setConfPw(e.target.value)} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-4 py-2.5 text-sm focus:border-[#832729] focus:outline-none" />
                      </div>
                    </div>
                    {pwMsg.text && (
                      <p className={`text-xs font-bold ${pwMsg.error ? 'text-red-700' : 'text-emerald-800'}`}>{pwMsg.text}</p>
                    )}
                    <button type="submit" className="rounded-full bg-[#221c25] px-7 py-2.5 text-xs uppercase font-semibold tracking-wider text-white hover:bg-[#832729] shadow">
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ═════════ 4. TAB: ADDRESS BOOK ═════════ */}
            {activeTab === 'addresses' && (
              <div className="space-y-6 animate-up">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl md:text-3xl text-[#1f1a24] font-medium">Address Book</h2>
                  <button
                    onClick={() => setAddingAddr(!addingAddr)}
                    className="rounded-full bg-[#832729] px-5 py-2 text-xs uppercase font-semibold tracking-wider text-white hover:bg-black transition shadow"
                  >
                    {addingAddr ? 'Cancel' : '+ Add New Address'}
                  </button>
                </div>

                {addingAddr && (
                  <form onSubmit={addAddressSubmit} className="rounded-xl border border-[#ecdcd5] bg-white p-6 shadow-sm space-y-4">
                    <h3 className="font-serif text-lg text-[#832729] font-medium">New Address Details</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Label</label><input value={newAddr.label} onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm" placeholder="Home, Office" /></div>
                      <div><label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Recipient Name *</label><input required value={newAddr.recipientName} onChange={e => setNewAddr(p => ({ ...p, recipientName: e.target.value }))} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm" /></div>
                    </div>
                    <div><label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Address Line 1 *</label><input required value={newAddr.line1} onChange={e => setNewAddr(p => ({ ...p, line1: e.target.value }))} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm" /></div>
                    <div><label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Address Line 2</label><input value={newAddr.line2} onChange={e => setNewAddr(p => ({ ...p, line2: e.target.value }))} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm" /></div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div><label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">City *</label><input required value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm" /></div>
                      <div><label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">State *</label><input required value={newAddr.state} onChange={e => setNewAddr(p => ({ ...p, state: e.target.value }))} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm" /></div>
                      <div><label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Pincode *</label><input required pattern="\d{6}" maxLength={6} value={newAddr.pincode} onChange={e => setNewAddr(p => ({ ...p, pincode: e.target.value }))} className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm" /></div>
                    </div>
                    <div><label className="block text-xs uppercase font-medium text-[#6b6070] mb-1">Phone</label><input value={newAddr.phone} onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} type="tel" className="w-full rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-3 py-2 text-sm" /></div>
                    <button type="submit" className="rounded-full bg-[#832729] px-6 py-2.5 text-xs uppercase font-semibold tracking-wider text-white hover:bg-black shadow">
                      Save Address
                    </button>
                  </form>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {addrList.map((a) => (
                    <div key={a.id} className={`rounded-xl border p-5 bg-white shadow-sm flex flex-col justify-between ${a.isDefault ? 'border-[#832729] bg-[#fffaf7]' : 'border-[#ecdcd5]'}`}>
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-bold text-xs uppercase tracking-wider text-[#832729]">{a.label}</span>
                          {a.isDefault && <span className="rounded-full bg-[#832729] text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Default</span>}
                        </div>
                        <p className="font-bold text-base text-[#1f1a24]">{a.recipientName}</p>
                        <p className="text-sm text-[#4a3f3b] font-medium mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                        <p className="text-sm text-[#4a3f3b] font-medium">{a.city}, {a.state} {a.pincode}</p>
                        <p className="text-sm text-[#6b6070] mt-0.5">{a.country}{a.phone ? ` · 📞 ${a.phone}` : ''}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-4 border-t border-[#f2e6e1] pt-3 text-xs">
                        {!a.isDefault && (
                          <button onClick={() => setDefaultAddr(a.id)} className="font-semibold text-[#832729] hover:underline">
                            Set as default
                          </button>
                        )}
                        <button onClick={() => deleteAddr(a.id)} className="font-semibold text-rose-700 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═════════ 5. TAB: WISHLIST ═════════ */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6 animate-up">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl md:text-3xl text-[#1f1a24] font-medium">My Wishlist ({wishlist.length})</h2>
                  <Link href="/wishlist" className="text-xs uppercase font-semibold tracking-wider text-[#832729] hover:underline">
                    Open Wishlist Page →
                  </Link>
                </div>
                <div className="rounded-xl border border-[#ecdcd5] bg-white p-6 shadow-sm">
                  {wishlist.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-[#6b6070] font-medium">No items saved in wishlist yet.</p>
                      <Link href="/shop" className="mt-4 inline-block rounded-md bg-[#832729] px-6 py-2.5 text-xs uppercase font-semibold tracking-wider text-white shadow">
                        Explore Collection
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-[#2e2632] mb-4">You have {wishlist.length} item(s) saved in your account.</p>
                      <Link href="/wishlist" className="rounded-full bg-[#832729] px-6 py-2.5 text-xs uppercase font-semibold tracking-wider text-white hover:bg-black transition shadow">
                        View &amp; Move to Bag
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═════════ 6. TAB: SAVED PAYMENTS METHOD ═════════ */}
            {activeTab === 'payments' && (
              <div className="space-y-6 animate-up">
                <h2 className="font-serif text-2xl md:text-3xl text-[#1f1a24] font-medium">Saved Payments Method</h2>
                <div className="rounded-xl border border-[#ecdcd5] bg-white p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-[#832729]">UPI &amp; Card Preferences</h3>
                  <div className="rounded-lg border border-[#ecdcd5] p-4 flex items-center justify-between bg-[#fdfbf9]">
                    <div>
                      <p className="font-bold text-sm text-[#1f1a24]">UPI Autopay &amp; QR Payments</p>
                      <p className="text-xs text-[#6b6070] font-medium">Google Pay, PhonePe, Paytm, BHIM</p>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-1 rounded-full">
                      Ready at Checkout
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#ecdcd5] p-4 flex items-center justify-between bg-[#fdfbf9]">
                    <div>
                      <p className="font-bold text-sm text-[#1f1a24]">Cash on Delivery (COD)</p>
                      <p className="text-xs text-[#6b6070] font-medium">Enabled for all eligible pin codes</p>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-1 rounded-full">
                      Enabled
                    </span>
                  </div>
                  <p className="text-xs text-[#6b6070] font-medium pt-2">
                    🔒 All payment transactions are encrypted and processed securely via Razorpay certified PCI-DSS Level 1 gateway.
                  </p>
                </div>
              </div>
            )}

            {/* ═════════ 7. TAB: DIGITAL GOLD LOCKER ═════════ */}
            {activeTab === 'digital-gold' && (
              <div className="space-y-6 animate-up">
                <h2 className="font-serif text-2xl md:text-3xl text-[#1f1a24] font-medium">AurNya Digital Gold</h2>
                <div className="rounded-xl border border-[#e5c158] bg-gradient-to-br from-[#fffdf5] to-[#fcf5e5] p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#e5c158]/40 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#7a5712] font-bold">24K 99.9% Pure Gold Vault</p>
                      <p className="mt-1 font-serif text-3xl font-bold text-[#832729]">1.5000 Grams</p>
                    </div>
                    <span className="text-3xl">🪙</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-[#6b6070] font-medium">Estimated Current Value</span>
                    <span className="font-bold text-[#1f1a24] text-base">₹11,850</span>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <button className="rounded-full bg-[#832729] px-6 py-2.5 text-xs uppercase font-semibold tracking-wider text-white hover:bg-black shadow">
                      Buy More Gold
                    </button>
                    <button className="rounded-full border border-[#832729] px-6 py-2.5 text-xs uppercase font-semibold tracking-wider text-[#832729] hover:bg-[#832729] hover:text-white shadow-sm">
                      Redeem as Jewellery
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════ 8. TAB: GIFT CARD BALANCE ═════════ */}
            {activeTab === 'gift-card' && (
              <div className="space-y-6 animate-up">
                <h2 className="font-serif text-2xl md:text-3xl text-[#1f1a24] font-medium">Gift Card Balance</h2>
                <div className="rounded-xl border border-[#ecdcd5] bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#f2e6e1] pb-4">
                    <div>
                      <p className="text-xs uppercase text-[#6b6070] font-semibold tracking-wider">Available Balance</p>
                      <p className="font-serif text-3xl font-bold text-[#832729]">₹0.00</p>
                    </div>
                    <span className="text-2xl">🎁</span>
                  </div>
                  <div className="flex gap-2 max-w-md pt-2">
                    <input placeholder="Enter 16-digit gift card number" className="flex-1 rounded-lg border border-[#d6c7bf] bg-white text-[#1f1a24] px-4 py-2 text-sm focus:border-[#832729] focus:outline-none" />
                    <button className="rounded-lg bg-[#832729] px-5 py-2 text-xs uppercase font-semibold tracking-wider text-white shadow">
                      Check Balance
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════ 9. TAB: AURPASS VIP REWARDS ═════════ */}
            {activeTab === 'aurpass' && (
              <div className="space-y-6 animate-up">
                <h2 className="font-serif text-2xl md:text-3xl text-[#1f1a24] font-medium">AurPass VIP Member</h2>
                <div className="rounded-xl border border-[#4d1618] bg-gradient-to-br from-[#2b0c10] to-[#5a1a20] p-6 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#f5d78e] font-bold">AurNya Exclusive Circle</p>
                      <p className="font-serif text-2xl font-bold text-white mt-1">Gold Tier Member</p>
                    </div>
                    <span className="text-3xl">👑</span>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-4 text-xs">
                    <div>
                      <p className="text-white/80 font-medium">AurNya Coins Balance</p>
                      <p className="text-lg font-bold text-[#f5d78e] mt-0.5">{coins} Coins</p>
                    </div>
                    <div>
                      <p className="text-white/80 font-medium">Privilege Level</p>
                      <p className="text-lg font-bold text-white mt-0.5">Complimentary Express Shipping</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════ 10. TAB: RING SIZE GUIDE (High-Contrast, Visible Table) ═════════ */}
            {activeTab === 'ring-size' && (
              <div className="space-y-6 animate-up">
                <h2 className="font-serif text-2xl md:text-3xl text-[#1f1a24] font-medium">Ring Size Guide</h2>
                <div className="rounded-xl border border-[#ecdcd5] bg-white p-6 shadow-sm space-y-5">
                  <p className="text-sm font-medium text-[#4a3f3b] leading-relaxed">
                    Measure the inside diameter of a ring that fits you comfortably in millimeters (mm) to find your perfect Indian ring size.
                  </p>

                  <div className="overflow-hidden rounded-xl border border-[#ecdcd5] shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-[#fbf2ed] text-xs uppercase font-bold tracking-wider text-[#832729] border-b border-[#ecdcd5]">
                          <th className="py-3 px-4 text-[#832729]">India / Asia Size</th>
                          <th className="py-3 px-4 text-[#832729]">Inside Diameter (mm)</th>
                          <th className="py-3 px-4 text-[#832729]">Circumference (mm)</th>
                          <th className="py-3 px-4 text-[#832729]">US / Canada Size</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2e6e1] text-[#221c25]">
                        <tr className="bg-white hover:bg-[#fdf7f4] transition-colors"><td className="py-3 px-4 font-bold text-[#832729]">Size 6</td><td className="py-3 px-4 font-semibold text-[#221c25]">14.7 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">46.1 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">3.75</td></tr>
                        <tr className="bg-[#fcfbf9] hover:bg-[#fdf7f4] transition-colors"><td className="py-3 px-4 font-bold text-[#832729]">Size 7</td><td className="py-3 px-4 font-semibold text-[#221c25]">15.0 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">47.1 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">4.25</td></tr>
                        <tr className="bg-white hover:bg-[#fdf7f4] transition-colors"><td className="py-3 px-4 font-bold text-[#832729]">Size 8</td><td className="py-3 px-4 font-semibold text-[#221c25]">15.3 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">48.1 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">4.75</td></tr>
                        <tr className="bg-[#fcfbf9] hover:bg-[#fdf7f4] transition-colors"><td className="py-3 px-4 font-bold text-[#832729]">Size 9</td><td className="py-3 px-4 font-semibold text-[#221c25]">15.6 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">49.0 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">5.0</td></tr>
                        <tr className="bg-white hover:bg-[#fdf7f4] transition-colors"><td className="py-3 px-4 font-bold text-[#832729]">Size 10</td><td className="py-3 px-4 font-semibold text-[#221c25]">16.0 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">50.3 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">5.5</td></tr>
                        <tr className="bg-[#fcfbf9] hover:bg-[#fdf7f4] transition-colors"><td className="py-3 px-4 font-bold text-[#832729]">Size 11</td><td className="py-3 px-4 font-semibold text-[#221c25]">16.3 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">51.2 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">6.0</td></tr>
                        <tr className="bg-white hover:bg-[#fdf7f4] transition-colors"><td className="py-3 px-4 font-bold text-[#832729]">Size 12</td><td className="py-3 px-4 font-semibold text-[#221c25]">16.7 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">52.5 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">6.5</td></tr>
                        <tr className="bg-[#fcfbf9] hover:bg-[#fdf7f4] transition-colors"><td className="py-3 px-4 font-bold text-[#832729]">Size 14</td><td className="py-3 px-4 font-semibold text-[#221c25]">17.3 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">54.4 mm</td><td className="py-3 px-4 font-semibold text-[#221c25]">7.0</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
