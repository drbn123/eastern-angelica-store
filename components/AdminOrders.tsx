"use client";

import { useState } from "react";
import type { Order, OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/money";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  shipped: "Shipped",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: "fulfilled",
  fulfilled: "shipped",
};

function flag(country: string) {
  if (country === "GB") return "🇬🇧";
  if (country === "PL") return "🇵🇱";
  return "🌍";
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function OrderRow({
  order,
  onUpdate,
}: {
  order: Order;
  onUpdate: (updated: Order) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(order.note ?? "");

  async function changeStatus(status: OrderStatus) {
    setBusy(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) onUpdate(await res.json());
    setBusy(false);
  }

  async function saveNote() {
    setBusy(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (res.ok) onUpdate(await res.json());
    setBusy(false);
  }

  const nextStatus = STATUS_NEXT[order.status];
  const countryCode = order.address?.country ?? (order.currency === "gbp" ? "GB" : "PL");

  return (
    <div className="ao-order">
      <div className="ao-row" onClick={() => setExpanded((v) => !v)}>
        <span className="ao-num">EA-{order.number}</span>
        <span className="ao-flag">{flag(countryCode)}</span>
        <span className="ao-email">{order.email || "—"}</span>
        <span className="ao-total">{formatPrice(order.totalCents / 100, order.currency)}</span>
        <span className={`ao-badge ao-badge-${order.status}`}>{STATUS_LABELS[order.status]}</span>
        <span className="ao-date">{fmt(order.createdAt)}</span>
        <span className="ao-chevron">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="ao-detail">
          <div className="ao-items">
            {order.items.map((it, i) => (
              <div key={i} className="ao-item">
                <span>{it.title} — {it.variant}</span>
                <span>×{it.qty}</span>
                <span>{formatPrice(it.unitPrice * it.qty, order.currency)}</span>
              </div>
            ))}
            <div className="ao-item ao-item-ship">
              <span>Shipping</span>
              <span></span>
              <span>{order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents / 100, order.currency)}</span>
            </div>
          </div>

          {order.address && (
            <div className="ao-addr">
              <div className="ao-addr-label">Delivery address</div>
              <div>{order.address.name}</div>
              <div>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</div>
              <div>{order.address.city} {order.address.postal_code}</div>
              <div>{order.address.country}</div>
            </div>
          )}

          <div className="ao-meta">
            {order.stripePaymentIntent && (
              <a
                className="ao-stripe-link"
                href={`https://dashboard.stripe.com/payments/${order.stripePaymentIntent}`}
                target="_blank"
                rel="noreferrer"
              >
                → Stripe Dashboard
              </a>
            )}
          </div>

          <div className="ao-note-row">
            <input
              className="admin-input ao-note-input"
              placeholder="Internal note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="admin-btn-ghost" onClick={saveNote} disabled={busy}>
              Save note
            </button>
          </div>

          <div className="ao-actions">
            {nextStatus && (
              <button className="admin-btn-primary" onClick={() => changeStatus(nextStatus)} disabled={busy}>
                Mark as {STATUS_LABELS[nextStatus]}
              </button>
            )}
            {order.status !== "cancelled" && order.status !== "refunded" && (
              <button
                className="admin-btn-ghost ao-cancel-btn"
                onClick={() => confirm("Cancel this order?") && changeStatus("cancelled")}
                disabled={busy}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrders({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  function handleUpdate(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  const paid = orders.filter((o) => o.status === "paid").length;
  const pending = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="ao-wrap">
      <div className="ao-header">
        <span className="admin-topbar-title">Orders ({orders.length})</span>
        <div className="ao-stats">
          {paid > 0 && <span className="ao-badge ao-badge-paid">{paid} paid</span>}
          {pending > 0 && <span className="ao-badge ao-badge-pending">{pending} pending</span>}
        </div>
      </div>

      {orders.length === 0 && (
        <p className="admin-empty">No orders yet — they will appear here after checkout.</p>
      )}

      <div className="ao-list">
        {orders.map((o) => (
          <OrderRow key={o.id} order={o} onUpdate={handleUpdate} />
        ))}
      </div>
    </div>
  );
}
