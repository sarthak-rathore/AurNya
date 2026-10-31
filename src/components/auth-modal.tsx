'use client';
import { useRef, useState } from 'react';
import { useAuth, type RegisterData } from '@/store/auth-context';
import { useShop } from '@/store/shop-context';
import { useModal } from '@/lib/use-modal';

interface Props { open: boolean; onClose: () => void; restore?: React.RefObject<HTMLElement | null>; defaultTab?: 'login' | 'register'; }

export function AuthModal({ open, onClose, restore, defaultTab = 'login' }: Props) {
  const { login, register } = useAuth();
  const { wishlist } = useShop();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useModal(open, panelRef, onClose, closeBtn, restore);

  function fillDemoCredentials() {
    setLoginEmail('demo@aurnya.com');
    setLoginPassword('AurNya@123');
    setError('');
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const res = await login(loginEmail, loginPassword, wishlist);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    onClose();
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: RegisterData = { email: fd.get('email') as string, password: fd.get('password') as string, firstName: fd.get('firstName') as string, lastName: (fd.get('lastName') as string) || '', phone: (fd.get('phone') as string) || undefined };
    setBusy(true); setError('');
    const res = await register(data);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    onClose();
  }

  const inp = 'w-full rounded-xl border border-charcoal/20 bg-surface px-4 py-3 text-sm placeholder:text-muted focus:border-charcoal/50 focus:outline-none';
  const lbl = 'block mb-1 text-xs uppercase tracking-[.12em] text-muted';
  const btn = 'w-full rounded-full bg-charcoal py-3 text-xs uppercase tracking-widest text-ivory transition hover:bg-plum disabled:opacity-50';

  if (!open) return null;
  return (
    <>
      <div onClick={onClose} aria-hidden="true" className="fixed inset-0 z-[70] bg-scrim/40 backdrop-blur-sm" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={tab === 'login' ? 'Sign in' : 'Create account'} className="fixed left-1/2 top-1/2 z-[80] w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-ivory p-8 shadow-2xl shadow-shade/20">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-3xl">{tab === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-charcoal/5">×</button>
        </div>
        <div className="mb-5 flex gap-1 rounded-full bg-surface p-1">
          {(['login', 'register'] as const).map((t) => (
            <button key={t} type="button" onClick={() => { setTab(t); setError(''); }} className={`flex-1 rounded-full py-2 text-xs uppercase tracking-[.12em] transition ${tab === t ? 'bg-charcoal text-ivory' : 'text-muted hover:text-charcoal'}`}>
              {t === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>
        {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="rounded-2xl border border-charcoal/10 bg-cream/50 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-charcoal">Demo Test Account</span>
                <button type="button" onClick={fillDemoCredentials} className="rounded-full bg-charcoal px-2.5 py-1 text-[10px] uppercase tracking-wider text-ivory transition hover:bg-plum">
                  Auto-fill
                </button>
              </div>
              <p className="mt-1 text-muted">demo@aurnya.com · AurNya@123</p>
            </div>
            <div><label className={lbl} htmlFor="li-email">Email</label><input id="li-email" name="email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required autoComplete="email" className={inp} /></div>
            <div><label className={lbl} htmlFor="li-pw">Password</label><input id="li-pw" name="password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required autoComplete="current-password" className={inp} /></div>
            <button type="submit" disabled={busy} className={btn}>{busy ? 'Signing in…' : 'Sign in'}</button>
            <p className="text-center text-xs text-muted">No account? <button type="button" onClick={() => setTab('register')} className="underline">Create one →</button></p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl} htmlFor="rg-fn">First name</label><input id="rg-fn" name="firstName" required autoComplete="given-name" className={inp} /></div>
              <div><label className={lbl} htmlFor="rg-ln">Last name</label><input id="rg-ln" name="lastName" autoComplete="family-name" className={inp} /></div>
            </div>
            <div><label className={lbl} htmlFor="rg-email">Email</label><input id="rg-email" name="email" type="email" required autoComplete="email" className={inp} /></div>
            <div><label className={lbl} htmlFor="rg-phone">Phone (optional)</label><input id="rg-phone" name="phone" type="tel" autoComplete="tel" className={inp} /></div>
            <div><label className={lbl} htmlFor="rg-pw">Password (min 8 chars)</label><input id="rg-pw" name="password" type="password" required minLength={8} autoComplete="new-password" className={inp} /></div>
            <button type="submit" disabled={busy} className={btn}>{busy ? 'Creating account…' : 'Create account'}</button>
            <p className="text-center text-xs text-muted">Already have one? <button type="button" onClick={() => setTab('login')} className="underline">Sign in →</button></p>
          </form>
        )}
      </div>
    </>
  );
}
