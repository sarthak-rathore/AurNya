'use client';
import { useState } from 'react';
import { setThemePref, useTheme } from '@/lib/theme';

// Header button: flips between light and dark. (The full Light / Dark / System choice lives in the menu and footer.)
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const [said, setSaid] = useState('');
  return (
    <>
      <button type="button" aria-label={`Switch to ${next} mode`} className={className} onClick={() => { setThemePref(next); setSaid(`${next === 'dark' ? 'Dark' : 'Light'} mode on`); }}>
        {/* Both icons are in the page; CSS shows the right one, so there is no flicker before the page wakes up. */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="hidden h-[22px] w-[22px] fill-none stroke-current stroke-[1.5] dark:block [stroke-linecap:round] [stroke-linejoin:round]"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[22px] w-[22px] fill-none stroke-current stroke-[1.5] dark:hidden [stroke-linecap:round] [stroke-linejoin:round]"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></svg>
      </button>
      <span role="status" aria-live="polite" className="sr-only">{said}</span>
    </>
  );
}
