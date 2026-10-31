'use client';
import { useState } from 'react';
import { estimatedDeliveryRange } from '@/lib/shipping';

export function PincodeChecker() {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<{ checked: boolean; valid: boolean; message: string; dateRange?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const clean = pincode.trim();
    if (!/^\d{6}$/.test(clean)) {
      setResult({ checked: true, valid: false, message: 'Please enter a valid 6-digit Indian PIN code.' });
      return;
    }

    setChecking(true);
    // Instant real estimation
    setTimeout(() => {
      const dates = estimatedDeliveryRange();
      setChecking(false);
      setResult({
        checked: true,
        valid: true,
        message: `Delivery available to ${clean}`,
        dateRange: `${dates.from} – ${dates.to}`,
      });
    }, 200);
  }

  return (
    <div className="mt-6 border-t border-charcoal/10 pt-5">
      <form onSubmit={handleCheck} aria-describedby="pin-note">
        <label htmlFor="pin" className="mb-2 block text-xs uppercase tracking-widest font-semibold text-[#832729]">
          Delivery PIN code &amp; Estimates
        </label>
        <div className="flex max-w-sm gap-2">
          <input
            id="pin"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value);
              if (result) setResult(null);
            }}
            placeholder="e.g. 400001 or 110001"
            className="w-48 rounded-full border border-charcoal/30 bg-surface px-4 py-2 text-sm text-[#1f1a24] font-medium placeholder:text-stone-500 focus:border-[#832729] focus:outline-none"
          />
          <button
            type="submit"
            disabled={checking}
            className="rounded-full border border-charcoal px-5 py-2 text-xs uppercase tracking-widest transition hover:bg-charcoal hover:text-ivory disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Check'}
          </button>
        </div>
      </form>

      {result && (
        <div className={`mt-3 rounded-2xl p-3.5 text-xs transition animate-up ${result.valid ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-700'}`}>
          <p className="font-medium">{result.message}</p>
          {result.valid && (
            <div className="mt-1 space-y-0.5 text-emerald-800">
              <p>🚚 Expected Delivery: <strong>{result.dateRange}</strong> (Express 3–7 business days)</p>
              <p>🎁 Complimentary luxury gift-box packaging included</p>
              <p>✨ Free Shipping on orders ₹999 &amp; above · Cash on Delivery available</p>
            </div>
          )}
        </div>
      )}

      {!result && (
        <p id="pin-note" className="mt-2 text-xs text-muted">
          Enter your 6-digit PIN code to check instant delivery dates &amp; COD availability.
        </p>
      )}
    </div>
  );
}
