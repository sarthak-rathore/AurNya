// Browser helper for the admin screens: sends JSON, returns either the data or a plain-English error.
export type ApiResult<T = Record<string, unknown>> = { ok: true; data: T } | { ok: false; error: string };

export async function adminFetch<T = Record<string, unknown>>(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<ApiResult<T>> {
  try {
    const r = await fetch(url, { method, headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const d = await r.json().catch(() => ({})) as T & { error?: string };
    // A full reload (not a client navigation) clears any stale admin screen.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (r.status === 401) { window.location.assign('/admin/login'); return { ok: false, error: 'Please sign in again.' }; }
    if (!r.ok) return { ok: false, error: d.error ?? 'Something went wrong. Please try again.' };
    return { ok: true, data: d };
  } catch { return { ok: false, error: 'Could not reach the server. Check your connection and try again.' }; }
}
