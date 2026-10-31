'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

// A sideways-scrolling row (swipe on phones, arrow buttons on larger screens). Arrows only enable when there is more to see.
export function Rail({ label, items }: { label: string; items: ReactNode[] }) {
  const list = useRef<HTMLUListElement>(null); const reduced = useReducedMotion();
  const [edge, setEdge] = useState({ start: true, end: true });
  useEffect(() => {
    const el = list.current; if (!el) return;
    const measure = () => setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
    const ro = new ResizeObserver(measure); ro.observe(el); el.addEventListener('scroll', measure, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener('scroll', measure); };
  }, []);
  const move = (dir: 1 | -1) => list.current?.scrollBy({ left: dir * list.current.clientWidth * 0.85, behavior: reduced ? 'auto' : 'smooth' });
  const arrow = 'hidden h-11 w-11 place-items-center rounded-full border border-charcoal/20 bg-ivory transition hover:bg-charcoal hover:text-ivory disabled:opacity-30 disabled:hover:bg-ivory disabled:hover:text-charcoal md:grid';
  const svg = (d: string) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
  return (
    <div role="region" aria-label={label} className="relative">
      <div className="mb-4 flex justify-end gap-2">
        <button type="button" className={arrow} disabled={edge.start} aria-label={`${label}: scroll back`} onClick={() => move(-1)}>{svg('M15 5l-7 7 7 7')}</button>
        <button type="button" className={arrow} disabled={edge.end} aria-label={`${label}: scroll forward`} onClick={() => move(1)}>{svg('M9 5l7 7-7 7')}</button>
      </div>
      <ul ref={list} className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it, i) => <li key={i} className="w-[58%] shrink-0 snap-start sm:w-[34%] lg:w-[23.5%]">{it}</li>)}
      </ul>
    </div>
  );
}
