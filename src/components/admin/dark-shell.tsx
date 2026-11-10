'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NOTICE_EVENT, type NoticeTone } from '@/lib/notify';
import type { UserRole } from '@/lib/role-auth';
import {
  DiamondLogoIcon, HomeIcon, BoxIcon, UsersIcon,
  CreditCardIcon, BarChartIcon, MegaphoneIcon, TagIcon,
  LayoutDashboardIcon, GlobeIcon, ShieldUserIcon, SettingsIcon,
  BellIcon, HelpCircleIcon, SearchIcon,
} from './icons';

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  badge?: 'orders' | 'stock' | 'approvals';
  children?: NavChild[];
};

function getNavItems(role: UserRole): NavItem[] {
  if (role === 'manager') {
    // Floor & fulfilment manager: Only Orders, Catalogue, and Stock
    return [
      { href: `/${role}`, label: 'Dashboard', icon: <HomeIcon className="w-4 h-4" />, exact: true },
      { href: `/${role}/orders`, label: 'Orders', icon: <BoxIcon className="w-4 h-4" />, badge: 'orders' },
      { href: `/${role}/products`, label: 'Products Catalogue', icon: <BoxIcon className="w-4 h-4" /> },
      { href: `/${role}/inventory`, label: 'Stock & Inventory', icon: <LayoutDashboardIcon className="w-4 h-4" />, badge: 'stock' },
      { href: `/${role}/approvals`, label: 'My Requests', icon: <BellIcon className="w-4 h-4" />, badge: 'approvals' },
    ];
  }

  if (role === 'admin') {
    // Admin: Full store operations, but NO User Management, Payments, or Legal Settings
    return [
      { href: `/${role}`, label: 'Dashboard', icon: <HomeIcon className="w-4 h-4" />, exact: true },
      { href: `/${role}/orders`, label: 'Orders', icon: <BoxIcon className="w-4 h-4" />, badge: 'orders' },
      {
        href: `/${role}/products`,
        label: 'Products',
        icon: <BoxIcon className="w-4 h-4" />,
        children: [
          { href: `/${role}/products`, label: 'All Products' },
          { href: `/${role}/products/new`, label: 'Add Product' },
          { href: `/${role}/categories`, label: 'Categories' },
          { href: `/${role}/collections`, label: 'Collections' },
          { href: `/${role}/inventory`, label: 'Variants & Inventory' },
        ],
      },
      { href: `/${role}/inventory`, label: 'Inventory', icon: <LayoutDashboardIcon className="w-4 h-4" />, badge: 'stock' },
      { href: `/${role}/customers`, label: 'Customers', icon: <UsersIcon className="w-4 h-4" /> },
      { href: `/${role}/analytics`, label: 'Analytics & Reports', icon: <BarChartIcon className="w-4 h-4" /> },
      { href: `/${role}/marketing`, label: 'Marketing', icon: <MegaphoneIcon className="w-4 h-4" /> },
      { href: `/${role}/coupons`, label: 'Coupons & Offers', icon: <TagIcon className="w-4 h-4" /> },
      { href: `/${role}/content`, label: 'Content Management', icon: <LayoutDashboardIcon className="w-4 h-4" /> },
      { href: `/${role}/banners`, label: 'Website Control', icon: <GlobeIcon className="w-4 h-4" /> },
      { href: `/${role}/approvals`, label: 'My Requests', icon: <BellIcon className="w-4 h-4" />, badge: 'approvals' },
      { href: `/${role}/activity`, label: 'Activity Log', icon: <ShieldUserIcon className="w-4 h-4" /> },
    ];
  }

  // Owner: 100% unrestricted access to everything
  return [
    { href: `/${role}`, label: 'Dashboard', icon: <HomeIcon className="w-4 h-4" />, exact: true },
    { href: `/${role}/orders`, label: 'Orders', icon: <BoxIcon className="w-4 h-4" />, badge: 'orders' },
    {
      href: `/${role}/products`,
      label: 'Products',
      icon: <BoxIcon className="w-4 h-4" />,
      children: [
        { href: `/${role}/products`, label: 'All Products' },
        { href: `/${role}/products/new`, label: 'Add Product' },
        { href: `/${role}/categories`, label: 'Categories' },
        { href: `/${role}/collections`, label: 'Collections' },
        { href: `/${role}/inventory`, label: 'Variants & Inventory' },
      ],
    },
    { href: `/${role}/inventory`, label: 'Inventory', icon: <LayoutDashboardIcon className="w-4 h-4" />, badge: 'stock' },
    { href: `/${role}/customers`, label: 'Customers', icon: <UsersIcon className="w-4 h-4" /> },
    { href: `/${role}/payments`, label: 'Payments & Payouts', icon: <CreditCardIcon className="w-4 h-4" /> },
    { href: `/${role}/analytics`, label: 'Analytics & Reports', icon: <BarChartIcon className="w-4 h-4" /> },
    { href: `/${role}/marketing`, label: 'Marketing', icon: <MegaphoneIcon className="w-4 h-4" /> },
    { href: `/${role}/coupons`, label: 'Coupons & Offers', icon: <TagIcon className="w-4 h-4" /> },
    { href: `/${role}/content`, label: 'Content Management', icon: <LayoutDashboardIcon className="w-4 h-4" /> },
    { href: `/${role}/banners`, label: 'Website Control', icon: <GlobeIcon className="w-4 h-4" /> },
    { href: `/${role}/approvals`, label: 'Approvals', icon: <BellIcon className="w-4 h-4" />, badge: 'approvals' },
    { href: `/${role}/whatsapp`, label: 'WhatsApp Updates', icon: <MegaphoneIcon className="w-4 h-4" /> },
    { href: `/${role}/activity`, label: 'Activity Log', icon: <ShieldUserIcon className="w-4 h-4" /> },
    { href: `/${role}/users`, label: 'Users & Access', icon: <ShieldUserIcon className="w-4 h-4" /> },
    { href: `/${role}/settings`, label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];
}

interface DarkShellProps {
  email: string;
  role: UserRole;
  todo?: number;
  lowStock?: number;
  isDemo?: boolean;
  children: React.ReactNode;
}

type Feed = {
  id: string; by: string; byRole: string; section: string; summary: string; status: 'pending' | 'approved' | 'rejected' | 'failed';
  decidedBy: string | null; decisionNote: string | null; resultMessage: string | null; createdAt: string; decidedAt: string | null;
};
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};
const POLL_MS = 4000;

