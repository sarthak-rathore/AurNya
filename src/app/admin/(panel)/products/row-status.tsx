'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/components/admin/api';
import { input } from '@/components/admin/ui';

/** A small drop-down in the products table that changes a product's status in one click. */
export function RowStatus({ id, status }: { id: number; status: 'draft' | 'active' | 'archived' }) {
  const router = useRouter(); const [v, setV] = useState(status); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function change(next: typeof status) {
    const prev = v; setV(next); setBusy(true); setErr('');
    const r = await adminFetch(`/api/admin/products/${id}`, 'PATCH', { status: next }); setBusy(false);
    if (!r.ok) { setV(prev); setErr(r.error); } else router.refresh();
  }
  return <><label className="sr-only" htmlFor={`rs${id}`}>Status</label><select id={`rs${id}`} value={v} disabled={busy} onChange={(e) => change(e.target.value as typeof status)} className={`${input} !w-auto !py-1.5`}><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>{err && <span role="alert" className="block text-xs text-danger">{err}</span>}</>;
}
