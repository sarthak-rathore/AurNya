'use client';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';
import { ProductGrid } from './product-card';

// Stores only product ids on this device. No tracking, no profile.
export function RecentlyViewed({ current, all }: { current: number; all: Product[] }) {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    let prev: number[] = [];
    try { prev = JSON.parse(localStorage.getItem('aur_recent') ?? '[]') as number[]; } catch { /* ignore */ }
    // Browser storage is only readable after the page loads, so this one-time setState-in-effect is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIds(prev.filter((i) => i !== current).slice(0, 4));
    try { localStorage.setItem('aur_recent', JSON.stringify([current, ...prev.filter((i) => i !== current)].slice(0, 8))); } catch { /* ignore */ }
  }, [current]);
  const items = ids.map((i) => all.find((p) => p.id === i)).filter((p): p is Product => !!p);
  if (!items.length) return null;
  return <section className="mt-20"><h2 className="mb-8 text-center font-serif text-4xl">Recently viewed</h2><ProductGrid items={items} /></section>;
}
