'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useShop } from '@/store/shop-context';
import { useAuth } from '@/store/auth-context';
import { formatINR } from '@/lib/money';
import { subtotal } from '@/lib/cart';
import type { Quote } from '@/lib/quote';
import type { UserAddress } from '@/lib/types';

/* ── Style constants ─────────────────────────────────────────────────── */
const inp = 'w-full rounded-xl border border-charcoal/20 bg-surface px-4 py-3 text-sm placeholder:text-muted focus:border-charcoal/50 focus:outline-none';
const lbl = 'block mb-1 text-xs uppercase tracking-[.12em] text-muted';
const solidBtn = 'w-full rounded-full bg-charcoal py-3.5 text-xs uppercase tracking-widest text-ivory transition hover:bg-plum disabled:opacity-40';
const outlineBtn = 'rounded-full border border-charcoal px-5 py-2 text-xs uppercase tracking-widest transition hover:bg-charcoal hover:text-ivory';

/* ── Types ───────────────────────────────────────────────────────────── */
type Step = 'address' | 'payment' | 'review';
type PaymentMethod = 'razorpay' | 'cod';

interface AddressForm {
  recipientName: string; line1: string; line2: string;
  city: string; state: string; pincode: string; country: string; phone: string;
}

const emptyAddr: AddressForm = {
  recipientName: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', phone: '',
};

/* ── Shipping helpers (mirrors server-side logic) ─────────────────────── */
const FREE_THRESHOLD = 99900;
const FLAT_RATE = 9900;
const COD_SURCHARGE = 4900;

function calcShipping(subtotalPaise: number, method: PaymentMethod) {
  const isFree = subtotalPaise >= FREE_THRESHOLD;
  const base = isFree ? 0 : FLAT_RATE;
  const cod = method === 'cod' ? COD_SURCHARGE : 0;
  return { shipping: base + cod, isFree, label: isFree && method !== 'cod' ? 'Free' : formatINR(base + cod) };
}

/* ── Razorpay window type ────────────────────────────────────────────── */
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open(): void; on(event: string, cb: () => void): void };
  }
}

