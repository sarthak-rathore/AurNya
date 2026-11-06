/**
 * Email sending for AurNya (Phase 5).
 *
 * Uses Resend if RESEND_API_KEY is set.
 * Falls back silently (logs to console) when no email service is configured.
 * This means the site works without email — you just won't receive transactional emails.
 */

const FROM = process.env.EMAIL_FROM ?? 'AurNya <noreply@aurnya.com>';

export interface OrderEmailData {
  to: string;
  orderNumber: number;
  orderId: string;
  items: Array<{ name: string; qty: number; unitPricePaise: number; optionValue?: string | null }>;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  shippingAddress: {
    recipientName: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
  } | null;
  paymentMethod: string;
  estimatedDelivery: { from: string; to: string };
}

const esc = (v: string | null | undefined): string => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fmt(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede8">
        ${esc(item.name)}${item.optionValue ? ` · Size ${esc(item.optionValue)}` : ''} × ${item.qty}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede8;text-align:right">
        ${fmt(item.unitPricePaise * item.qty)}
      </td>
    </tr>
  `).join('');

  const addrHtml = data.shippingAddress ? `
    <p style="margin:0">${esc(data.shippingAddress.recipientName)}</p>
    <p style="margin:0">${esc(data.shippingAddress.line1)}${data.shippingAddress.line2 ? `, ${esc(data.shippingAddress.line2)}` : ''}</p>
    <p style="margin:0">${esc(data.shippingAddress.city)}, ${esc(data.shippingAddress.state)} ${esc(data.shippingAddress.pincode)}</p>
    <p style="margin:0">${esc(data.shippingAddress.country)}</p>
  ` : '<p>To be confirmed</p>';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmed – AurNya</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#faf9f7;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
    <div style="background:#2c2c2c;padding:32px 40px;text-align:center">
      <h1 style="color:#f5f0e8;margin:0;font-size:28px;font-weight:500;letter-spacing:.04em">AurNya</h1>
      <p style="color:#b8a898;margin:8px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Order Confirmed</p>
    </div>
    <div style="padding:40px">
      <h2 style="font-size:22px;margin:0 0 8px;color:#2c2c2c">Thank you for your order!</h2>
      <p style="color:#6b6560;margin:0 0 24px">Order #${data.orderNumber} has been placed successfully.</p>
      
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        ${itemsHtml}
        <tr>
          <td style="padding:12px 0 4px;color:#6b6560">Subtotal</td>
          <td style="padding:12px 0 4px;text-align:right;color:#6b6560">${fmt(data.subtotalPaise)}</td>
        </tr>
        ${data.discountPaise > 0 ? `
        <tr>
          <td style="padding:4px 0;color:#2d6a4f">Discount</td>
          <td style="padding:4px 0;text-align:right;color:#2d6a4f">−${fmt(data.discountPaise)}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:4px 0;color:#6b6560">Shipping</td>
          <td style="padding:4px 0;text-align:right;color:#6b6560">${data.shippingPaise === 0 ? 'Free' : fmt(data.shippingPaise)}</td>
        </tr>
        <tr>
          <td style="padding:12px 0 0;font-weight:600;font-size:16px;border-top:2px solid #f0ede8">Total</td>
          <td style="padding:12px 0 0;text-align:right;font-weight:600;font-size:16px;border-top:2px solid #f0ede8">${fmt(data.totalPaise)}</td>
        </tr>
      </table>

      <div style="background:#faf9f7;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#9b958f">Shipping to</p>
        <div style="color:#2c2c2c;font-size:14px;line-height:1.6">${addrHtml}</div>
      </div>

      <div style="background:#faf9f7;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#9b958f">Estimated delivery</p>
        <p style="margin:0;color:#2c2c2c;font-weight:500">${data.estimatedDelivery.from} – ${data.estimatedDelivery.to}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#9b958f">Payment: ${data.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online'}</p>
      </div>

      <div style="text-align:center">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aurnya.com'}/order/${data.orderId}" 
           style="display:inline-block;background:#2c2c2c;color:#f5f0e8;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:12px;text-transform:uppercase;letter-spacing:.1em">
          View Order
        </a>
      </div>
    </div>
    <div style="padding:24px 40px;border-top:1px solid #f0ede8;text-align:center;color:#9b958f;font-size:12px">
      <p style="margin:0">AurNya · Adorn Your Own Rules</p>
      <p style="margin:4px 0 0">If you have questions, reply to this email or contact us at ${process.env.NEXT_PUBLIC_EMAIL ?? 'hello@aurnya.com'}</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No email service configured — log and continue silently
    console.log(`[email] Order confirmation for #${data.orderNumber} → ${data.to} (no RESEND_API_KEY, skipping)`);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: data.to,
        subject: `Your AurNya order #${data.orderNumber} is confirmed!`,
        html: buildOrderConfirmationHtml(data),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[email] Resend error:', err);
    }
  } catch (err) {
    console.error('[email] Failed to send order confirmation:', err);
  }
}

export interface StatusEmailExtra { courier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null; note?: string | null }

export async function sendOrderStatusUpdate(to: string, orderNumber: number, status: string, extra: StatusEmailExtra = {}, orderId?: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email] Status update for #${orderNumber} (${status}) → ${to} (no RESEND_API_KEY, skipping)`);
    return;
  }

  const statusLabels: Record<string, string> = {
    paid: 'Payment confirmed',
    packed: 'Your order has been packed',
    shipped: 'Your order is on the way!',
    delivered: 'Your order has been delivered',
    cancelled: 'Your order has been cancelled',
    refunded: 'Refund processed',
  };

  const label = statusLabels[status] ?? `Order update: ${status}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aurnya.com';
  const tracking = status === 'shipped' && (extra.courier || extra.trackingNumber)
    ? `<p>Courier: <strong>${esc(extra.courier)}</strong>${extra.trackingNumber ? `<br>Tracking number: <strong>${esc(extra.trackingNumber)}</strong>` : ''}${extra.trackingUrl ? `<br><a href="${esc(extra.trackingUrl)}">Track your parcel</a>` : ''}</p>` : '';
  const link = orderId ? `<p><a href="${esc(site)}/order/${esc(orderId)}">View your order</a></p>` : '';

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to,
        subject: `${label} — AurNya Order #${orderNumber}`,
        html: `<p>Hi,</p><p>${esc(label)} for your AurNya order #${orderNumber}.</p>${tracking}${link}<p>The AurNya Team</p>`,
      }),
    });
  } catch (err) {
    console.error('[email] Failed to send status update:', err);
  }
}
