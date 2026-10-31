/**
 * Shipping cost calculation for AurNya.
 *
 * Rules (Phase 5):
 *   - Free shipping on orders with subtotal ≥ ₹999 (99900 paise)
 *   - Flat ₹99 (9900 paise) otherwise
 *   - COD surcharge: additional ₹49 (4900 paise)
 */

export const FREE_SHIPPING_THRESHOLD_PAISE = 99900; // ₹999
export const FLAT_RATE_PAISE = 9900;                // ₹99
export const COD_SURCHARGE_PAISE = 4900;            // ₹49

export type PaymentMethod = 'razorpay' | 'cod';

export interface ShippingResult {
  shippingPaise: number;
  isFreeShipping: boolean;
  codSurchargePaise: number;
  label: string;
}

export function calculateShipping(subtotalPaise: number, paymentMethod: PaymentMethod = 'razorpay'): ShippingResult {
  const isFreeShipping = subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE;
  const baseShipping = isFreeShipping ? 0 : FLAT_RATE_PAISE;
  const codSurchargePaise = paymentMethod === 'cod' ? COD_SURCHARGE_PAISE : 0;
  const shippingPaise = baseShipping + codSurchargePaise;

  let label: string;
  if (isFreeShipping && paymentMethod !== 'cod') {
    label = 'Free shipping';
  } else if (isFreeShipping && paymentMethod === 'cod') {
    label = `COD surcharge ₹${(COD_SURCHARGE_PAISE / 100).toFixed(0)}`;
  } else if (paymentMethod === 'cod') {
    label = `Shipping ₹${(baseShipping / 100).toFixed(0)} + COD ₹${(COD_SURCHARGE_PAISE / 100).toFixed(0)}`;
  } else {
    label = `Shipping ₹${(baseShipping / 100).toFixed(0)}`;
  }

  return { shippingPaise, isFreeShipping, codSurchargePaise, label };
}

/** Estimated delivery: 3–7 business days (skips weekends). */
export function estimatedDeliveryRange(from: Date = new Date()): { from: string; to: string } {
  const addBusinessDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) added++; // skip Sunday(0) and Saturday(6)
    }
    return d;
  };

  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return {
    from: fmt(addBusinessDays(from, 3)),
    to: fmt(addBusinessDays(from, 7)),
  };
}