/* ── Component ───────────────────────────────────────────────────────── */
export function CheckoutClient() {
  const { lines, count, coupon, replaceLines } = useShop();
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('address');
  const [email, setEmail] = useState(user?.email ?? '');
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('new');
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null);
  const [addrForm, setAddrForm] = useState<AddressForm>(emptyAddr);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState(0);
  const idempotencyKey = useRef(crypto.randomUUID());

  // Redirect if cart is empty
  useEffect(() => {
    if (count === 0 && !orderId) router.replace('/shop');
  }, [count, orderId, router]);

  // Load saved addresses for logged-in users
  useEffect(() => {
    if (!user) return;
    fetch('/api/account/addresses')
      .then(r => r.json() as Promise<{ addresses: UserAddress[] }>)
      .then(d => {
        setSavedAddresses(d.addresses ?? []);
        if (d.addresses?.length > 0) {
          setAddressMode('saved');
          const def = d.addresses.find(a => a.isDefault) ?? d.addresses[0];
          if (def) setSelectedAddrId(def.id);
        }
      })
      .catch(() => {});
  }, [user]);

  // Fetch quote
  useEffect(() => {
    if (lines.length === 0) return;
    setQuoteLoading(true);
    fetch('/api/cart/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: lines.map(l => ({ productId: l.productId, variant: l.variant, qty: l.qty, expectedUnitPricePaise: l.pricePaise })), coupon }),
    })
      .then(r => r.json() as Promise<Quote>)
      .then(q => setQuote(q))
      .catch(() => {})
      .finally(() => setQuoteLoading(false));
  }, [lines, coupon]);

  const shippingCalc = useMemo(() => calcShipping(quote?.subtotalPaise ?? subtotal(lines), paymentMethod), [quote, lines, paymentMethod]);
  const subtotalPaise = quote?.subtotalPaise ?? subtotal(lines);
  const discountPaise = quote?.discountPaise ?? 0;
  const taxPaise = 0;
  const totalPaise = subtotalPaise - discountPaise + shippingCalc.shipping + taxPaise;

  /* ── Active address (saved or form) ──── */
  const activeAddress = useMemo((): AddressForm | null => {
    if (addressMode === 'saved' && selectedAddrId !== null) {
      const a = savedAddresses.find(x => x.id === selectedAddrId);
      if (!a) return null;
      return { recipientName: a.recipientName, line1: a.line1, line2: a.line2 ?? '', city: a.city, state: a.state, pincode: a.pincode, country: a.country, phone: a.phone ?? '' };
    }
    return addrForm;
  }, [addressMode, selectedAddrId, savedAddresses, addrForm]);

  /* ── Address step submit ──── */
  function handleAddressNext(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setError('');
    setStep('payment');
  }

  /* ── Place order ──── */
  async function placeOrder() {
    if (!activeAddress) { setError('Please provide a shipping address.'); return; }
    setBusy(true); setError('');

    const payload = {
      email,
      phone: activeAddress.phone || undefined,
      shippingAddress: {
        recipientName: activeAddress.recipientName,
        line1: activeAddress.line1,
        line2: activeAddress.line2 || null,
        city: activeAddress.city,
        state: activeAddress.state,
        pincode: activeAddress.pincode,
        country: activeAddress.country || 'India',
        phone: activeAddress.phone || null,
      },
      lines: lines.map(l => ({ productId: l.productId, variant: l.variant, qty: l.qty, expectedUnitPricePaise: l.pricePaise })),
      coupon,
      paymentMethod,
      idempotencyKey: idempotencyKey.current,
    };

    try {
      const r = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json() as { orderId?: string; orderNumber?: number; error?: string };
      if (!r.ok) { setError(d.error ?? 'Could not place order. Please try again.'); setBusy(false); return; }

      const newOrderId = d.orderId!;
      const newOrderNumber = d.orderNumber!;
      setOrderId(newOrderId);
      setOrderNumber(newOrderNumber);

      if (paymentMethod === 'cod') {
        // Clear cart and redirect
        replaceLines([]);
        router.push(`/order/${newOrderId}?placed=1`);
        return;
      }

      // Razorpay payment flow
      await initiateRazorpay(newOrderId, newOrderNumber);
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  async function initiateRazorpay(newOrderId: string, newOrderNumber: number) {
    try {
      // Create Razorpay order on server
      const r = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: newOrderId }),
      });
      const d = await r.json() as { razorpayOrderId?: string; amount?: number; currency?: string; keyId?: string; error?: string };
      if (!r.ok) { setError(d.error ?? 'Could not initiate payment.'); setBusy(false); return; }

      // Load Razorpay checkout script
      await loadRazorpayScript();

      if (!window.Razorpay) { setError('Payment window failed to load. Try COD or refresh.'); setBusy(false); return; }

      const rzp = new window.Razorpay({
        key: d.keyId,
        amount: d.amount,
        currency: d.currency,
        name: 'AurNya',
        description: `Order #${newOrderNumber}`,
        order_id: d.razorpayOrderId,
        prefill: { email, contact: activeAddress?.phone ?? '' },
        theme: { color: '#2c2c2c' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // Verify on server
          const vr = await fetch('/api/payments/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: newOrderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          if (vr.ok) {
            replaceLines([]);
            router.push(`/order/${newOrderId}?placed=1`);
          } else {
            setError('Payment went through but verification failed. Contact support with order #' + newOrderNumber);
            setBusy(false);
          }
        },
      });

      rzp.on('payment.failed', () => {
        setError('Payment was unsuccessful. Please try again or choose COD.');
        setBusy(false);
      });

      rzp.open();
    } catch {
      setError('Could not open payment window. Please try COD or contact support.');
      setBusy(false);
    }
  }

  function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="razorpay"]')) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  /* ── Render ──── */
  const razorpayEnabled = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || true; // always show; server will error if not configured

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-10">
      <div className="mb-8">
        <Link href="/shop" className="text-xs uppercase tracking-[.12em] text-muted hover:text-charcoal">← Continue shopping</Link>
        <h1 className="mt-3 font-serif text-5xl">Checkout</h1>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex gap-6">
        {(['address', 'payment', 'review'] as Step[]).map((s, i) => (
          <button key={s} onClick={() => step !== 'address' || s === 'address' ? (i < ['address', 'payment', 'review'].indexOf(step) ? setStep(s) : undefined) : undefined}
            className={`flex items-center gap-2 text-xs uppercase tracking-[.12em] ${step === s ? 'text-charcoal font-medium' : i < ['address', 'payment', 'review'].indexOf(step) ? 'text-muted cursor-pointer underline' : 'text-muted/50'}`}>
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${step === s ? 'bg-charcoal text-ivory' : i < ['address', 'payment', 'review'].indexOf(step) ? 'bg-muted/30' : 'bg-muted/10'}`}>{i + 1}</span>
            {s === 'address' ? 'Shipping' : s === 'payment' ? 'Payment' : 'Review'}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: form steps */}
        <div className="space-y-6">

          {/* ── STEP 1: Address ── */}
          {step === 'address' && (
            <section className="rounded-3xl border border-charcoal/10 bg-ivory p-6 md:p-8">
              <h2 className="mb-6 font-serif text-3xl">Shipping information</h2>

              <form onSubmit={handleAddressNext} className="space-y-4">
                {/* Email */}
                <div>
                  <label className={lbl} htmlFor="chk-email">Email address *</label>
                  <input id="chk-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inp} placeholder="you@example.com" />
                </div>

                {/* Saved addresses (logged-in users) */}
                {user && savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setAddressMode('saved')} className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest ${addressMode === 'saved' ? 'bg-charcoal text-ivory' : 'border border-charcoal/20'}`}>Saved address</button>
                      <button type="button" onClick={() => setAddressMode('new')} className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest ${addressMode === 'new' ? 'bg-charcoal text-ivory' : 'border border-charcoal/20'}`}>New address</button>
                    </div>
                    {addressMode === 'saved' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {savedAddresses.map(a => (
                          <button key={a.id} type="button" onClick={() => setSelectedAddrId(a.id)}
                            className={`rounded-2xl border p-4 text-left text-sm transition ${selectedAddrId === a.id ? 'border-charcoal bg-charcoal/5' : 'border-charcoal/10 hover:border-charcoal/30'}`}>
                            <p className="font-medium">{a.recipientName}</p>
                            <p className="text-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                            <p className="text-muted">{a.city}, {a.state} {a.pincode}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* New address form */}
                {(addressMode === 'new' || !user || savedAddresses.length === 0) && (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><label className={lbl}>Recipient name *</label><input required value={addrForm.recipientName} onChange={e => setAddrForm(p => ({ ...p, recipientName: e.target.value }))} className={inp} /></div>
                      <div><label className={lbl}>Phone</label><input type="tel" value={addrForm.phone} onChange={e => setAddrForm(p => ({ ...p, phone: e.target.value }))} className={inp} /></div>
                    </div>
                    <div><label className={lbl}>Address line 1 *</label><input required value={addrForm.line1} onChange={e => setAddrForm(p => ({ ...p, line1: e.target.value }))} className={inp} /></div>
                    <div><label className={lbl}>Address line 2</label><input value={addrForm.line2} onChange={e => setAddrForm(p => ({ ...p, line2: e.target.value }))} className={inp} /></div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div><label className={lbl}>City *</label><input required value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))} className={inp} /></div>
                      <div><label className={lbl}>State *</label><input required value={addrForm.state} onChange={e => setAddrForm(p => ({ ...p, state: e.target.value }))} className={inp} /></div>
                      <div><label className={lbl}>Pincode *</label><input required pattern="\d{6}" maxLength={6} value={addrForm.pincode} onChange={e => setAddrForm(p => ({ ...p, pincode: e.target.value }))} className={inp} /></div>
                    </div>
                  </div>
                )}

                {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                <button type="submit" className={solidBtn}>Continue to payment →</button>
              </form>
            </section>
          )}

          {/* ── STEP 2: Payment method ── */}
          {step === 'payment' && (
            <section className="rounded-3xl border border-charcoal/10 bg-ivory p-6 md:p-8">
              <h2 className="mb-6 font-serif text-3xl">Payment method</h2>
              <div className="space-y-3">
                <button type="button" onClick={() => setPaymentMethod('razorpay')}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${paymentMethod === 'razorpay' ? 'border-charcoal bg-charcoal/5' : 'border-charcoal/10 hover:border-charcoal/30'}`}>
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${paymentMethod === 'razorpay' ? 'border-charcoal' : 'border-charcoal/20'}`}>
                    {paymentMethod === 'razorpay' && <span className="h-2.5 w-2.5 rounded-full bg-charcoal" />}
                  </span>
                  <div>
                    <p className="font-medium">Pay online</p>
                    <p className="text-sm text-muted">UPI, cards, net banking via Razorpay. Secure and instant.</p>
                    <div className="mt-2 flex gap-2 text-xs text-muted">
                      {['UPI', 'Visa', 'Mastercard', 'Net Banking', 'Wallets'].map(m => (
                        <span key={m} className="rounded bg-surface px-2 py-0.5">{m}</span>
                      ))}
                    </div>
                  </div>
                </button>

                <button type="button" onClick={() => setPaymentMethod('cod')}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${paymentMethod === 'cod' ? 'border-charcoal bg-charcoal/5' : 'border-charcoal/10 hover:border-charcoal/30'}`}>
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${paymentMethod === 'cod' ? 'border-charcoal' : 'border-charcoal/20'}`}>
                    {paymentMethod === 'cod' && <span className="h-2.5 w-2.5 rounded-full bg-charcoal" />}
                  </span>
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-muted">Pay when your order arrives. Extra charge of {formatINR(COD_SURCHARGE)} applies.</p>
                  </div>
                </button>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep('address')} className={outlineBtn}>← Back</button>
                <button type="button" onClick={() => setStep('review')} className="flex-1 rounded-full bg-charcoal py-3 text-xs uppercase tracking-widest text-ivory hover:bg-plum">Review order →</button>
              </div>
            </section>
          )}

          {/* ── STEP 3: Review & place ── */}
          {step === 'review' && (
            <section className="rounded-3xl border border-charcoal/10 bg-ivory p-6 md:p-8">
              <h2 className="mb-6 font-serif text-3xl">Review your order</h2>

              {/* Items */}
              <div className="mb-6">
                <p className={lbl + ' mb-3'}>Items ({count})</p>
                <ul className="divide-y divide-charcoal/10">
                  {(quote?.lines ?? lines).map(l => {
                    const ql = quote?.lines.find(x => x.productId === ('productId' in l ? l.productId : 0) && x.variant === l.variant);
                    const name = 'name' in l ? l.name : ql?.name ?? '—';
                    const variant = 'variant' in l ? l.variant : null;
                    const qty = 'qty' in l ? l.qty : 1;
                    const price = ql ? ql.lineTotalPaise : ('pricePaise' in l ? l.pricePaise * qty : 0);
                    return (
                      <li key={`${('productId' in l ? l.productId : 0)}-${variant}`} className="flex justify-between py-3 text-sm">
                        <span>{name}{variant ? ` · Size ${variant}` : ''} × {qty}</span>
                        <span>{formatINR(price)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Shipping address summary */}
              {activeAddress && (
                <div className="mb-6 rounded-2xl bg-surface p-4">
                  <p className={lbl + ' mb-1'}>Ships to</p>
                  <p className="text-sm">{activeAddress.recipientName}</p>
                  <p className="text-sm text-muted">{activeAddress.line1}{activeAddress.line2 ? `, ${activeAddress.line2}` : ''}</p>
                  <p className="text-sm text-muted">{activeAddress.city}, {activeAddress.state} {activeAddress.pincode}</p>
                </div>
              )}

              {/* Payment summary */}
              <div className="mb-6 rounded-2xl bg-surface p-4">
                <p className={lbl + ' mb-1'}>Payment</p>
                <p className="text-sm">{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay online (Razorpay)'}</p>
              </div>

              {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('payment')} className={outlineBtn}>← Back</button>
                <button type="button" onClick={placeOrder} disabled={busy} className="flex-1 rounded-full bg-charcoal py-3.5 text-xs uppercase tracking-widest text-ivory hover:bg-plum disabled:opacity-40">
                  {busy ? 'Placing order…' : paymentMethod === 'cod' ? 'Place order (COD)' : 'Pay now →'}
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-muted">By placing your order you agree to our Terms of Service and Privacy Policy.</p>
            </section>
          )}
        </div>

        {/* Right: order summary */}
        <aside>
          <div className="sticky top-24 rounded-3xl border border-charcoal/10 bg-ivory p-6">
            <h3 className="mb-4 font-serif text-2xl">Order summary</h3>
            {quoteLoading && <p className="text-sm text-muted">Checking prices…</p>}
            <ul className="mb-4 divide-y divide-charcoal/10">
              {lines.map(l => (
                <li key={`${l.productId}-${l.variant}`} className="flex justify-between py-2 text-sm">
                  <span className="text-muted">{l.name}{l.variant ? ` · ${l.variant}` : ''} × {l.qty}</span>
                  <span>{formatINR(l.pricePaise * l.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-charcoal/10 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatINR(subtotalPaise)}</span></div>
              {discountPaise > 0 && <div className="flex justify-between text-success"><span>Discount ({quote?.coupon.code})</span><span>−{formatINR(discountPaise)}</span></div>}
              <div className="flex justify-between">
                <span className="text-muted">Shipping</span>
                <span className={shippingCalc.isFree && paymentMethod !== 'cod' ? 'text-success' : ''}>{shippingCalc.label}</span>
              </div>
              {subtotalPaise < FREE_THRESHOLD && paymentMethod !== 'cod' && (
                <p className="text-xs text-muted">Add {formatINR(FREE_THRESHOLD - subtotalPaise)} more for free shipping.</p>
              )}
              <div className="flex justify-between border-t border-charcoal/10 pt-3 text-base font-medium">
                <span>Total</span><span>{formatINR(totalPaise)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-sage/20 px-4 py-3 text-xs text-muted">
              <p className="font-medium text-charcoal">Estimated delivery: 3–7 business days</p>
              <p>Gift-ready packaging included with every order.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
