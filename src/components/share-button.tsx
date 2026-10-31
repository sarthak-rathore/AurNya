'use client';
import { useShop } from '@/store/shop-context';
export function ShareButton({ title }: { title: string }) {
  const { notify } = useShop();
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(url); notify('Link copied');
    } catch { /* share cancelled or clipboard blocked */ }
  };
  return <button type="button" onClick={share} className="mt-4 text-xs uppercase tracking-widest underline">Share this piece</button>;
}
