'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { budgets, mainNav, site } from '@/config/site';
import { useShop } from '@/store/shop-context';
import { useAuth } from '@/store/auth-context';
import { SearchOverlay } from './search-overlay';
import { AuthModal } from './auth-modal';
import { useModal } from '@/lib/use-modal';
import { ThemeToggle } from './theme-toggle';
import { ThemeSwitch } from './theme-switch';
import { ShowcaseArt, type ArtKind } from './showcase-art';

const I = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const ib = 'relative grid h-10 w-10 place-items-center rounded-full hover:bg-charcoal/5';
const badge = 'absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-charcoal px-1 text-[10px] text-ivory';

export function Header() {
  const path = usePathname(); const { count, wishlist, openDrawer } = useShop();
  const { user } = useAuth();
  const [menuAt, setMenuAt] = useState<string | null>(null); const [search, setSearch] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const accountBtn = useRef<HTMLButtonElement>(null);
  // The menu counts as open only on the page it was opened on, so moving to another page closes it without any effect.
  const menu = menuAt === path;
  const menuBtn = useRef<HTMLButtonElement>(null); const closeBtn = useRef<HTMLButtonElement>(null); const menuPanel = useRef<HTMLElement>(null);
  const searchBtn = useRef<HTMLButtonElement>(null);
  const closeMenu = () => setMenuAt(null);
  useModal(menu, menuPanel, closeMenu, closeBtn, menuBtn);
  const links = (kind: 'categories' | 'collections') => (kind === 'categories' ? site.categories.map((c) => ({ n: c, h: `/category/${c.toLowerCase()}`, art: c as ArtKind, blurb: '' })) : site.collections.map((c) => ({ n: c.name, h: `/collection/${c.slug}`, art: (c.slug === 'gifts' ? 'Gift' : c.slug === 'statement' ? 'Necklaces' : 'Earrings') as ArtKind, blurb: c.blurb })));
  const eyebrow = 'mb-3 text-xs uppercase tracking-[.16em] text-muted';
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:px-6 md:gap-6">
          <button ref={menuBtn} type="button" aria-label="Open menu" aria-controls="mobile-nav" aria-expanded={menu} onClick={() => setMenuAt(path)} className={`${ib} xl:hidden`}><I d="M4 7h16M4 12h16M4 17h16" /></button>
          <Link href="/" aria-label="AurNya home" className="flex shrink-0 items-center gap-2"><Image src="/images/logo.png" alt="" width={44} height={44} priority className="h-9 w-9 rounded-full sm:h-11 sm:w-11" /><span className="font-serif text-2xl sm:text-3xl">AurNya</span></Link>
          {/* One search button: a plain icon on phones, a wide search bar from tablet size up. Either way it opens the search panel. */}
          <button ref={searchBtn} type="button" aria-label="Search rings, earrings, necklaces" onClick={() => setSearch(true)} className={`${ib} ml-auto md:ml-6 md:flex md:h-11 md:w-auto md:max-w-xl md:flex-1 md:items-center md:justify-start md:gap-3 md:rounded-full md:border md:border-charcoal/20 md:bg-surface md:px-5 md:hover:border-charcoal/50 md:hover:bg-surface`}><I d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4-4" /><span className="hidden truncate text-sm text-muted md:inline">Search rings, earrings, necklaces</span></button>
          <div className="flex items-center md:ml-auto">
            <Link href="/wishlist" aria-label="Wishlist" className={ib}><I d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" />{wishlist.length > 0 && <span className={badge}>{wishlist.length}</span>}</Link>
            <ThemeToggle className={`${ib} hidden sm:grid`} />
            {user ? (
              <Link href="/account" aria-label="My account" className={`${ib} hidden sm:grid`}><I d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c1-4 4-6 8-6s7 2 8 6" /></Link>
            ) : (
              <button ref={accountBtn} type="button" aria-label="Sign in to account" onClick={() => setAuthOpen(true)} className={`${ib} hidden sm:grid`}><I d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c1-4 4-6 8-6s7 2 8 6" /></button>
            )}
            <button type="button" aria-label={`Shopping bag, ${count} items`} onClick={openDrawer} className={ib}><I d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0" />{count > 0 && <span className={badge}>{count}</span>}</button>
          </div>
        </div>
        {/* Second row (large screens): the main menu, with picture menus for Categories and Collections. */}
        <nav aria-label="Main" className="hidden border-t border-charcoal/10 xl:block"><ul className="mx-auto flex max-w-7xl justify-center gap-9 px-6">{mainNav.map((n) => (
          <li key={n.label} className="group"><Link href={n.href} className="block py-3.5 text-[12px] uppercase tracking-[.14em] hover:text-gold-ink">{n.label}</Link>
            {n.mega && (<div className="invisible absolute inset-x-0 top-full border-b border-charcoal/10 bg-ivory opacity-0 shadow-xl shadow-shade/10 transition duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"><div className="mx-auto grid max-w-7xl grid-cols-[2.2fr_1fr_1fr] gap-10 px-6 py-8">
              <div><p className={eyebrow}>{n.mega === 'categories' ? 'Shop by category' : 'Collections'}</p>
                <div className={`grid gap-4 ${n.mega === 'categories' ? 'grid-cols-4' : 'grid-cols-3'}`}>{links(n.mega).map((l) => (
                  <Link key={l.h} href={l.h} className="group/tile block text-center"><span className="grid aspect-[5/4] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-cream to-sage transition duration-300 group-hover/tile:shadow-lg"><ShowcaseArt kind={l.art} uid={`mm-${n.mega}-${l.n.replace(/\W/g, '')}`} className="h-4/5 transition duration-500 group-hover/tile:scale-105" /></span><span className="mt-2 block font-serif text-lg group-hover/tile:text-gold-ink">{l.n}</span>{l.blurb && <span className="block text-xs text-muted">{l.blurb}</span>}</Link>))}</div></div>
              <div><p className={eyebrow}>Shop by budget</p>{budgets.map((b) => <Link key={b.price} href={`/shop?price=${b.price}`} className="block py-1.5 hover:text-gold-ink">{b.label}</Link>)}</div>
              <div><p className={eyebrow}>Discover</p><Link href="/shop?tag=new" className="block py-1.5 hover:text-gold-ink">New Arrivals</Link><Link href="/shop?tag=bestseller" className="block py-1.5 hover:text-gold-ink">Bestsellers</Link><Link href="/collection/gifts" className="block py-1.5 hover:text-gold-ink">Gifts</Link>
                <Image src="/images/packaging.jpg" alt="AurNya gift box, pouch and care cards" width={600} height={400} className="mt-3 h-24 w-full rounded-xl object-cover" /></div></div></div>)}</li>))}</ul></nav>
      </header>
      <div onClick={() => setMenuAt(null)} aria-hidden="true" className={`fixed inset-0 z-[55] bg-scrim/40 transition-opacity ${menu ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside ref={menuPanel} id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!menu} className={`fixed inset-y-0 left-0 z-[60] w-[min(88vw,360px)] overflow-auto bg-ivory p-6 transition-transform duration-300 ${menu ? '' : 'invisible -translate-x-full'}`}>
        <div className="flex items-center justify-between font-serif text-3xl">AurNya<button ref={closeBtn} type="button" aria-label="Close menu" onClick={() => setMenuAt(null)} className="h-10 w-10 text-2xl">×</button></div>
        <ul className="my-5">
          {mainNav.filter((n) => !n.mega).map((n) => <li key={n.label}><Link href={n.href} onClick={closeMenu} className="block border-b border-charcoal/10 py-3 font-serif text-2xl">{n.label}</Link></li>)}
          <li>
            {user ? (
              <Link href="/account" onClick={closeMenu} className="block border-b border-charcoal/10 py-3 font-serif text-2xl">My Account ({user.firstName || 'Profile'})</Link>
            ) : (
              <button type="button" onClick={() => { closeMenu(); setAuthOpen(true); }} className="block w-full border-b border-charcoal/10 py-3 text-left font-serif text-2xl">Sign In / Register</button>
            )}
          </li>
        </ul>
        {(['categories', 'collections'] as const).map((k) => (<div key={k} className="mb-4"><p className="mb-2 text-xs uppercase tracking-[.16em] text-muted">{k}</p>{links(k).map((l) => <Link key={l.h} href={l.h} className="block py-1.5">{l.n}</Link>)}</div>))}
        <div className="mb-4"><p className="mb-2 text-xs uppercase tracking-[.16em] text-muted">Shop by budget</p>{budgets.map((b) => <Link key={b.price} href={`/shop?price=${b.price}`} className="block py-1.5">{b.label}</Link>)}</div>
        <div className="mt-6 border-t border-charcoal/10 pt-5"><p className="mb-2 text-xs uppercase tracking-[.16em] text-muted">Appearance</p><ThemeSwitch /></div>
      </aside>
      <SearchOverlay open={search} onClose={() => setSearch(false)} restore={searchBtn} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} restore={accountBtn} />
    </>
  );
}
