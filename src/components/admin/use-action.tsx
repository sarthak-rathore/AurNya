'use client';
import { useState } from 'react';

type Res = { ok: true; data?: { pending?: boolean } } | { ok: false; error: string };

/** Tracks "saving…", an error message and a "Saved" flash for a form button. A change that went to the owner for approval says so instead of "Saved". */
export function useAction() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState('');
  async function run(fn: () => Promise<Res>, doneText = 'Saved ✓') {
    setBusy(true); setError(''); setDone('');
    const r = await fn(); setBusy(false);
    if (r.ok) {
      const pending = !!r.data?.pending;
      setDone(pending ? 'Sent to the owner for approval ⏳' : doneText); setTimeout(() => setDone(''), pending ? 6000 : 3000);
    } else setError(r.error);
    return r.ok;
  }
  const message = (
    <span role="status" aria-live="polite" className="text-sm">{error ? <span className="text-danger">{error}</span> : done ? <span className="text-success">{done}</span> : null}</span>
  );
  return { busy, error, done, run, message, setError };
}
