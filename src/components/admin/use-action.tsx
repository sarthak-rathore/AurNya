'use client';
import { useState } from 'react';

/** Tracks "saving…", an error message and a "Saved" flash for a form button. */
export function useAction() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState('');
  async function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, doneText = 'Saved ✓') {
    setBusy(true); setError(''); setDone('');
    const r = await fn(); setBusy(false);
    if (r.ok) { setDone(doneText); setTimeout(() => setDone(''), 3000); } else setError(r.error);
    return r.ok;
  }
  const message = (
    <span role="status" aria-live="polite" className="text-sm">{error ? <span className="text-danger">{error}</span> : done ? <span className="text-success">{done}</span> : null}</span>
  );
  return { busy, error, done, run, message, setError };
}
