'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { UserRole } from '@/lib/role-auth';
import { isDemoMode } from '@/lib/demo-mode';

const ROLE_HOME: Record<UserRole, string> = { owner: '/owner', admin: '/admin', manager: '/manager' };
const ROLE_LABEL: Record<UserRole, string> = { owner: 'Owner', admin: 'Admin', manager: 'Manager' };
const ROLE_COLOR: Record<UserRole, { card: string; glow: string; accent: string; btn: string; badge: string; link: string }> = {
  owner: { card: 'from-amber-500/15 to-amber-900/8 border-amber-500/25', glow: 'bg-amber-500/8', accent: 'text-amber-400', btn: 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20', badge: 'text-amber-400 border-amber-500/30 bg-amber-500/10', link: 'text-amber-400 hover:text-amber-300' },
  admin: { card: 'from-blue-500/15 to-blue-900/8 border-blue-500/25', glow: 'bg-blue-500/8', accent: 'text-blue-400', btn: 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20', badge: 'text-blue-400 border-blue-500/30 bg-blue-500/10', link: 'text-blue-400 hover:text-blue-300' },
  manager: { card: 'from-emerald-500/15 to-emerald-900/8 border-emerald-500/25', glow: 'bg-emerald-500/8', accent: 'text-emerald-400', btn: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20', badge: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', link: 'text-emerald-400 hover:text-emerald-300' },
};

const DEMO_MODE = isDemoMode();

type ForgotStep = 'email' | 'otp' | 'done';

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

export function RoleLoginForm({ role }: { role: UserRole }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotDemoMode, setForgotDemoMode] = useState(DEMO_MODE);
  const c = ROLE_COLOR[role];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/${role}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.ok) { router.replace(ROLE_HOME[role]); router.refresh(); }
      else { setError(data.error ?? 'Sign-in failed. Please try again.'); setBusy(false); }
    } catch { setError('Network error. Please check your connection.'); setBusy(false); }
  }

  async function handleForgotEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setInfo('');
    try {
      const res = await fetch(`/api/${role}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail }) });
      const d = await res.json() as { ok?: boolean; demo?: boolean; error?: string };
      setBusy(false);
      if (!res.ok) { setError(d.error ?? 'Failed to send OTP.'); return; }
      setForgotDemoMode(d.demo ?? DEMO_MODE);
      setForgotStep('otp');
      setInfo(d.demo ? 'Demo mode: use code 000000' : 'Check your email for the 6-digit code.');
    } catch { setError('Network error.'); setBusy(false); }
  }

  async function handleForgotOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/${role}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }) });
      const d = await res.json() as { ok?: boolean; error?: string };
      setBusy(false);
      if (!res.ok) { setError(d.error ?? 'Invalid OTP.'); return; }
      // OTP verified = session cookie set, redirect to dashboard
      router.replace(ROLE_HOME[role]);
      router.refresh();
    } catch { setError('Network error.'); setBusy(false); }
  }

  const inputCls = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 disabled:opacity-60 transition-all';
  const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider';

  return (
    <div className="min-h-screen bg-[#0A0810] flex items-center justify-center px-4 py-10" data-theme="dark">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full ${c.glow} blur-[120px] opacity-50`} />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="text-3xl">🪙</div>
            <span className="text-2xl font-bold text-white tracking-tight">AurNya</span>
          </div>
          <span className={`inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[.25em] ${c.badge}`}>
            {ROLE_LABEL[role]} Portal
          </span>
        </div>

        {/* Card */}
        <div className={`rounded-2xl border bg-gradient-to-b ${c.card} p-7 shadow-2xl backdrop-blur-xl`}>
          {mode === 'login' ? (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
                <p className="text-sm text-slate-400">Sign in to your {ROLE_LABEL[role].toLowerCase()} dashboard</p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor={`${role}-email`} className={labelCls}>Email</label>
                  <input id={`${role}-email`} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`${role}@aurnya.com`} className={inputCls} />
                </div>
                <div>
                  <label htmlFor={`${role}-password`} className={labelCls}>Password</label>
                  <div className="relative">
                    <input id={`${role}-password`} type={showPw ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" className={inputCls + ' pr-12'} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button type="button" onClick={() => { setMode('forgot'); setForgotEmail(email); setForgotStep('email'); setError(''); setInfo(''); }} className={`text-xs hover:underline ${c.link}`}>
                    Forgot password?
                  </button>
                </div>

                {error && <p role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-400">{error}</p>}

                <button type="submit" disabled={busy} className={`w-full rounded-xl px-5 py-3.5 text-sm font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${c.btn}`}>
                  {busy ? 'Signing in…' : `Sign in as ${ROLE_LABEL[role]}`}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button type="button" onClick={() => { setMode('login'); setError(''); setInfo(''); }} className="mb-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Back to sign in
                </button>
                <h1 className="text-xl font-bold text-white mb-1">Reset password</h1>
                <p className="text-sm text-slate-400">
                  {forgotStep === 'email' ? 'Enter your email to receive a one-time code' : `Enter the 6-digit code sent to ${forgotEmail}`}
                </p>
              </div>

              {/* Progress */}
              <div className="flex gap-2 mb-6">
                {(['email', 'otp'] as const).map((s, i) => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-all ${forgotStep === s ? 'opacity-100' : i < ['email','otp'].indexOf(forgotStep) ? 'opacity-40' : 'opacity-15'} bg-white`} />
                ))}
              </div>

              {info && <p className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-sm text-emerald-400">{info}</p>}
              {error && <p role="alert" className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-400">{error}</p>}

              {forgotStep === 'email' ? (
                <form onSubmit={handleForgotEmail} className="space-y-4">
                  <div>
                    <label className={labelCls}>Email address</label>
                    <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder={`${role}@aurnya.com`} className={inputCls} />
                  </div>
                  {(role === 'owner' || role === 'admin') && DEMO_MODE && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3.5 py-2.5 text-xs text-amber-400">
                      <span className="font-bold">OTP is required</span> for {ROLE_LABEL[role]}. Demo code: <span className="font-mono font-bold tracking-widest">000000</span>
                    </div>
                  )}
                  <button type="submit" disabled={busy} className={`w-full rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all disabled:opacity-50 shadow-lg ${c.btn}`}>
                    {busy ? 'Sending…' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotOtp} className="space-y-4">
                  {forgotDemoMode && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3.5 py-2.5 text-xs text-amber-400">
                      Demo OTP: <span className="font-mono font-bold tracking-[0.5em] text-base">000000</span>
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>6-digit OTP</label>
                    <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))} required placeholder="000000" className={inputCls + ' text-center tracking-[0.6em] text-xl font-mono'} />
                  </div>
                  <button type="submit" disabled={busy || forgotOtp.length !== 6} className={`w-full rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all disabled:opacity-50 shadow-lg ${c.btn}`}>
                    {busy ? 'Verifying…' : 'Verify & Sign in'}
                  </button>
                  <button type="button" onClick={() => { setForgotStep('email'); setForgotOtp(''); setInfo(''); }} className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    Resend code
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-5 text-center space-y-1.5">
          {role !== 'owner' && <p className="text-xs text-slate-700">Owner? <a href="/owner/login" className={`text-xs ${c.link}`}>Owner portal →</a></p>}
          {role !== 'admin' && <p className="text-xs text-slate-700">Admin? <a href="/admin/login" className="text-xs text-blue-500 hover:text-blue-400">Admin portal →</a></p>}
          {role !== 'manager' && <p className="text-xs text-slate-700">Manager? <a href="/manager/login" className="text-xs text-emerald-500 hover:text-emerald-400">Manager portal →</a></p>}
        </div>
        <p className="mt-4 text-center text-[10px] text-slate-800">AurNya Admin v2.1 · {DEMO_MODE ? 'Demo Mode' : 'Production'}</p>
      </div>
    </div>
  );
}
