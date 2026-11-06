'use client';
import Link from 'next/link';
import { useState } from 'react';
import { adminFetch } from '@/components/admin/api';
import { btnOutline, input, td, th } from '@/components/admin/ui';
import { LOW_STOCK } from '@/lib/admin-format';

interface Line { key: string; productId: number; variantId: number | null; name: string; sku: string; option: string | null; stock: number; status: string }

function Row({ l }: { l: Line }) {
  const [stock, setStock] = useState(l.stock); const [draft, setDraft] = useState(String(l.stock)); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function send(mode: 'set' | 'add', value: number) {
    setBusy(true); setMsg(null);
    const r = await adminFetch<{ stock: number }>('/api/admin/inventory', 'PATCH', { productId: l.productId, variantId: l.variantId, mode, value }); setBusy(false);
    if (r.ok) { setStock(r.data.stock); setDraft(String(r.data.stock)); setMsg({ ok: true, t: 'Saved' }); setTimeout(() => setMsg(null), 2000); } else setMsg({ ok: false, t: r.error });
  }
  const dirty = draft !== String(stock) && draft.trim() !== '' && Number.isInteger(Number(draft)) && Number(draft) >= 0;
  return (
    <tr className={l.status !== 'active' ? 'opacity-60' : ''}>
      <td className={td}><Link href={`/admin/products/${l.productId}`} className="font-medium underline">{l.name}</Link>{l.option && <span className="block text-xs text-muted">{l.option}</span>}{l.status !== 'active' && <span className="block text-xs text-muted">{l.status}</span>}</td>
      <td className={`${td} text-muted`}>{l.sku}</td>
      <td className={`${td} font-medium ${stock === 0 ? 'text-danger' : stock <= LOW_STOCK ? 'text-gold-ink' : ''}`}>{stock === 0 ? 'Sold out' : stock}</td>
      <td className={td}>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" aria-label={`Remove one ${l.name}`} disabled={busy || stock < 1} onClick={() => send('add', -1)} className={`${btnOutline} !px-3 !py-1.5`}>−</button>
          <button type="button" aria-label={`Add one ${l.name}`} disabled={busy} onClick={() => send('add', 1)} className={`${btnOutline} !px-3 !py-1.5`}>+</button>
          <label className="sr-only" htmlFor={`s-${l.key}`}>Set stock for {l.name} {l.option ?? ''}</label>
          <input id={`s-${l.key}`} type="number" min={0} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && dirty) send('set', Number(draft)); }} className={`${input} !w-20 !py-1.5`} />
          <button type="button" disabled={busy || !dirty} onClick={() => send('set', Number(draft))} className={`${btnOutline} !py-1.5`}>Save</button>
          <span role="status" aria-live="polite" className={`text-xs ${msg?.ok ? 'text-success' : 'text-danger'}`}>{msg?.t}</span>
        </div>
      </td>
    </tr>
  );
}

export function StockTable({ lines }: { lines: Line[] }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Item</th><th className={th}>SKU</th><th className={th}>In stock</th><th className={th}>Change</th></tr></thead><tbody className="divide-y divide-charcoal/10">{lines.map((l) => <Row key={l.key} l={l} />)}</tbody></table></div>;
}
