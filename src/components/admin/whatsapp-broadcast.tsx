'use client';
import { useState } from 'react';
import { adminFetch } from './api';
import { useAction } from './use-action';

/** Send a custom WhatsApp message to every subscribed customer. (An admin's send waits for the owner's approval.) */
export function WhatsappBroadcast({ configured, subscribers }: { configured: boolean; subscribers: number }) {
  const [message, setMessage] = useState(''); const [href, setHref] = useState('');
  const act = useAction();
  return (
    <div className="rounded-2xl border border-white/5 bg-[#181521] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">WhatsApp message to customers</h2>
        <span className="text-[11px] text-[#8E869B]">{subscribers} subscribed customer{subscribers === 1 ? '' : 's'}</span>
      </div>
      <p className="mt-1 text-[11px] text-[#8E869B]">
        New coupons and announcement-bar changes are sent automatically. Use this for anything else (a flash sale, a new launch).
        {!configured && <span className="text-[#E5B558]"> WhatsApp is not switched on yet: add the keys in your environment file first.</span>}
      </p>
      <label className="mt-3 block text-[10px] font-semibold uppercase text-[#736B7F]" htmlFor="wa-msg">Message (max 240 characters)</label>
      <textarea id="wa-msg" value={message} maxLength={240} rows={3} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none" placeholder="Diwali sale is live: flat 20% off on all gold-plated jewellery till Sunday!" />
      <label className="mt-3 block text-[10px] font-semibold uppercase text-[#736B7F]" htmlFor="wa-href">Link (optional: /shop or https://…)</label>
      <input id="wa-href" value={href} onChange={(e) => setHref(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none" placeholder="/shop" />
      <div className="mt-3 flex items-center gap-3">
        <button type="button" disabled={act.busy || !message.trim()}
          onClick={() => { if (!confirm(`Send this message to ${subscribers} customer${subscribers === 1 ? '' : 's'}? It cannot be recalled.`)) return; void act.run(() => adminFetch('/api/admin/whatsapp/broadcast', 'POST', { message, href }), 'Queued ✓').then((ok) => { if (ok) setMessage(''); }); }}
          className="rounded-xl bg-[#D4A843] px-5 py-2 text-xs font-bold text-[#14121A] hover:bg-[#E5B558] disabled:opacity-50">{act.busy ? 'Sending…' : 'Send to customers'}</button>
        {act.message}
      </div>
    </div>
  );
}