export function DarkShell({ email, role, todo = 0, lowStock = 0, children }: DarkShellProps) {
  const path = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [`/${role}/products`]: true });

  // Top Bar Interactive States
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // ---- Live approvals feed (owner: requests waiting; admin/manager: what happened to their requests) ----
  const [feed, setFeed] = useState<Feed[]>([]);
  const [pending, setPending] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popups, setPopups] = useState<Feed[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);
  const seen = useRef<Map<string, string> | null>(null);   // id -> status already shown
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((message: string, tone: NoticeTone = 'ok') => {
    setNotice({ message, tone });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), tone === 'pending' ? 6000 : 4000);
  }, []);

  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent<{ message: string; tone: NoticeTone }>).detail; if (d) showNotice(d.message, d.tone); };
    window.addEventListener(NOTICE_EVENT, h);
    return () => window.removeEventListener(NOTICE_EVENT, h);
  }, [showNotice]);

  // Ctrl+K (or Cmd+K) jumps to the search box
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setNotificationsOpen(false); setUserMenuOpen(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const refreshFeed = useCallback(async () => {
    try {
      const r = await fetch('/api/approvals', { cache: 'no-store' });
      if (r.status === 401) { window.location.assign(`/${role}/login`); return; }
      if (!r.ok) return;
      const d = (await r.json()) as { pending: number; items: Feed[] };
      setFeed(d.items); setPending(d.pending);
      // Bell badge: owner = requests waiting; staff = their waiting requests plus anything decided in the last 24 hours.
      setUnreadCount(role === 'owner' ? d.pending : d.pending + d.items.filter((f) => f.status !== 'pending' && f.decidedAt && Date.now() - new Date(f.decidedAt).getTime() < 24 * 3600 * 1000).length);
      const prev = seen.current;
      const next = new Map(d.items.map((i) => [i.id, i.status] as const));
      if (prev) {
        const fresh: Feed[] = [];
        for (const i of d.items) {
          const before = prev.get(i.id);
          if (role === 'owner' && i.status === 'pending' && before !== 'pending') fresh.push(i);          // a new request for the owner
          if (role !== 'owner' && before === 'pending' && i.status !== 'pending') fresh.push(i);           // the owner decided on my request
        }
        if (fresh.length) setPopups((p) => [...fresh, ...p].slice(0, 4));
      }
      seen.current = next;
    } catch { /* offline: try again on the next tick */ }
  }, [role]);

  useEffect(() => {
    let alive = true;
    const tick = () => { if (alive && document.visibilityState === 'visible') void refreshFeed(); };
    tick();
    const t = setInterval(tick, POLL_MS);
    const vis = () => tick();
    document.addEventListener('visibilitychange', vis);
    return () => { alive = false; clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [refreshFeed]);

  async function decide(id: string, decision: 'approve' | 'reject' | 'retry') {
    setBusyId(id);
    try {
      const r = await fetch(`/api/approvals/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision }) });
      const d = (await r.json().catch(() => ({}))) as { error?: string; message?: string; status?: string };
      if (decision === 'reject' && r.ok) showNotice('Change rejected. Nothing was changed.', 'ok');
      else if (r.ok) showNotice(d.message ? `Approved and applied. ${d.message}` : 'Approved and applied.', 'ok');
      else showNotice(d.error ?? 'Could not apply that change.', 'error');
      setPopups((p) => p.filter((x) => x.id !== id));
      await refreshFeed();
      router.refresh();
    } finally { setBusyId(null); }
  }

  const items = getNavItems(role);

  async function signOut() {
    await fetch(`/api/${role}/auth/logout`, { method: 'POST' });
    router.replace(`/${role}/login`);
    router.refresh();
  }

  const roleTitle = role === 'owner' ? 'ADMIN (OWNER)' : role.toUpperCase();
  const displayName = email.includes('owner') ? 'Sartha Kumar' : email.includes('admin') ? 'Store Admin' : 'Store Manager';

  // Search Results
  const allSearchRoutes = items.flatMap((it) => (it.children ? it.children : [{ href: it.href, label: it.label }]));
  const searchResults = searchQuery.trim()
    ? allSearchRoutes.filter((r) => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0D0B11] text-[#E5E1EC] font-sans antialiased z-30 flex flex-col" data-theme="dark">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between border-b border-white/10 bg-[#15121B] px-4 py-3 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2.5">
          <DiamondLogoIcon className="w-6 h-6 text-[#D4A843]" />
          <div>
            <span className="font-serif text-lg font-bold text-white tracking-wide">AurNya</span>
            <span className="ml-2 text-[10px] text-[#D4A843] tracking-widest">{roleTitle}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white"
        >
          {sidebarOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#14121A] border-r border-white/5 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 lg:static lg:h-full lg:shrink-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col flex-1 min-h-0">
            {/* Logo */}
            <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5">
              <DiamondLogoIcon className="w-7 h-7 text-[#D4A843]" />
              <div>
                <div className="font-serif text-xl font-bold tracking-wider text-white">AurNya</div>
                <div className="text-[10px] font-semibold tracking-widest text-[#D4A843]">{roleTitle}</div>
              </div>
            </div>

            {/* Nav list */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {items.map((item) => {
                const active = item.exact ? path === item.href : path === item.href || (item.children ? path.startsWith(`${item.href}/`) : false);
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expanded[item.href];

                return (
                  <div key={item.href} className="space-y-0.5">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => setExpanded((prev) => ({ ...prev, [item.href]: !prev[item.href] }))}
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                          active
                            ? 'text-white'
                            : 'text-[#9A91A5] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={active ? 'text-[#D4A843]' : 'text-[#877E94]'}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span className={`text-[10px] text-[#787085] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          ▾
                        </span>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                          active
                            ? 'bg-[#8F6A33]/80 text-white shadow-lg shadow-[#8F6A33]/20 font-semibold'
                            : 'text-[#9A91A5] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={active ? 'text-white' : 'text-[#877E94]'}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge === 'approvals' && pending > 0 && (
                          <span className="rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{pending}</span>
                        )}
                        {item.badge === 'orders' && todo > 0 && (
                          <span className="rounded-md bg-[#D4A843] px-1.5 py-0.5 text-[10px] font-bold text-[#14121A]">
                            {todo}
                          </span>
                        )}
                        {item.badge === 'stock' && lowStock > 0 && (
                          <span className="rounded-md bg-red-500/20 text-red-300 px-1.5 py-0.5 text-[10px] font-bold">
                            {lowStock}
                          </span>
                        )}
                      </Link>
                    )}

                    {/* Submenu */}
                    {hasChildren && isExpanded && (
                      <div className="ml-9 pl-2 border-l border-white/5 space-y-0.5 py-1">
                        {item.children!.map((child) => {
                          const childActive = path === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`block rounded-lg px-3 py-1.5 text-[11px] transition-colors ${
                                childActive
                                  ? 'text-[#D4A843] font-semibold'
                                  : 'text-[#7D758B] hover:text-[#D1CADB]'
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Footer of Sidebar */}
          <div className="p-4 border-t border-white/5 space-y-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#D4A843]/40 bg-[#D4A843]/5 px-3 py-2 text-xs font-semibold text-[#D4A843] hover:bg-[#D4A843]/15 transition-colors"
            >
              <span>🛒</span>
              <span>View Store ↗</span>
            </Link>
            <div className="flex items-center justify-between text-[11px] text-[#696175] px-1">
              <span>AurNya Admin v2.0</span>
              <button
                type="button"
                onClick={signOut}
                className="hover:text-red-400 transition-colors"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto bg-[#0D0B11]">
          {/* Top Bar matching screenshot */}
          <header className="sticky top-0 z-20 shrink-0 flex items-center justify-between border-b border-white/5 bg-[#14121A]/90 px-6 py-3.5 backdrop-blur-md">
            {/* Search Input with live search tray */}
            <div className="relative flex-1 max-w-md">
              <div className="flex items-center rounded-xl border border-white/10 bg-[#1B1823] px-3.5 py-2 text-xs text-[#8A8197] focus-within:border-[#D4A843]/50 focus-within:text-white transition-all">
                <SearchIcon className="w-4 h-4 text-[#7A7285] mr-2 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search orders, products, customers, etc..."
                  className="w-full bg-transparent text-white placeholder-[#686074] outline-none text-xs"
                />
                <kbd className="ml-2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-[#8A8197]">
                  Ctrl + K
                </kbd>
              </div>

              {/* Quick Search Dropdown */}
              {searchOpen && searchQuery.trim() && (
                <div className="absolute left-0 mt-2 w-full rounded-xl border border-white/10 bg-[#181521] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] uppercase font-semibold text-[#736B7F] px-3 py-1.5 border-b border-white/5">
                    Matching Dashboard Sections
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((res) => (
                        <Link
                          key={res.href}
                          href={res.href}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between px-3 py-2 text-xs rounded-lg text-[#C7C0D2] hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <span>{res.label}</span>
                          <span className="text-[10px] text-[#D4A843] font-mono">{res.href}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-xs text-[#7E768B] text-center">
                      No matching pages found for &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Icons & User Profile */}
            <div className="flex items-center gap-3 ml-4">
              {/* Notification Bell with interactive tray */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setHelpOpen(false);
                    setUserMenuOpen(false);
                  }}
                  className={`relative rounded-full p-2 transition-colors ${
                    notificationsOpen ? 'bg-white/10 text-white' : 'text-[#9A91A5] hover:text-white hover:bg-white/5'
                  }`}
                  aria-label="Notifications"
                >
                  <BellIcon className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-md shadow-red-500/50">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Tray: real approval requests */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#181521] p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-white">{role === 'owner' ? 'Approvals' : 'My requests'}</span>
                        {pending > 0 && (
                          <span className="rounded-full bg-red-500/20 text-red-400 text-[10px] font-semibold px-2 py-0.5">
                            {pending} waiting
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                      {feed.length === 0 && (
                        <p className="py-6 text-center text-[11px] text-[#8E869B]">
                          {role === 'owner' ? 'Nothing waiting. When an admin or manager changes something, it appears here instantly.' : 'You have not sent any changes yet.'}
                        </p>
                      )}
                      {feed.slice(0, 8).map((n) => (
                        <div key={n.id} className="py-2.5 px-2">
                          <div className="flex items-start gap-2.5">
                            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.status === 'pending' ? 'bg-[#D4A843]' : n.status === 'approved' ? 'bg-[#4ADE80]' : 'bg-red-400'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-white">{n.summary}</div>
                              <p className="text-[11px] text-[#A59CB0] mt-0.5">
                                {n.section} · {role === 'owner' ? n.by : 'you'} · {ago(n.createdAt)} ·{' '}
                                <span className={n.status === 'pending' ? 'text-[#E5B558]' : n.status === 'approved' ? 'text-[#4ADE80]' : 'text-red-400'}>
                                  {n.status === 'pending' ? 'waiting for the owner' : n.status === 'approved' ? 'approved' : n.status === 'rejected' ? 'rejected' : 'could not be applied'}
                                </span>
                              </p>
                              {role === 'owner' && n.status === 'pending' && (
                                <div className="mt-2 flex gap-2">
                                  <button type="button" disabled={busyId === n.id} onClick={() => decide(n.id, 'approve')} className="rounded-lg bg-[#D4A843] px-3 py-1 text-[11px] font-bold text-[#14121A] disabled:opacity-50">Approve</button>
                                  <button type="button" disabled={busyId === n.id} onClick={() => decide(n.id, 'reject')} className="rounded-lg border border-white/10 px-3 py-1 text-[11px] text-[#C7C0D2] hover:bg-white/5 disabled:opacity-50">Reject</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-white/5 text-center">
                      <Link
                        href={`/${role}/approvals`}
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[11px] text-[#D4A843] hover:underline font-semibold"
                      >
                        {role === 'owner' ? 'Open all approvals →' : 'See all my requests →'}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Help Circle with interactive Quick Support Modal */}
              <button
                type="button"
                onClick={() => {
                  setHelpOpen(true);
                  setNotificationsOpen(false);
                  setUserMenuOpen(false);
                }}
                className={`rounded-full p-2 transition-colors ${
                  helpOpen ? 'bg-white/10 text-white' : 'text-[#9A91A5] hover:text-white hover:bg-white/5'
                }`}
                aria-label="Help and Documentation"
              >
                <HelpCircleIcon className="w-5 h-5" />
              </button>

              {/* User Avatar with Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotificationsOpen(false);
                    setHelpOpen(false);
                  }}
                  className="flex items-center gap-3 pl-2 border-l border-white/10 hover:opacity-90 transition-opacity"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E5B558] text-sm font-bold text-[#14121A] ring-2 ring-[#E5B558]/30">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-white leading-tight">{displayName}</div>
                    <div className="text-[10px] text-[#8A8197] capitalize">{role}</div>
                  </div>
                </button>

                {/* User Menu Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#181521] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <div className="font-semibold text-xs text-white">{displayName}</div>
                      <div className="text-[11px] text-[#8E869B] truncate">{email}</div>
                      <span className="inline-block mt-1 text-[9px] uppercase font-bold text-[#D4A843] bg-[#D4A843]/10 px-2 py-0.5 rounded-full">
                        {roleTitle}
                      </span>
                    </div>

                    <Link
                      href={`/${role}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-3 py-2 text-xs rounded-xl text-[#C7C0D2] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Dashboard Home
                    </Link>

                    {role === 'owner' && (
                      <Link
                        href="/owner/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-3 py-2 text-xs rounded-xl text-[#C7C0D2] hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Store Settings
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={signOut}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-medium mt-1 border-t border-white/5"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Quick Help Modal */}
          {helpOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#181521] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4A843]/10 text-[#D4A843] font-bold text-sm">
                      ?
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-base text-white">AurNya Admin Guide &amp; Support</h3>
                      <p className="text-[11px] text-[#8E869B]">Operational reference for {roleTitle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(false)}
                    className="text-[#8E869B] hover:text-white text-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Role Guide Box */}
                  <div className="rounded-xl border border-white/5 bg-[#121018] p-3.5 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-[#D4A843]">Current Access Level ({role.toUpperCase()})</div>
                    <p className="text-[#C7C0D2] leading-relaxed">
                      {role === 'owner' && 'As Store Owner, you have full 100% control over payments, bank settlements, user account creations, and legal GST settings.'}
                      {role === 'admin' && 'As Store Admin, you manage the jewellery catalogue, stock inventory, customer orders, coupons, marketing campaigns, and website banners.'}
                      {role === 'manager' && 'As Store Manager, your dashboard focuses on order packing, fulfillment tracking, and real-time stock counts.'}
                    </p>
                  </div>

                  {/* Common Procedures */}
                  <div className="space-y-2">
                    <div className="font-semibold text-white text-xs">Frequently Asked Workflows</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-xl border border-white/5 bg-[#121018] p-3">
                        <div className="font-bold text-white mb-0.5">📦 Processing Orders</div>
                        <p className="text-[#8E869B]">Go to Orders, click &quot;View&quot; on any order, and update status to &quot;Delivered&quot; or &quot;Processing&quot;.</p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-[#121018] p-3">
                        <div className="font-bold text-white mb-0.5">💍 Adding Stock Variants</div>
                        <p className="text-[#8E869B]">Use Add Product &gt; toggle &quot;This product comes in sizes&quot; to specify option counts per ring size.</p>
                      </div>
                    </div>
                  </div>

                  {/* Helpline */}
                  <div className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/5 p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#E5B558]">AurNya Concierge Tech Desk</div>
                      <div className="text-[11px] text-[#C7C0D2]">concierge@aurnya.com · +91 98200 12345</div>
                    </div>
                    <span className="text-[10px] font-semibold text-[#4ADE80] bg-[#153424] px-2 py-1 rounded-full">
                      Live Support
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setHelpOpen(false)}
                    className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-5 py-2 shadow-md shadow-[#D4A843]/10"
                  >
                    Got It
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instant pop-ups: new requests for the owner / decisions for admin and manager */}
          <div className="fixed right-4 top-16 z-[60] w-[22rem] max-w-[calc(100vw-2rem)] space-y-3">
            {popups.map((p) => (
              <div key={p.id} role="alert" className="rounded-2xl border border-[#D4A843]/40 bg-[#1D1926] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#D4A843]">
                    {role === 'owner' ? `Approval needed · ${p.section}` : p.status === 'approved' ? 'Approved by the owner' : p.status === 'rejected' ? 'Rejected by the owner' : 'Could not be applied'}
                  </div>
                  <button type="button" aria-label="Dismiss" onClick={() => setPopups((x) => x.filter((y) => y.id !== p.id))} className="text-[#8E869B] hover:text-white text-sm leading-none">✕</button>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-white">{p.summary}</p>
                <p className="mt-0.5 text-[11px] text-[#A59CB0]">{role === 'owner' ? `Requested by ${p.by} (${p.byRole})` : p.resultMessage || p.decisionNote || ''}</p>
                {role === 'owner' && (
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={busyId === p.id} onClick={() => decide(p.id, 'approve')} className="flex-1 rounded-xl bg-[#D4A843] py-1.5 text-xs font-bold text-[#14121A] disabled:opacity-50">{busyId === p.id ? 'Applying…' : 'Approve'}</button>
                    <button type="button" disabled={busyId === p.id} onClick={() => decide(p.id, 'reject')} className="flex-1 rounded-xl border border-white/10 py-1.5 text-xs text-[#C7C0D2] hover:bg-white/5 disabled:opacity-50">Reject</button>
                    <Link href="/owner/approvals" onClick={() => setPopups((x) => x.filter((y) => y.id !== p.id))} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-[#C7C0D2] hover:bg-white/5">Details</Link>
                  </div>
                )}
              </div>
            ))}
          </div>
          {notice && (
            <div role="status" aria-live="polite" className={`fixed bottom-6 right-6 z-[70] max-w-sm rounded-xl border px-4 py-3 text-xs font-semibold text-white shadow-2xl ${notice.tone === 'error' ? 'border-red-500/40 bg-[#2A1519]' : 'border-[#D4A843]/40 bg-[#1D1926]'}`}>
              <span className={notice.tone === 'error' ? 'text-red-400' : notice.tone === 'pending' ? 'text-[#E5B558]' : 'text-[#4ADE80]'}>{notice.tone === 'error' ? '✕' : notice.tone === 'pending' ? '⏳' : '✓'}</span> {notice.message}
            </div>
          )}

          {/* Page Body */}
          <main className="flex-1 p-6 space-y-6 pb-20">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
