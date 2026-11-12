'use client';

import { useState, useEffect } from 'react';

type CookiePrefs = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  performance: boolean;
};

const STORAGE_KEY = 'aurnya_cookie_prefs';

export function CookieSettingsClient() {
  const [prefs, setPrefs] = useState<CookiePrefs>({
    essential: true,
    analytics: false,
    marketing: false,
    performance: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrefs({ ...JSON.parse(stored), essential: true });
      }
    } catch {}
  }, []);

  const toggle = (key: keyof CookiePrefs) => {
    if (key === 'essential') return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
    setSaved(true);
  };

  const acceptAll = () => {
    const all = { essential: true, analytics: true, marketing: true, performance: true };
    setPrefs(all);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {}
    setSaved(true);
  };

  const rejectAll = () => {
    const min = { essential: true, analytics: false, marketing: false, performance: false };
    setPrefs(min);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(min));
    } catch {}
    setSaved(true);
  };

  const categories = [
    {
      key: 'essential' as const,
      label: 'Essential Cookies',
      description: 'Strictly necessary for security, session authentication, and smooth cart and checkout operations. Cannot be disabled.',
      required: true,
    },
    {
      key: 'analytics' as const,
      label: 'Analytics Cookies',
      description: 'Anonymised telemetry to help us improve page loading times, boutique browsing navigation, and product discovery.',
      required: false,
    },
    {
      key: 'marketing' as const,
      label: 'Marketing & Personalisation',
      description: 'Tailors product suggestions and notifies you of seasonal capsule jewellery drops according to your style interests.',
      required: false,
    },
    {
      key: 'performance' as const,
      label: 'Performance Cookies',
      description: 'Helps us verify site elasticity, monitor network CDN response times, and prevent layout shifts.',
      required: false,
    },
  ];

  return (
    <div>
      <p className="mb-6 leading-relaxed">
        Manage your privacy and cookie preferences below. AurNya honours your right to personal data sovereignty in strict compliance with the Digital Personal Data Protection Act (DPDP Act, 2023) and GDPR. Essential cookies remain active to power your secure shopping bag and checkout.
      </p>

      <div className="space-y-4">
        {categories.map(({ key, label, description, required }) => (
          <div
            key={key}
            className="flex items-start justify-between gap-4 rounded-xl border border-[#e4d2a8]/30 bg-surface p-5 shadow-sm"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-medium text-charcoal">{label}</h3>
                {required && (
                  <span className="rounded-full bg-[#e4d2a8]/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#211a28]">
                    Always Active
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted leading-relaxed">{description}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={required}
              aria-label={`Toggle ${label}`}
              className={`relative mt-1 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                prefs[key] ? 'bg-[#211a28]' : 'bg-charcoal/20'
              } ${required ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  prefs[key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="rounded-full bg-[#211a28] px-7 py-3 text-xs font-semibold uppercase tracking-widest text-[#fbf7ee] transition hover:bg-[#34293f] shadow"
        >
          Save Preferences
        </button>
        <button
          type="button"
          onClick={acceptAll}
          className="rounded-full border border-charcoal/30 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-charcoal transition hover:border-[#211a28] hover:bg-surface"
        >
          Accept All
        </button>
        <button
          type="button"
          onClick={rejectAll}
          className="rounded-full border border-charcoal/20 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-muted transition hover:border-charcoal/40"
        >
          Reject Optional
        </button>
      </div>

      {saved && (
        <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800">
          ✓ Your privacy preferences have been updated and securely stored on this device.
        </div>
      )}

      <p className="mt-8 text-xs text-muted">
        For more information, see our <a href="/info/cookie-policy" className="underline underline-offset-2 hover:text-charcoal">Cookie Policy</a> and <a href="/info/privacy-notice" className="underline underline-offset-2 hover:text-charcoal">Privacy Notice</a>.
      </p>
    </div>
  );
}
