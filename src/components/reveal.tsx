'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
// Restrained scroll reveal. Content is visible without JavaScript and for reduced-motion visitors.
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setHidden(true);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHidden(false); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`transition duration-700 ease-out ${hidden ? 'translate-y-6 opacity-0' : ''} ${className}`}>{children}</div>;
}
