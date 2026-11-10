/*
 * WhatsApp settings, read ONLY from environment variables (the owner's one and only job is the .env file).
 * Pure: no Next.js imports, easy to test.
 *
 *   Meta WhatsApp Cloud API (recommended):  WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID
 *   Twilio (alternative):                   TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM
 * Leave them all empty and WhatsApp is simply switched off (everything else keeps working).
 */
type Env = Record<string, string | undefined>;
export type WhatsappProvider = 'meta' | 'twilio';
export interface WhatsappConfig {
  provider: WhatsappProvider;
  /** meta only: "template" (default, required by WhatsApp for first contact) or "text" (only reaches people who messaged you in the last 24 hours; handy for testing). */
  mode: 'template' | 'text';
  token: string; phoneNumberId: string;
  twilioSid: string; twilioToken: string; twilioFrom: string;
  lang: string; brand: string; defaultCountryCode: string;
  templates: { welcome: string; order: string; offer: string; sale: string };
  apiVersion: string;
  /** Only changes for testing against a fake server. */
  apiBase: string;
}
export type WhatsappConfigResult = { ok: true; config: WhatsappConfig } | { ok: false; reason: string; missing: string[] };

const t = (v: string | undefined) => (v ?? '').trim();

export function readWhatsappConfig(env: Env = process.env): WhatsappConfigResult {
  const wanted = t(env.WHATSAPP_PROVIDER).toLowerCase();
  const hasMeta = !!(t(env.WHATSAPP_TOKEN) || t(env.WHATSAPP_PHONE_NUMBER_ID));
  const hasTwilio = !!(t(env.TWILIO_ACCOUNT_SID) || t(env.TWILIO_AUTH_TOKEN));
  const provider: WhatsappProvider | null = wanted === 'meta' || wanted === 'twilio' ? wanted : hasMeta ? 'meta' : hasTwilio ? 'twilio' : null;
  if (!provider) return { ok: false, reason: 'WhatsApp is switched off. Add WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID (Meta) or the TWILIO_* keys to your environment variables.', missing: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'] };

  const missing: string[] = [];
  if (provider === 'meta') { if (!t(env.WHATSAPP_TOKEN)) missing.push('WHATSAPP_TOKEN'); if (!t(env.WHATSAPP_PHONE_NUMBER_ID)) missing.push('WHATSAPP_PHONE_NUMBER_ID'); }
  else { if (!t(env.TWILIO_ACCOUNT_SID)) missing.push('TWILIO_ACCOUNT_SID'); if (!t(env.TWILIO_AUTH_TOKEN)) missing.push('TWILIO_AUTH_TOKEN'); if (!t(env.TWILIO_WHATSAPP_FROM)) missing.push('TWILIO_WHATSAPP_FROM'); }
  if (missing.length) return { ok: false, reason: `WhatsApp (${provider}) is half set up. Still missing: ${missing.join(', ')}.`, missing };

  return {
    ok: true,
    config: {
      provider, mode: t(env.WHATSAPP_MODE).toLowerCase() === 'text' ? 'text' : 'template',
      token: t(env.WHATSAPP_TOKEN), phoneNumberId: t(env.WHATSAPP_PHONE_NUMBER_ID),
      twilioSid: t(env.TWILIO_ACCOUNT_SID), twilioToken: t(env.TWILIO_AUTH_TOKEN),
      twilioFrom: t(env.TWILIO_WHATSAPP_FROM).replace(/^whatsapp:/i, '').replace(/\s+/g, ''),
      lang: t(env.WHATSAPP_TEMPLATE_LANG) || 'en', brand: t(env.WHATSAPP_BRAND) || 'AurNya',
      defaultCountryCode: t(env.WHATSAPP_DEFAULT_COUNTRY_CODE).replace(/\D/g, '') || '91',
      apiVersion: t(env.WHATSAPP_API_VERSION) || 'v21.0',
      apiBase: (t(env.WHATSAPP_API_BASE) || 'https://graph.facebook.com').replace(/\/$/, ''),
      templates: {
        welcome: t(env.WHATSAPP_TEMPLATE_WELCOME) || 'aurnya_welcome',
        order: t(env.WHATSAPP_TEMPLATE_ORDER) || 'aurnya_order_update',
        offer: t(env.WHATSAPP_TEMPLATE_OFFER) || 'aurnya_offer',
        sale: t(env.WHATSAPP_TEMPLATE_SALE) || 'aurnya_sale',
      },
    },
  };
}

/** The default country code used to complete phone numbers typed without one (works even when WhatsApp itself is not configured). */
export const defaultCountryCode = (env: Env = process.env): string => t(env.WHATSAPP_DEFAULT_COUNTRY_CODE).replace(/\D/g, '') || '91';
