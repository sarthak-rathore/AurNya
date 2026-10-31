'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { Category } from '@/lib/types';
import { PlaceholderArt } from './placeholder-art';

interface Props { name: string; category: Category; images: { src: string; alt: string }[]; video?: string }
export function Gallery({ name, category, images, video }: Props) {
  const [i, setI] = useState(0); const [zoom, setZoom] = useState(false); const [origin, setOrigin] = useState('50% 50%');
  const cur = images[i];
  const frame = 'relative grid aspect-square w-full place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-cream to-sage';
  return (
    <div className="md:sticky md:top-24">
      {cur ? (
        <button type="button" aria-label={zoom ? 'Zoom out' : 'Zoom in'} aria-pressed={zoom} className={`${frame} ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`} onClick={() => setZoom((z) => !z)}
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); }} onMouseLeave={() => setZoom(false)}>
          <Image src={cur.src} alt={cur.alt} fill priority sizes="(max-width:768px) 100vw, 50vw" className={`object-cover transition-transform duration-300 ${zoom ? 'scale-[1.8]' : ''}`} style={{ transformOrigin: origin }} />
        </button>
      ) : (
        <div className={frame}><PlaceholderArt category={category} className="w-1/2" /><span className="absolute bottom-4 left-4 text-xs uppercase tracking-widest text-muted">Product photo coming soon</span></div>
      )}
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2" aria-label={`${name} images`}>{images.map((im, n) => (
          <li key={im.src}><button type="button" aria-label={`Show image ${n + 1}`} aria-current={n === i} onClick={() => setI(n)} className={`relative block h-16 w-16 overflow-hidden rounded-xl border-2 ${n === i ? 'border-charcoal' : 'border-transparent'}`}><Image src={im.src} alt="" fill sizes="64px" className="object-cover" /></button></li>))}</ul>)}
      {video && <video controls preload="none" className="mt-3 w-full rounded-2xl" aria-label={`${name} video`}><source src={video} /></video>}
    </div>
  );
}
