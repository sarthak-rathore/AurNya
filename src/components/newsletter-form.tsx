'use client';
import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: '', isError: false });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg({ text: '', isError: false });

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { error?: string; message?: string };
      setBusy(false);
      if (!res.ok) {
        setMsg({ text: data.error ?? 'Failed to subscribe.', isError: true });
      } else {
        setMsg({ text: data.message ?? 'Thank you for subscribing!', isError: false });
        setEmail('');
      }
    } catch {
      setBusy(false);
      setMsg({ text: 'Something went wrong. Please try again.', isError: true });
    }
  }

  return (
    <div className="mx-auto max-w-md px-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="nl" className="sr-only">Email</label>
        <input
          id="nl"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email address"
          className="min-w-0 flex-1 rounded-full border border-charcoal/20 bg-surface px-5 py-3 text-sm focus:border-charcoal/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-full bg-charcoal px-6 text-xs uppercase tracking-widest text-ivory transition hover:bg-plum disabled:opacity-50"
        >
          {busy ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {msg.text && (
        <p className={`mt-3 text-xs ${msg.isError ? 'text-red-600' : 'text-emerald-700'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
