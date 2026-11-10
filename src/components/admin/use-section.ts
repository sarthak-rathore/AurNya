'use client';
import { useCallback, useState } from 'react';
import { adminFetch } from './api';
import { notify } from '@/lib/notify';

/**
 * State for a dashboard section that is saved on the server (see lib/sections.ts).
 * `commit(next)` sends the new value; the screen changes ONLY when the change was really applied.
 * When an admin/manager saves, the change goes to the owner for approval and the screen keeps showing the live (unchanged) data.
 * Returns 'applied' | 'pending' | 'error'.
 */
export function useSection<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [saving, setSaving] = useState(false);
  const commit = useCallback(async (next: T): Promise<'applied' | 'pending' | 'error'> => {
    setSaving(true);
    const r = await adminFetch(`/api/admin/section/${key}`, 'PUT', { value: next });
    setSaving(false);
    if (!r.ok) { notify(r.error, 'error'); return 'error'; }
    if (r.data.pending) return 'pending';       // adminFetch already showed the "sent for approval" notice
    setValue(next); return 'applied';
  }, [key]);
  return { value, commit, saving, setLocal: setValue };
}
