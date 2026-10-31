'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface AuthUser { id: string; email: string; firstName: string; lastName: string; phone?: string | null; }

interface AuthCtx {
  user: AuthUser | null;
  dbWishlist: number[];
  isLoading: boolean;
  login: (email: string, password: string, guestWishlist?: number[]) => Promise<{ error?: string }>;
  register: (data: RegisterData) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

export interface RegisterData { email: string; password: string; firstName: string; lastName: string; phone?: string; }

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dbWishlist, setDbWishlist] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d: { user: AuthUser | null; wishlistIds?: number[] }) => {
      setUser(d.user);
      if (d.wishlistIds) setDbWishlist(d.wishlistIds);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, guestWishlist: number[] = []) => {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, wishlistIds: guestWishlist }) });
    const d = await r.json() as { user?: AuthUser; error?: string };
    if (!r.ok) return { error: d.error ?? 'Login failed' };
    setUser(d.user ?? null);
    const wl = await fetch('/api/account/wishlist').then((x) => x.json()) as { ids: number[] };
    setDbWishlist(wl.ids ?? []);
    return {};
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const d = await r.json() as { user?: AuthUser; error?: string };
    if (!r.ok) return { error: d.error ?? 'Registration failed' };
    setUser(d.user ?? null);
    return {};
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setDbWishlist([]);
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!user) return;
    const d = await fetch('/api/account/wishlist').then((r) => r.json()) as { ids: number[] };
    setDbWishlist(d.ids ?? []);
  }, [user]);

  const value = useMemo<AuthCtx>(() => ({ user, dbWishlist, isLoading, login, register, logout, refreshWishlist }), [user, dbWishlist, isLoading, login, register, logout, refreshWishlist]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be inside <AuthProvider>');
  return c;
}
