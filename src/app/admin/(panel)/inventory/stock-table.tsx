'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/components/admin/api';
import { td, th } from '@/components/admin/ui';
import { LOW_STOCK } from '@/lib/admin-format';

interface Line {
  key: string;
  productId: number;
  variantId: number | null;
  name: string;
  sku: string;
  option: string | null;
  stock: number;
  status: string;
}

function Row({ l }: { l: Line }) {
  const seg = (usePathname() || '').split('/')[1];
  const [stock, setStock] = useState(l.stock);
  const [draft, setDraft] = useState(String(l.stock));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function send(mode: 'set' | 'add', value: number) {
    setBusy(true);
    setMsg(null);
    const r = await adminFetch<{ stock: number }>('/api/admin/inventory', 'PATCH', {
      productId: l.productId,
      variantId: l.variantId,
      mode,
      value,
    });
    setBusy(false);
    if (r.ok && r.data.pending) {
      setDraft(String(stock));
      setMsg({ ok: true, t: 'Sent to the owner for approval ⏳' });
      setTimeout(() => setMsg(null), 6000);
    } else if (r.ok) {
      setStock(r.data.stock);
      setDraft(String(r.data.stock));
      setMsg({ ok: true, t: 'Saved ✓' });
      setTimeout(() => setMsg(null), 2500);
    } else {
      setMsg({ ok: false, t: r.error });
    }
  }

  const dirty =
    draft !== String(stock) &&
    draft.trim() !== '' &&
    Number.isInteger(Number(draft)) &&
    Number(draft) >= 0;

  return (
    <tr className={`hover:bg-white/[0.02] transition-colors ${l.status !== 'active' ? 'opacity-60' : ''}`}>
      <td className={td}>
        <Link
          href={seg === 'manager' ? '/manager/products' : `/${seg === 'owner' ? 'owner' : 'admin'}/products/${l.productId}`}
          className="font-semibold text-white hover:text-[#D4A843] transition-colors"
        >
          {l.name}
        </Link>
        {l.option && <span className="block text-[11px] text-[#A59CB0] mt-0.5">Size / Option: {l.option}</span>}
        {l.status !== 'active' && (
          <span className="block text-[10px] text-amber-400 capitalize mt-0.5">{l.status}</span>
        )}
      </td>
      <td className={`${td} font-mono text-[#736B7F]`}>{l.sku}</td>
      <td className={td}>
        <span
          className={`font-semibold ${
            stock === 0
              ? 'text-red-400 font-bold'
              : stock <= LOW_STOCK
              ? 'text-[#E5B558]'
              : 'text-[#4ADE80]'
          }`}
        >
          {stock === 0 ? 'Sold out (0)' : `${stock} in stock`}
        </span>
      </td>
      <td className={td}>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-label={`Remove one ${l.name}`}
            disabled={busy || stock < 1}
            onClick={() => send('add', -1)}
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1 text-xs text-white transition-colors"
          >
            −
          </button>
          <button
            type="button"
            aria-label={`Add one ${l.name}`}
            disabled={busy}
            onClick={() => send('add', 1)}
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1 text-xs text-white transition-colors"
          >
            +
          </button>
          <label className="sr-only" htmlFor={`s-${l.key}`}>
            Set stock for {l.name} {l.option ?? ''}
          </label>
          <input
            id={`s-${l.key}`}
            type="number"
            min={0}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && dirty) send('set', Number(draft));
            }}
            className="w-20 rounded-lg border border-white/10 bg-[#121018] px-2.5 py-1 text-xs text-white text-center font-bold focus:border-[#D4A843] focus:outline-none"
          />
          <button
            type="button"
            disabled={busy || !dirty}
            onClick={() => send('set', Number(draft))}
            className="rounded-lg bg-[#D4A843] hover:bg-[#E5B558] disabled:opacity-30 text-[#14121A] text-xs font-bold px-3 py-1 transition-all"
          >
            Save
          </button>
          {msg && (
            <span
              role="status"
              className={`text-[11px] font-semibold ml-1.5 ${
                msg.ok ? 'text-[#4ADE80]' : 'text-red-400'
              }`}
            >
              {msg.t}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

export function StockTable({ lines }: { lines: Line[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="border-b border-white/5 bg-[#14121A]/50">
          <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
            <th className={th}>Item &amp; Variant</th>
            <th className={th}>SKU</th>
            <th className={th}>In Stock</th>
            <th className={th}>Adjust Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {lines.map((l) => (
            <Row key={l.key} l={l} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
