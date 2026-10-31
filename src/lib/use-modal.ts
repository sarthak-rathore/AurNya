'use client';
import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Makes a panel behave like a proper modal dialog:
 * - moves keyboard focus into it when it opens (to `initial` if given)
 * - keeps Tab / Shift+Tab inside it
 * - closes on Escape
 * - stops the page behind from scrolling
 * - returns focus to whatever opened it (or `restore`) when it closes
 */
export function useModal(open: boolean, panel: RefObject<HTMLElement | null>, onClose: () => void, initial?: RefObject<HTMLElement | null>, restore?: RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const el = panel.current; if (!el) return;
    const opener = (restore?.current ?? document.activeElement) as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (initial?.current ?? el.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.getClientRects().length > 0);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0]; const last = items[items.length - 1]; const a = document.activeElement;
      if (e.shiftKey && (a === first || !el.contains(a))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !el.contains(a))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (opener && opener !== document.body && document.contains(opener)) opener.focus();
    };
  }, [open, panel, initial, restore]);
}
