'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/components/admin/api';
import { btnPrimary, input, label } from '@/components/admin/ui';

export function LoginForm() {
  const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const r = await adminFetch('/api/admin/auth/login', 'POST', { email, password });
    if (r.ok) { router.replace('/admin'); router.refresh(); } else { setError(r.error); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label htmlFor="e" className={label}>Email</label><input id="e" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></div>
      <div><label htmlFor="p" className={label}>Password</label><input id="p" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} /></div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
