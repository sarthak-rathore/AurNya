'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';

// Custom helper to dispatch global loader events from any client component
export function startAurnyaLoader(label?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aurnya:start-loading', { detail: { label } }));
  }
}

export function stopAurnyaLoader() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aurnya:stop-loading'));
  }
}

function RouteLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState<string>('AurNya');
  const [, startTransition] = useTransition();

  // Reset loader when route / query parameters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ label?: string }>;
      setLabel(customEvent.detail?.label || 'AurNya');
      setLoading(true);
    };

    const handleStop = () => {
      setLoading(false);
    };

    window.addEventListener('aurnya:start-loading', handleStart);
    window.addEventListener('aurnya:stop-loading', handleStop);

    // Intercept internal link clicks to trigger instant visual feedback
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Ignore external, hash links, new tab, download links
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        targetAttr === '_blank' ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      ) {
        return;
      }

      // If navigation to a different path or query
      const currentUrl = window.location.pathname + window.location.search;
      if (href !== currentUrl) {
        setLabel('AurNya');
        setLoading(true);
        // Safety timeout in case navigation takes longer or is aborted
        setTimeout(() => setLoading(false), 2400);
      }
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('aurnya:start-loading', handleStart);
      window.removeEventListener('aurnya:stop-loading', handleStop);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading AurNya content"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/45 backdrop-blur-md transition-opacity duration-300"
    >
      <div className="relative flex flex-col items-center">
        {/* Soft Golden Ambient Glow */}
        <div className="absolute -inset-8 rounded-full bg-gradient-to-tr from-gold/30 via-champagne/20 to-transparent blur-2xl animate-pulse" />

        {/* Outer Orbit Ring */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-gold/40 bg-[#211a28]/95 p-2 shadow-2xl ring-4 ring-gold/20">
          {/* Subtle spinning outer dash ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold/60 animate-[spin_8s_linear_infinite]" />

          {/* Rotating AurNya Coin Logo (3D Y-axis flip like Tanishq crest) */}
          <div className="relative h-16 w-16 overflow-hidden rounded-full animate-coin-spin shadow-inner">
            <Image
              src="/images/logo.png"
              alt="AurNya Logo"
              width={64}
              height={64}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Brand Text */}
        <div className="mt-5 text-center">
          <p className="font-serif text-xl tracking-[0.25em] text-[#f7e7ce] drop-shadow-sm uppercase">
            AurNya
          </p>
          <p className="mt-1 text-[11px] font-medium tracking-[0.3em] text-[#ecdcd5]/80 uppercase">
            Timeless Luxury In Bloom
          </p>
        </div>

        {/* Shimmer loading bar */}
        <div className="mt-4 h-0.5 w-36 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full -translate-x-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent animate-[shimmer_1.2s_infinite]" />
        </div>
      </div>
    </div>
  );
}

export function RouteLoader() {
  return (
    <Suspense fallback={null}>
      <RouteLoaderInner />
    </Suspense>
  );
}
