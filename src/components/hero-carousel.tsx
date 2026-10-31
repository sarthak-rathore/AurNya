'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

export interface Slide { id: string; label: string; content: ReactNode }

// A slideshow that follows the accessible pattern: it pauses while you hover or focus it, has a Pause button
// (only shown when it would move by itself), never moves for people who asked for less motion, and hides slides that
// are not showing from screen readers and the keyboard.
export function HeroCarousel({ slides, intervalMs = 7000 }: { slides: Slide[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0); const [userPaused, setUserPaused] = useState(false);
  const [hover, setHover] = useState(false); const [focus, setFocus] = useState(false);
  const reduced = useReducedMotion(); const box = useRef<HTMLDivElement>(null);
  const playing = !reduced && !userPaused && !hover && !focus;
  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);
  useEffect(() => { if (!playing) return; const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs); return () => clearInterval(t); }, [playing, slides.length, intervalMs]);
  const btn = 'grid h-11 w-11 place-items-center rounded-full bg-ivory/90 text-charcoal shadow-md backdrop-blur transition hover:bg-ivory';
  return (
    <section ref={box} role="region" aria-roledescription="carousel" aria-label="Featured" className="relative overflow-hidden bg-cream"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setFocus(true)} onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setFocus(false); }}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(index + 1); if (e.key === 'ArrowLeft') go(index - 1); }}>
      <div className="relative min-h-[600px] md:min-h-[640px]" aria-live={playing ? 'off' : 'polite'}>
        {slides.map((s, i) => (
          <div key={s.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}: ${s.label}`} aria-hidden={i !== index} inert={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>{s.content}</div>))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 mx-auto flex max-w-7xl items-center justify-between px-6">
        <div className="pointer-events-auto flex items-center gap-2">
          {slides.map((s, i) => (<button key={s.id} type="button" onClick={() => go(i)} aria-label={`Show slide ${i + 1}: ${s.label}`} aria-current={i === index} className="grid h-6 w-6 place-items-center rounded-full"><span className={`block h-2.5 rounded-full transition-all ${i === index ? 'w-8 bg-charcoal' : 'w-2.5 bg-charcoal/35'}`} /></button>))}
          {!reduced && <button type="button" onClick={() => setUserPaused((p) => !p)} className="ml-2 grid h-8 w-8 place-items-center rounded-full bg-ivory/90 text-charcoal" aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">{userPaused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}</svg></button>}
        </div>
        <div className="pointer-events-auto hidden gap-2 md:flex">
          <button type="button" className={btn} aria-label="Previous slide" onClick={() => go(index - 1)}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
          <button type="button" className={btn} aria-label="Next slide" onClick={() => go(index + 1)}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
        </div>
      </div>
    </section>
  );
}
