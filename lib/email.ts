import { Resend } from "resend";
import type { Order } from "./orders";
import { formatPrice } from "./money";

function client() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "Kuzko <orders@kuzko-store.com>";
const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.kuzko-store.com";

function html(order: Order, heading: string, body: string): string {
  const imageBlock = order.items[0]?.imageUrl
    ? `<img src="${order.items[0].imageUrl}" alt="${order.items[0].title}" style="width:100%;max-width:540px;height:auto;display:block;margin:0 auto 32px;border:1px solid #242320;" />`
    : "";

  const rows = order.items
    .map(
      (it) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #242320;font-size:13px;color:#f2eee3">${it.title} — ${it.variant}</td><td style="padding:10px 0;border-bottom:1px solid #242320;text-align:center;color:#7a766d">×${it.qty}</td><td style="padding:10px 0;border-bottom:1px solid #242320;text-align:right;color:#f2eee3">${formatPrice(it.unitPrice * it.qty, order.currency)}</td></tr>`
    )
    .join("");

  const addr = order.address
    ? `<div style="margin:32px 0;font-size:12px;line-height:1.8;color:#7a766d"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#f2eee3;margin-bottom:8px">Delivery address</div>${order.address.name}<br>${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}<br>${order.address.city} ${order.address.postal_code}<br>${order.address.country}</div>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Courier New',Courier,monospace;background:#050505;color:#f2eee3;max-width:580px;margin:0 auto;padding:40px 24px">
  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.25em;border-bottom:1px solid #242320;padding-bottom:14px;margin-bottom:32px;color:#f2eee3">KUZKO</div>
  <h1 style="font-size:13px;font-weight:normal;margin:0 0 24px;color:#f2eee3;letter-spacing:0.05em">${heading}</h1>
  ${body}
  ${imageBlock}
  <table style="width:100%;border-collapse:collapse;margin:24px 0">
    ${rows}
    <tr><td style="padding:10px 0;border-bottom:1px solid #242320;font-size:13px;color:#7a766d">${order.shippingLabel ?? "Shipping"}</td><td></td><td style="padding:10px 0;border-bottom:1px solid #242320;text-align:right;color:#7a766d;font-size:13px">${formatPrice(order.shippingCents / 100, order.currency)}</td></tr>
    <tr><td style="padding:12px 0;border-top:1px solid #f2eee3;font-size:14px;font-weight:bold;color:#f2eee3">Total</td><td></td><td style="padding:12px 0;border-top:1px solid #f2eee3;text-align:right;font-size:14px;font-weight:bold;color:#f2eee3">${formatPrice(order.totalCents / 100, order.currency)}</td></tr>
  </table>
  ${addr}
  <a href="${BASE}/order/${order.id}" style="display:inline-block;margin:24px 0;padding:13px 32px;background:#f2eee3;color:#050505;text-decoration:none;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;font-family:'Courier New',Courier,monospace">TRACK YOUR ORDER →</a>
  <div style="margin-top:48px;padding-top:20px;border-top:1px solid #242320;font-size:10px;color:#7a766d;text-transform:uppercase;letter-spacing:0.12em">KUZKO · London · kuzko-store.com</div>
</body></html>`;
}

export async function sendOrderConfirmation(order: Order): Promise<void> {
  const r = client();
  if (!r || !order.email) return;
  const body = `<p style="font-size:14px;margin:0 0 8px;color:#f2eee3">Thank you for your order.</p><p style="font-size:12px;color:#7a766d;margin:0 0 24px">Order number: <span style="color:#f2eee3">EA-${order.number}</span> &nbsp;·&nbsp; We will notify you once your order ships.</p>`;
  await r.emails.send({
    from: FROM,
    to: order.email,
    subject: `Order confirmed — EA-${order.number}`,
    html: html(order, `Order confirmed — EA-${order.number}`, body),
  });
}

export async function sendShippingUpdate(order: Order): Promise<void> {
  const r = client();
  if (!r || !order.email) return;
  const delivered = order.status === "delivered";
  const subject = delivered
    ? `Your order has been delivered — EA-${order.number}`
    : `Your order has shipped — EA-${order.number}`;
  const trackingLine = order.trackingNumber
    ? `<p style="font-size:12px;color:#7a766d;margin:8px 0 0">Tracking number: <span style="color:#f2eee3">${order.trackingNumber}</span></p>`
    : "";
  const body = delivered
    ? `<p style="font-size:14px;margin:0 0 8px;color:#f2eee3">Your order has been delivered.</p><p style="font-size:12px;color:#7a766d;margin:0 0 24px">Thank you for your support — enjoy the music.</p>`
    : `<p style="font-size:14px;margin:0 0 8px;color:#f2eee3">Your order is on its way.</p>${trackingLine}<p style="font-size:12px;color:#7a766d;margin:8px 0 24px">Use the link below to track your delivery.</p>`;
  await r.emails.send({
    from: FROM,
    to: order.email,
    subject,
    html: html(order, subject, body),
  });
}
