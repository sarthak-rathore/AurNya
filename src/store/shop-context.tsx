'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CartLine } from '@/lib/types';
import { MAX_QTY } from '@/lib/cart';
import { useAuth } from './auth-context';

interface ShopCtx {
  lines: CartLine[]; count: number; coupon: string; setCoupon: (c: string) => void;
  add: (l: CartLine) => void; replaceLines: (l: CartLine[]) => void; setQty: (id: number, variant: string | null, qty: number) => void; remove: (id: number, variant: string | null) => void;
  wishlist: number[]; toggleWish: (id: number) => void; hasWish: (id: number) => boolean;
  drawerOpen: boolean; openDrawer: () => void; closeDrawer: () => void; notify: (m: string) => void;
}
const Ctx = createContext<ShopCtx | null>(null);
// Only non-sensitive guest data is stored in the browser: product ids, variants, quantities, a coupon code.
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export function ShopProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [coupon, setCoupon] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const auth = useAuth();

  // Saved bag and wishlist can only be read in the browser after the page has loaded, so this one-time setState-in-effect is intentional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLines(read('aur_cart', [])); setWishlist(read('aur_wish', [])); setCoupon(read('aur_coupon', '')); ready.current = true; }, []);
  useEffect(() => { if (ready.current) write('aur_cart', lines); }, [lines]);
  useEffect(() => { if (ready.current) write('aur_coupon', coupon); }, [coupon]);
  // Only persist localStorage wishlist for guests; logged-in wishlist lives in DB
  useEffect(() => { if (ready.current && !auth.user) write('aur_wish', wishlist); }, [wishlist, auth.user]);

  // Merge DB wishlist when user logs in
  useEffect(() => {
    if (auth.user && auth.dbWishlist.length > 0) {
      setWishlist(auth.dbWishlist);
    }
  }, [auth.user, auth.dbWishlist]);

  const notify = useCallback((m: string) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(''), 2200); }, []);
  const add = useCallback((l: CartLine) => {
    setLines((cur) => {
      const i = cur.findIndex((x) => x.productId === l.productId && x.variant === l.variant);
      if (i < 0) return [...cur, { ...l, qty: Math.min(MAX_QTY, l.qty) }];
      return cur.map((x, j) => (j === i ? { ...x, qty: Math.min(MAX_QTY, x.qty + l.qty) } : x));
    });
    setDrawerOpen(true);
  }, []);
  const setQty = useCallback((id: number, v: string | null, qty: number) => setLines((c) => c.map((x) => (x.productId === id && x.variant === v ? { ...x, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : x))), []);
  const remove = useCallback((id: number, v: string | null) => setLines((c) => c.filter((x) => !(x.productId === id && x.variant === v))), []);
  const replaceLines = useCallback((next: CartLine[]) => setLines(next.map((x) => ({ ...x, qty: Math.max(1, Math.min(MAX_QTY, x.qty)) }))), []);
  const toggleWish = useCallback(async (id: number) => {
    if (auth.user) {
      const r = await fetch('/api/account/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: id }) });
      if (r.ok) {
        const d = await r.json() as { inWishlist: boolean };
        setWishlist((c) => d.inWishlist ? (c.includes(id) ? c : [...c, id]) : c.filter((x) => x !== id));
      }
    } else {
      setWishlist((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
    }
  }, [auth.user]);

  const effectiveWishlist = auth.user ? (auth.dbWishlist.length > 0 ? auth.dbWishlist : wishlist) : wishlist;

  const value = useMemo<ShopCtx>(() => ({
    lines, count: lines.reduce((n, l) => n + l.qty, 0), coupon, setCoupon, add, replaceLines, setQty, remove, wishlist: effectiveWishlist, toggleWish,
    hasWish: (id) => effectiveWishlist.includes(id), drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false), notify,
  }), [lines, coupon, add, replaceLines, setQty, remove, effectiveWishlist, toggleWish, drawerOpen, notify]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className={`pointer-events-none fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-charcoal px-5 py-3 text-sm text-ivory transition ${msg ? 'opacity-100' : 'translate-y-4 opacity-0'}`}>{msg}</div>
    </Ctx.Provider>
  );
}
export function useShop(): ShopCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useShop must be used inside <ShopProvider>');
  return c;
}
