import type { WhatsappConfig } from './whatsapp-config';

/** Sends ONE WhatsApp message through the provider chosen in the environment. Never throws: the result says what happened. */
export type SendResult = { ok: true; id: string | null } | { ok: false; error: string; retryable: boolean };
export interface Outgoing { phone: string; template: string; params: string[]; text: string }
type Fetch = typeof fetch;

const TIMEOUT_MS = 10_000;
async function post(f: Fetch, url: string, init: RequestInit): Promise<{ status: number; json: Record<string, unknown> } | { networkError: string }> {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await f(url, { ...init, signal: ctl.signal, cache: 'no-store' });
    return { status: r.status, json: (await r.json().catch(() => ({}))) as Record<string, unknown> };
  } catch (e) { return { networkError: (e as Error).name === 'AbortError' ? 'WhatsApp did not answer in time.' : 'Could not reach WhatsApp.' }; }
  finally { clearTimeout(timer); }
}

/** Meta error codes that mean "try again later" rather than "this can never work". */
const META_RETRY = new Set([4, 17, 32, 613, 80007, 130429, 131048, 131056, 133016]);

export async function sendWhatsapp(cfg: WhatsappConfig, m: Outgoing, f: Fetch = fetch): Promise<SendResult> {
  if (cfg.provider === 'twilio') {
    const body = new URLSearchParams({ To: `whatsapp:+${m.phone}`, From: `whatsapp:${cfg.twilioFrom.startsWith('+') ? cfg.twilioFrom : `+${cfg.twilioFrom}`}`, Body: m.text });
    const r = await post(f, `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(cfg.twilioSid)}/Messages.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${cfg.twilioSid}:${cfg.twilioToken}`).toString('base64')}` }, body,
    });
    if ('networkError' in r) return { ok: false, error: r.networkError, retryable: true };
    if (r.status >= 200 && r.status < 300) return { ok: true, id: typeof r.json.sid === 'string' ? r.json.sid : null };
    return { ok: false, error: `Twilio: ${String(r.json.message ?? r.status)}`.slice(0, 300), retryable: r.status === 429 || r.status >= 500 };
  }

  const payload = cfg.mode === 'text'
    ? { messaging_product: 'whatsapp', to: m.phone, type: 'text', text: { body: m.text, preview_url: true } }
    : { messaging_product: 'whatsapp', to: m.phone, type: 'template', template: {
        name: cfg.templates[m.template as keyof typeof cfg.templates] ?? m.template, language: { code: cfg.lang },
        components: m.params.length ? [{ type: 'body', parameters: m.params.map((text) => ({ type: 'text', text })) }] : [],
      } };
  const r = await post(f, `${cfg.apiBase}/${cfg.apiVersion}/${encodeURIComponent(cfg.phoneNumberId)}/messages`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.token}` }, body: JSON.stringify(payload),
  });
  if ('networkError' in r) return { ok: false, error: r.networkError, retryable: true };
  if (r.status >= 200 && r.status < 300) {
    const msgs = r.json.messages as Array<{ id?: string }> | undefined;
    return { ok: true, id: msgs?.[0]?.id ?? null };
  }
  const e = (r.json.error ?? {}) as { message?: string; code?: number; error_data?: { details?: string } };
  const detail = e.error_data?.details ?? e.message ?? String(r.status);
  return { ok: false, error: `WhatsApp: ${detail}${e.code ? ` (code ${e.code})` : ''}`.slice(0, 300), retryable: r.status === 429 || r.status >= 500 || (e.code !== undefined && META_RETRY.has(e.code)) };
}
