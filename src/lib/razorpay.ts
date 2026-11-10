// Refunds through Razorpay's REST API (no SDK needed). Only used when the owner asks for an online refund.
export async function refundRazorpayPayment(paymentId: string, amountPaise: number, receipt: string): Promise<{ ok: true; refundId: string } | { ok: false; error: string }> {
  const id = process.env.RAZORPAY_KEY_ID; const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) return { ok: false, error: 'Razorpay keys are not set on the server, so the refund cannot be sent from here.' };
  try {
    const r = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountPaise, speed: 'normal', receipt }),
    });
    const d = await r.json().catch(() => ({})) as { id?: string; error?: { description?: string } };
    if (!r.ok || !d.id) return { ok: false, error: d.error?.description ?? 'Razorpay did not accept the refund.' };
    return { ok: true, refundId: d.id };
  } catch { return { ok: false, error: 'Could not reach Razorpay. Nothing was changed; please try again.' }; }
}
