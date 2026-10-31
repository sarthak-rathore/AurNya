'use client';
import { useSyncExternalStore } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

// Keep in step with src/lib/theme-boot.ts.
export const THEME_KEY = 'aur_theme';
const BROWSER_BAR: Record<Theme, string> = { light: '#FBF7EE', dark: '#18151D' };
const CHANGE = 'aur-theme-change';

const systemTheme = (): Theme => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function savedPref(): ThemePref {
  try { const v = localStorage.getItem(THEME_KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; }
}

/** Paints the theme: sets the attributes the CSS reads, the browser's own colour-scheme hint and the phone address-bar colour. */
export function applyTheme(pref: ThemePref) {
  const theme: Theme = pref === 'system' ? systemTheme() : pref;
  const root = document.documentElement;
  root.dataset.theme = theme; root.dataset.themePref = pref; root.style.colorScheme = theme;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
  meta.content = BROWSER_BAR[theme];
}

/** Saves the visitor's choice. "system" removes the saved choice so the device setting decides again. */
export function setThemePref(pref: ThemePref) {
  try { if (pref === 'system') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, pref); } catch { /* private mode: the choice lasts for this visit only */ }
  applyTheme(pref);
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onChange: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onDevice = () => { if (savedPref() === 'system') { applyTheme('system'); onChange(); } }; // device switched while on "System"
  const onStorage = (e: StorageEvent) => { if (e.key === THEME_KEY || e.key === null) { applyTheme(savedPref()); onChange(); } }; // another tab changed it
  window.addEventListener(CHANGE, onChange); window.addEventListener('storage', onStorage); mq.addEventListener('change', onDevice);
  return () => { window.removeEventListener(CHANGE, onChange); window.removeEventListener('storage', onStorage); mq.removeEventListener('change', onDevice); };
}
const readPref = () => (document.documentElement.dataset.themePref as ThemePref) || 'system';
const readTheme = () => (document.documentElement.dataset.theme as Theme) || 'light';

/** What the visitor chose: light, dark or system. */
export const useThemePref = () => useSyncExternalStore(subscribe, readPref, () => 'system' as ThemePref);
/** What is actually showing right now: light or dark. */
export const useTheme = () => useSyncExternalStore(subscribe, readTheme, () => 'light' as Theme);
