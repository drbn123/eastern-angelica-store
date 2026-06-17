import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/money";
import type { OrderStatus } from "@/lib/orders";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrder(id);
  return { title: order ? `Order EA-${order.number}` : "Order" };
}

const STEPS: { id: string; label: string }[] = [
  { id: "placed",    label: "Order placed" },
  { id: "paid",      label: "Payment confirmed" },
  { id: "shipped",   label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

function stepIndex(status: OrderStatus): number {
  if (status === "pending")   return 0;
  if (status === "paid")      return 1;
  if (status === "fulfilled") return 1; // internal only, maps to same step as paid
  if (status === "shipped")   return 2;
  if (status === "delivered") return 3;
  return -1;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const current = stepIndex(order.status);
  const cancelled = order.status === "cancelled" || order.status === "refunded";

  return (
    <main className="order-page">
      <div className="op-header">
        <Link href="/store" className="op-back">← Store</Link>
        <div className="op-title">
          <span className="op-num">EA-{order.number}</span>
          <span className={`op-status op-status-${order.status}`}>{order.status}</span>
        </div>
        <div className="op-meta">{fmt(order.createdAt)} · {formatPrice(order.totalCents / 100, order.currency)}</div>
      </div>

      {cancelled ? (
        <div className="op-cancelled">This order has been {order.status}.</div>
      ) : (
        <div className="op-tracker">
          {STEPS.map((step, i) => {
            const done = i <= current;
            const active = i === current;
            return (
              <div key={step.id} className="op-step">
                <div className="op-step-top">
                  {i > 0 && <div className={`op-line${done ? " done" : ""}`} />}
                  <div className={`op-node${done ? " done" : ""}${active ? " active" : ""}`}>
                    {done && <span className="op-check">✓</span>}
                  </div>
                  {i < STEPS.length - 1 && <div className={`op-line${i < current ? " done" : ""}`} />}
                </div>
                <div className={`op-step-label${done ? " done" : ""}`}>{step.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {order.trackingNumber && (
        <div className="op-tracking">
          <div className="op-tracking-label">Tracking number</div>
          <div className="op-tracking-number">{order.trackingNumber}</div>
          <a
            className="op-tracking-link"
            href={`https://www.royalmail.com/track-your-item#/tracking-results/${order.trackingNumber}`}
            target="_blank"
            rel="noreferrer"
          >
            Track on Royal Mail →
          </a>
        </div>
      )}

      <div className="op-items">
        {order.items.map((it, i) => (
          <div key={i} className="op-item">
            <span>{it.title} — {it.variant}</span>
            <span>×{it.qty}</span>
            <span>{formatPrice(it.unitPrice * it.qty, order.currency)}</span>
          </div>
        ))}
        <div className="op-item op-item-ship">
          <span>{order.shippingLabel ?? "Shipping"}</span>
          <span />
          <span>{formatPrice(order.shippingCents / 100, order.currency)}</span>
        </div>
        <div className="op-item op-total">
          <span>Total</span>
          <span />
          <span>{formatPrice(order.totalCents / 100, order.currency)}</span>
        </div>
      </div>

      {order.address && (
        <div className="op-addr">
          <div className="op-addr-label">Delivery address</div>
          <div>{order.address.name}</div>
          <div>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</div>
          <div>{order.address.city} {order.address.postal_code}</div>
          <div>{order.address.country}</div>
        </div>
      )}

      <div className="op-footer">
        <Link href="/track" className="op-track-link">Look up a different order</Link>
      </div>
    </main>
  );
}
