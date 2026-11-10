// Browser helper for the dashboard screens: sends JSON, returns either the data or a plain-English error.
import { notify } from '@/lib/notify';

/** `pending: true` means an admin/manager change was NOT applied: it is waiting for the owner's approval. */
export type ApiResult<T = Record<string, unknown>> = { ok: true; data: T & { pending?: boolean; message?: string } } | { ok: false; error: string };

/** Which dashboard the person is on (owner, admin or manager), from the address bar. */
const portal = (): 'owner' | 'admin' | 'manager' => {
  const seg = typeof window === 'undefined' ? '' : window.location.pathname.split('/')[1];
  return seg === 'owner' || seg === 'manager' ? seg : 'admin';
};

export async function adminFetch<T = Record<string, unknown>>(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<ApiResult<T>> {
  try {
    const r = await fetch(url, { method, headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const d = await r.json().catch(() => ({})) as T & { error?: string; pending?: boolean; message?: string };
    // A full reload (not a client navigation) clears any stale screen; the person goes to THEIR OWN sign-in page.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (r.status === 401) { window.location.assign(`/${portal()}/login`); return { ok: false, error: 'Please sign in again.' }; }
    if (!r.ok) return { ok: false, error: d.error ?? 'Something went wrong. Please try again.' };
    if (d.pending) notify(d.message ?? 'Sent to the owner for approval.', 'pending');
    return { ok: true, data: d };
  } catch { return { ok: false, error: 'Could not reach the server. Check your connection and try again.' }; }
}
