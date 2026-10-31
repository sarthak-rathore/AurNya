'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatINR } from '@/lib/money';
import { useModal } from '@/lib/use-modal';
import type { Product } from '@/lib/types';

export function SearchOverlay({ open, onClose, restore }: { open: boolean; onClose: () => void; restore?: React.RefObject<HTMLElement | null> }) {
  const [q, setQ] = useState(''); const [items, setItems] = useState<Product[]>([]); const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null); const panel = useRef<HTMLDivElement>(null); const router = useRouter();
  const close = () => { setQ(''); setItems([]); onClose(); };
  useModal(open, panel, close, input, restore);
  const list = q.trim() ? items : [];
  useEffect(() => {
    if (!q.trim()) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal }); if (r.ok) { setItems((await r.json()).items); setActive(-1); } } catch { /* aborted or offline */ }
    }, 200);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);
  const go = (href: string) => { close(); router.push(href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (list.length ? (a + 1) % list.length : -1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (list.length ? (a - 1 + list.length) % list.length : -1)); }
    if (e.key === 'Enter') { e.preventDefault(); go(list[active] ? `/product/${list[active].slug}` : `/shop?q=${encodeURIComponent(q)}`); }
  };
  return (
    <div ref={panel} role="dialog" aria-modal="true" aria-label="Search" aria-hidden={!open} className={`fixed inset-x-0 top-0 z-[70] max-h-[90vh] overflow-auto bg-ivory px-6 pb-8 pt-6 transition-transform duration-300 ${open ? '' : 'invisible -translate-y-full'}`}>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 border-b border-charcoal pb-2">
          <label htmlFor="site-search" className="sr-only">Search AurNya</label>
          <input id="site-search" ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search rings, earrings, necklaces…" autoComplete="off" role="combobox" aria-expanded={list.length > 0} aria-controls="search-list" aria-activedescendant={list[active] ? `suggestion-${list[active].id}` : undefined} aria-autocomplete="list" className="flex-1 bg-transparent py-2 text-xl outline-none" />
          <button type="button" onClick={close} aria-label="Close search" className="h-10 w-10 text-2xl">×</button>
        </div>
        {/* Options are selectable rows, not links (a link inside an option is not allowed). Mouse click and Enter both go to the product. */}
        <ul id="search-list" role="listbox" aria-label="Suggestions" className="mt-3">
          {list.map((p, i) => (
            <li key={p.id} id={`suggestion-${p.id}`} role="option" aria-selected={i === active} onClick={() => go(`/product/${p.slug}`)} onMouseEnter={() => setActive(i)} className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 ${i === active ? 'bg-cream' : ''}`}>
              <span>{p.name}<span className="block text-sm text-muted">{p.category}</span></span><span>{formatINR(p.pricePaise)}</span>
            </li>
          ))}
        </ul>
        {q.trim() && list.length === 0 && <p id="search-empty" className="px-3 py-3 text-muted">No matches. Try “ring” or “earrings”, or <Link className="underline" href="/shop" onClick={close}>browse everything</Link>.</p>}
      </div>
    </div>
  );
}
