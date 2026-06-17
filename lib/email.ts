import { Resend } from "resend";
import type { Order } from "./orders";
import { formatPrice } from "./money";

function client() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "Eastern Angelica <orders@kuzko-store.com>";
const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.kuzko-store.com";

function html(order: Order, heading: string, body: string): string {
  const rows = order.items
    .map((it) => `<tr><td>${it.title} — ${it.variant}</td><td style="text-align:right">×${it.qty}</td><td style="text-align:right">${formatPrice(it.unitPrice * it.qty, order.currency)}</td></tr>`)
    .join("");
  const addr = order.address
    ? `<div style="margin:20px 0;font-size:13px;line-height:1.7"><strong>Delivery address</strong><br>${order.address.name}<br>${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}<br>${order.address.city} ${order.address.postal_code}<br>${order.address.country}</div>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:monospace;background:#fff;color:#111;max-width:580px;margin:0 auto;padding:40px 20px">
<p style="font-size:11px;text-transform:uppercase;letter-spacing:0.2em;border-bottom:1px solid #111;padding-bottom:12px;margin-bottom:24px">Eastern Angelica</p>
<h1 style="font-size:14px;font-weight:normal;margin:0 0 16px">${heading}</h1>
${body}
<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px">
  ${rows}
  <tr><td style="padding:6px 0;border-top:1px solid #eee">Shipping</td><td></td><td style="text-align:right;padding:6px 0;border-top:1px solid #eee">${formatPrice(order.shippingCents / 100, order.currency)}</td></tr>
  <tr><td style="padding:8px 0;border-top:1px solid #111;font-weight:bold">Total</td><td></td><td style="text-align:right;padding:8px 0;border-top:1px solid #111;font-weight:bold">${formatPrice(order.totalCents / 100, order.currency)}</td></tr>
</table>
${addr}
<a href="${BASE}/order/${order.id}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#111;color:#fff;text-decoration:none;font-size:11px;text-transform:uppercase;letter-spacing:0.18em">Track your order →</a>
<p style="margin-top:40px;font-size:11px;opacity:0.5">Eastern Angelica · London · eastern-angelica.com</p>
</body></html>`;
}

export async function sendOrderConfirmation(order: Order): Promise<void> {
  const r = client();
  if (!r || !order.email) return;
  const body = `<p style="font-size:14px;margin:0 0 8px">Thank you for your order.</p><p style="font-size:13px;color:#555;margin:0 0 16px">Order number: <strong>EA-${order.number}</strong></p><p style="font-size:13px;color:#555">We will notify you once your order ships.</p>`;
  await r.emails.send({ from: FROM, to: order.email, subject: `Order confirmed — EA-${order.number}`, html: html(order, `Order confirmed — EA-${order.number}`, body) });
}

export async function sendShippingUpdate(order: Order): Promise<void> {
  const r = client();
  if (!r || !order.email) return;
  const shipped = order.status === "shipped";
  const subject = shipped ? `Your order has shipped — EA-${order.number}` : `Order fulfilled — EA-${order.number}`;
  const body = shipped
    ? `<p style="font-size:14px;margin:0 0 8px">Your order is on its way.</p><p style="font-size:13px;color:#555">Use the link below to track your delivery.</p>`
    : `<p style="font-size:14px;margin:0 0 8px">Your order is complete.</p><p style="font-size:13px;color:#555">Thank you for your support — enjoy the music.</p>`;
  await r.emails.send({ from: FROM, to: order.email, subject, html: html(order, subject, body) });
}
