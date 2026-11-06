'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from './api';

const items = [
  { href: '/admin', label: 'Dashboard', exact: true }, { href: '/admin/orders', label: 'Orders', badge: 'orders' as const }, { href: '/admin/products', label: 'Products' },
  { href: '/admin/inventory', label: 'Inventory', badge: 'stock' as const }, { href: '/admin/coupons', label: 'Coupons' }, { href: '/admin/banners', label: 'Banners & announcement' }, { href: '/admin/activity', label: 'Activity log' },
];

export function AdminShell({ email, todo, lowStock, children }: { email: string; todo: number; lowStock: number; children: React.ReactNode }) {
  const path = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false);
  const badge = (b?: 'orders' | 'stock') => { const n = b === 'orders' ? todo : b === 'stock' ? lowStock : 0; return n > 0 ? <span className="ml-auto rounded-full bg-charcoal px-2 py-0.5 text-[10px] text-ivory">{n}</span> : null; };
  const nav = (
    <nav aria-label="Admin" className="space-y-1">
      {items.map((i) => { const on = i.exact ? path === i.href : path === i.href || path.startsWith(`${i.href}/`);
        return <Link key={i.href} href={i.href} onClick={() => setOpen(false)} aria-current={on ? 'page' : undefined} className={`flex items-center rounded-xl px-3 py-2.5 text-sm ${on ? 'bg-charcoal text-ivory' : 'hover:bg-charcoal/5'}`}>{i.label}{badge(i.badge)}</Link>; })}
    </nav>
  );
  async function signOut() { await adminFetch('/api/admin/auth/logout', 'POST'); router.replace('/admin/login'); router.refresh(); }
  return (
    <div className="min-h-screen bg-cream/40 lg:grid lg:grid-cols-[250px_1fr]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-charcoal/10 bg-ivory px-4 py-3 lg:hidden print:hidden">
        <span className="font-serif text-2xl">AurNya admin</span>
        <button type="button" aria-expanded={open} aria-controls="admin-menu" onClick={() => setOpen((o) => !o)} className="rounded-full border border-charcoal/30 px-4 py-1.5 text-xs uppercase tracking-widest">{open ? 'Close' : 'Menu'}</button>
      </header>
      <aside id="admin-menu" className={`${open ? 'block' : 'hidden'} border-b border-charcoal/10 bg-ivory p-4 lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-auto lg:border-b-0 lg:border-r print:hidden`}>
        <p className="mb-6 hidden font-serif text-3xl lg:block">AurNya <span className="block text-xs font-sans uppercase tracking-[.2em] text-gold-ink">Admin</span></p>
        {nav}
        <div className="mt-6 space-y-2 border-t border-charcoal/10 pt-4 text-sm">
          <Link href="/" target="_blank" className="block rounded-xl px-3 py-2 hover:bg-charcoal/5">View the shop ↗</Link>
          <button type="button" onClick={signOut} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-charcoal/5">Sign out</button>
          <p className="truncate px-3 text-xs text-muted" title={email}>{email}</p>
        </div>
      </aside>
      <main id="admin-main" className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
