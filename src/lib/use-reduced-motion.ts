'use client';
import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
const subscribe = (onChange: () => void) => { const m = window.matchMedia(query); m.addEventListener('change', onChange); return () => m.removeEventListener('change', onChange); };

/** True when the visitor's device asks for less motion. (Assumed true on the server, so nothing moves before we know.) */
export const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
