'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { StoreControls } from '@/lib/store-controls';

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [controls, setControls] = useState<StoreControls | null>(null);

  useEffect(() => {
    fetch('/api/store-controls')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === 'object') {
          setControls(data);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Administrative portals are never blocked so Owner can log in and toggle maintenance off!
  const isStaffRoute =
    pathname.startsWith('/owner') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/manager') ||
    pathname.startsWith('/api');

  if (isStaffRoute || !controls) {
    return <>{children}</>;
  }

  // If Maintenance Mode is ON or Website Live is OFF:
  if (controls.maintenance || !controls.live) {
    return (
      <div className="fixed inset-0 z-[99999] flex min-h-screen flex-col items-center justify-center bg-[#211a28] px-6 text-center text-[#fbf7ee]">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#e4d2a8]/40 bg-[#2e2338] shadow-2xl ring-4 ring-[#e4d2a8]/10">
          <svg viewBox="0 0 100 100" className="h-10 w-10 text-[#e4d2a8]" fill="currentColor" aria-hidden="true">
            <path d="M50 12 C40 28 20 40 20 62 C20 78 33 88 50 88 C67 88 80 78 80 62 C80 40 60 28 50 12 Z M50 25 C58 37 72 48 72 62 C72 74 62 81 50 81 C38 81 28 74 28 62 C28 48 42 37 50 25 Z" />
            <circle cx="50" cy="58" r="9" />
          </svg>
        </div>

        <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#e4d2a8] mb-2">
          AurNya Luxury Jewels
        </p>

        <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-wide text-[#fbf7ee]">
          Private Vault Curation
        </h1>

        <div className="my-5 h-px w-28 bg-gradient-to-r from-transparent via-[#e4d2a8]/60 to-transparent" />

        <p className="max-w-md text-sm text-[#d6c7e6] leading-relaxed">
          Our online salon is momentarily paused while our gemologists and artisans prepare our upcoming fine jewellery drop. We will open our doors again shortly.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-[#cbb9dc] max-w-sm">
          <p className="font-serif text-sm font-medium text-[#fbf7ee] mb-1.5">Patron Concierge Service</p>
          <p className="mb-2">For custom commissions, urgent sizing assistance, or order status:</p>
          <p>
            WhatsApp: <a href="https://wa.me/918147349242" className="text-[#e4d2a8] underline">+91 8147349242</a>
          </p>
          <p className="mt-1">
            Helpline: <a href="tel:18002660123" className="text-[#e4d2a8] underline">1800-266-0123</a>
          </p>
        </div>

        <div className="mt-6 text-[10px] text-[#8e829d]">
          Store administrators may still access the <a href="/owner/login" className="underline hover:text-white">Owner Portal</a>.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
