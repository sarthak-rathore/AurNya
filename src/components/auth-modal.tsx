'use client';
import { useRef, useState } from 'react';
import { useAuth, type RegisterData } from '@/store/auth-context';
import { useShop } from '@/store/shop-context';
import { useModal } from '@/lib/use-modal';
import { isDemoMode } from '@/lib/demo-mode';

interface Props { open: boolean; onClose: () => void; restore?: React.RefObject<HTMLElement | null>; defaultTab?: 'login' | 'register'; }

type Step = 'login' | 'register' | 'forgot-email' | 'forgot-otp' | 'forgot-newpw';

const DEMO_MODE = isDemoMode();

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-400'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? colors[strength] : 'bg-charcoal/10'}`} />
        ))}
      </div>
      <p className={`text-[10px] ${strength >= 3 ? 'text-emerald-600' : strength >= 2 ? 'text-amber-600' : 'text-red-500'}`}>{labels[strength]}</p>
    </div>
  );
}

export function AuthModal({ open, onClose, restore, defaultTab = 'login' }: Props) {
  const { login, register } = useAuth();
  const { wishlist } = useShop();
  const [step, setStep] = useState<Step>(defaultTab === 'register' ? 'register' : 'login');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPw, setForgotNewPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [forgotDemoMode, setForgotDemoMode] = useState(DEMO_MODE);
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

  async function handleForgotRequest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setInfo('');
    const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail }) });
    const d = await res.json() as { ok?: boolean; demo?: boolean; error?: string };
    setBusy(false);
    if (!res.ok) { setError(d.error ?? 'Something went wrong.'); return; }
    setForgotDemoMode(d.demo ?? DEMO_MODE);
    if (d.demo) {
      setInfo('Demo mode: use code 000000');
    } else {
      setInfo('Check your email for a 6-digit code.');
    }
    setStep('forgot-otp');
  }

  async function handleForgotOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    setStep('forgot-newpw');
    setBusy(false);
  }

  async function handleForgotReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPw }) });
    const d = await res.json() as { ok?: boolean; error?: string };
    setBusy(false);
    if (!res.ok) { setError(d.error ?? 'Failed to reset password.'); return; }
    setInfo('Password reset! Please sign in.');
    setStep('login');
    setLoginEmail(forgotEmail);
  }

  if (!open) return null;

  const inp = 'w-full rounded-xl border border-charcoal/15 bg-white/60 dark:bg-charcoal/10 px-4 py-3 text-sm placeholder:text-muted focus:border-gold/50 focus:ring-2 focus:ring-gold/20 focus:outline-none transition-all backdrop-blur-sm';
  const lbl = 'block mb-1.5 text-xs font-semibold uppercase tracking-[.12em] text-muted';
  const btn = 'w-full rounded-full bg-gradient-to-r from-charcoal to-plum py-3 text-xs font-semibold uppercase tracking-widest text-ivory transition-all hover:opacity-90 hover:shadow-lg hover:shadow-charcoal/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
  const tab = (active: boolean) => `flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-[.1em] transition-all ${active ? 'bg-charcoal text-ivory shadow-sm' : 'text-muted hover:text-charcoal'}`;

  const isLoginOrRegister = step === 'login' || step === 'register';

  return (
    <>
      <div onClick={onClose} aria-hidden="true" className="fixed inset-0 z-[70] bg-scrim/50 backdrop-blur-md" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={step === 'login' ? 'Sign in' : step === 'register' ? 'Create account' : 'Reset password'}
        className="fixed left-1/2 top-1/2 z-[80] w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-ivory/95 backdrop-blur-xl p-7 shadow-2xl shadow-shade/25 border border-charcoal/8"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            {isLoginOrRegister ? (
              <>
                <h2 className="font-serif text-3xl text-charcoal">
                  {step === 'login' ? 'Welcome back' : 'Join AurNya'}
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  {step === 'login' ? 'Sign in to your account' : 'Create your account to get started'}
                </p>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setStep('login'); setError(''); setInfo(''); }} className="mb-2 flex items-center gap-1.5 text-xs text-muted hover:text-charcoal transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Back to sign in
                </button>
                <h2 className="font-serif text-2xl text-charcoal">Reset password</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {step === 'forgot-email' ? 'Enter your email to receive a code' : step === 'forgot-otp' ? 'Enter the 6-digit code sent to your email' : 'Create a new password'}
                </p>
              </>
            )}
          </div>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="ml-4 mt-1 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-muted hover:bg-charcoal/8 hover:text-charcoal transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tab switcher */}
        {isLoginOrRegister && (
          <div className="mb-5 flex gap-1 rounded-full bg-cream/60 p-1 border border-charcoal/8">
            <button type="button" onClick={() => { setStep('login'); setError(''); setInfo(''); }} className={tab(step === 'login')}>Sign in</button>
            <button type="button" onClick={() => { setStep('register'); setError(''); setInfo(''); }} className={tab(step === 'register')}>Register</button>
          </div>
        )}

        {/* Progress dots for forgot password */}
        {!isLoginOrRegister && (
          <div className="mb-5 flex items-center gap-2 justify-center">
            {(['forgot-email', 'forgot-otp', 'forgot-newpw'] as const).map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${step === s ? 'w-6 bg-charcoal' : i < ['forgot-email','forgot-otp','forgot-newpw'].indexOf(step) ? 'w-3 bg-charcoal/40' : 'w-3 bg-charcoal/15'}`} />
            ))}
          </div>
        )}

        {/* Alerts */}
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200/50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {info && <p className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200/50 px-4 py-3 text-sm text-emerald-700">{info}</p>}

        {/* LOGIN FORM */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {DEMO_MODE && (
              <div className="rounded-2xl border border-gold/20 bg-gradient-to-r from-champagne/30 to-cream/50 p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-charcoal">Demo Account</p>
                    <p className="text-[11px] text-muted mt-0.5">demo@aurnya.com · AurNya@123</p>
                  </div>
                  <button type="button" onClick={fillDemoCredentials} className="rounded-full bg-charcoal px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ivory hover:bg-plum transition-colors">
                    Auto-fill
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className={lbl} htmlFor="li-email">Email address</label>
              <input id="li-email" name="email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className={inp} />
            </div>
            <div>
              <label className={lbl} htmlFor="li-pw">Password</label>
              <div className="relative">
                <input id="li-pw" name="password" type={showLoginPw ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" className={inp + ' pr-11'} />
                <button type="button" tabIndex={-1} onClick={() => setShowLoginPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal transition-colors">
                  <EyeIcon open={showLoginPw} />
                </button>
              </div>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => { setStep('forgot-email'); setForgotEmail(loginEmail); setError(''); setInfo(''); }} className="text-xs text-muted hover:text-charcoal underline underline-offset-2 transition-colors">
                Forgot password?
              </button>
            </div>
            <button type="submit" disabled={busy} className={btn}>{busy ? 'Signing in…' : 'Sign in'}</button>
            <p className="text-center text-[10px] leading-snug text-muted">By signing in, you agree to receive order updates on WhatsApp. Reply STOP to unsubscribe.</p>
            <p className="text-center text-xs text-muted">No account? <button type="button" onClick={() => { setStep('register'); setError(''); }} className="font-medium text-charcoal hover:underline">Create one →</button></p>
          </form>
        )}

        {/* REGISTER FORM */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl} htmlFor="rg-fn">First name</label><input id="rg-fn" name="firstName" required autoComplete="given-name" placeholder="Priya" className={inp} /></div>
              <div><label className={lbl} htmlFor="rg-ln">Last name</label><input id="rg-ln" name="lastName" autoComplete="family-name" placeholder="Sharma" className={inp} /></div>
            </div>
            <div><label className={lbl} htmlFor="rg-email">Email address</label><input id="rg-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={inp} /></div>
            <div>
              <label className={lbl} htmlFor="rg-phone">Mobile number <span className="normal-case font-normal">(optional)</span></label>
              <input id="rg-phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" className={inp} />
              <p className="mt-1 text-[10px] leading-snug text-muted">Add your number to get order updates on WhatsApp.</p>
            </div>
            <div>
              <label className={lbl} htmlFor="rg-pw">Password</label>
              <div className="relative">
                <input id="rg-pw" name="password" type={showRegPw ? 'text' : 'password'} required minLength={8} autoComplete="new-password" placeholder="Min 8 characters" value={regPassword} onChange={e => setRegPassword(e.target.value)} className={inp + ' pr-11'} />
                <button type="button" tabIndex={-1} onClick={() => setShowRegPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal transition-colors">
                  <EyeIcon open={showRegPw} />
                </button>
              </div>
              <PasswordStrength password={regPassword} />
            </div>
            <button type="submit" disabled={busy} className={btn}>{busy ? 'Creating account…' : 'Create account'}</button>
            <p className="text-center text-xs text-muted">Already have one? <button type="button" onClick={() => { setStep('login'); setError(''); }} className="font-medium text-charcoal hover:underline">Sign in →</button></p>
          </form>
        )}

        {/* FORGOT - EMAIL STEP */}
        {step === 'forgot-email' && (
          <form onSubmit={handleForgotRequest} className="space-y-4">
            <div><label className={lbl} htmlFor="fe-email">Email address</label><input id="fe-email" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className={inp} /></div>
            <button type="submit" disabled={busy} className={btn}>{busy ? 'Sending code…' : 'Send reset code'}</button>
          </form>
        )}

        {/* FORGOT - OTP STEP */}
        {step === 'forgot-otp' && (
          <form onSubmit={handleForgotOtp} className="space-y-4">
            {forgotDemoMode && (
              <div className="rounded-xl border border-gold/20 bg-champagne/20 px-4 py-3 text-xs text-charcoal">
                <span className="font-semibold">Demo mode:</span> use code <span className="font-mono font-bold tracking-widest">000000</span>
              </div>
            )}
            <div>
              <label className={lbl} htmlFor="fo-otp">6-digit code</label>
              <input id="fo-otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))} required placeholder="000000" className={inp + ' text-center tracking-[0.5em] text-lg font-mono'} />
            </div>
            <button type="submit" disabled={busy || forgotOtp.length !== 6} className={btn}>Verify code →</button>
            <p className="text-center text-xs text-muted">Didn&apos;t receive it? <button type="button" onClick={() => { setStep('forgot-email'); setForgotOtp(''); setInfo(''); }} className="font-medium text-charcoal hover:underline">Try again</button></p>
          </form>
        )}

        {/* FORGOT - NEW PASSWORD STEP */}
        {step === 'forgot-newpw' && (
          <form onSubmit={handleForgotReset} className="space-y-4">
            <div>
              <label className={lbl} htmlFor="fn-pw">New password</label>
              <div className="relative">
                <input id="fn-pw" type={showNewPw ? 'text' : 'password'} required minLength={8} value={forgotNewPw} onChange={e => setForgotNewPw(e.target.value)} autoComplete="new-password" placeholder="Min 8 characters" className={inp + ' pr-11'} />
                <button type="button" tabIndex={-1} onClick={() => setShowNewPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal transition-colors">
                  <EyeIcon open={showNewPw} />
                </button>
              </div>
              <PasswordStrength password={forgotNewPw} />
            </div>
            <button type="submit" disabled={busy} className={btn}>{busy ? 'Resetting…' : 'Set new password'}</button>
          </form>
        )}
      </div>
    </>
  );
}
