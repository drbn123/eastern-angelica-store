"use client";

import { useState, useEffect, useRef } from "react";
import type { Order, OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/money";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: "fulfilled",
  fulfilled: "shipped",
  shipped: "delivered",
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
  onDelete,
}: {
  order: Order;
  onUpdate: (updated: Order) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(order.note ?? "");
  const [noteSaved, setNoteSaved] = useState(false);
  const [trackingInput, setTrackingInput] = useState(order.trackingNumber ?? "");

  async function changeStatus(status: OrderStatus) {
    setBusy(true);
    const body: Record<string, unknown> = { status };
    if (status === "shipped" && trackingInput.trim()) {
      body.trackingNumber = trackingInput.trim();
    }
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    if (res.ok) {
      onUpdate(await res.json());
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    }
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete order EA-${order.number}? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
    if (res.ok) onDelete(order.id);
    else setBusy(false);
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
              <span>{order.shippingLabel ?? "Shipping"}</span>
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
            {order.trackingNumber && (
              <div className="ao-tracking">
                Tracking: <strong>{order.trackingNumber}</strong>
                <a
                  href={`https://www.royalmail.com/track-your-item#/tracking-results/${order.trackingNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ao-tracking-rm"
                >
                  → Royal Mail
                </a>
              </div>
            )}
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
            <textarea
              className="admin-input ao-note-input"
              placeholder="Internal note…"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="admin-btn-ghost" onClick={saveNote} disabled={busy}>
              {noteSaved ? "Saved ✓" : "Save note"}
            </button>
          </div>

          <div className="ao-actions">
            {nextStatus === "shipped" && (
              <input
                className="admin-input ao-tracking-input"
                placeholder="Tracking number (optional)"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
              />
            )}
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
            <button
              className="admin-btn-ghost ao-delete-btn"
              onClick={handleDelete}
              disabled={busy}
            >
              Delete order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_FILTERS = ["all", "paid", "fulfilled", "shipped", "delivered", "cancelled", "pending", "refunded"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function AdminOrders({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currencyFilter, setCurrencyFilter] = useState<"all" | "gbp" | "pln">("all");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [search, setSearch] = useState("");
  const [newCount, setNewCount] = useState(0);
  const knownIds = useRef(new Set(initialOrders.map((o) => o.id)));

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) return;
        const fresh: Order[] = await res.json();
        const brandNew = fresh.filter((o) => !knownIds.current.has(o.id));
        if (brandNew.length > 0) {
          brandNew.forEach((o) => knownIds.current.add(o.id));
          setOrders(fresh);
          setNewCount((n) => n + brandNew.length);
        }
      } catch {}
    }, 30_000);
    return () => clearInterval(poll);
  }, []);

  function handleUpdate(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  function handleDelete(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    knownIds.current.delete(id);
  }

  async function deleteVisible() {
    if (!confirm(`Delete all ${visible.length} visible orders? This cannot be undone.`)) return;
    const ids = visible.map((o) => o.id);
    await Promise.all(ids.map((id) => fetch(`/api/orders/${id}`, { method: "DELETE" })));
    setOrders((prev) => prev.filter((o) => !ids.includes(o.id)));
    ids.forEach((id) => knownIds.current.delete(id));
  }

  function exportCSV() {
    const headers = ["Order", "Date", "Email", "Status", "Currency", "Total", "Items", "Name", "Address", "City", "Postal", "Country", "Tracking", "Note"];
    const rows = visible.map((o) => [
      `EA-${o.number}`,
      new Date(o.createdAt).toLocaleDateString("en-GB"),
      o.email,
      o.status,
      o.currency.toUpperCase(),
      (o.totalCents / 100).toFixed(2),
      o.items.map((it) => `${it.qty}x ${it.title} (${it.variant})`).join("; "),
      o.address?.name ?? "",
      [o.address?.line1, o.address?.line2].filter(Boolean).join(", "),
      o.address?.city ?? "",
      o.address?.postal_code ?? "",
      o.address?.country ?? "",
      o.trackingNumber ?? "",
      o.note ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `kuzko-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  const counts: Partial<Record<StatusFilter, number>> = { all: orders.length };
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;

  const visible = orders
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .filter((o) => currencyFilter === "all" || o.currency === currencyFilter)
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        o.email.toLowerCase().includes(q) ||
        String(o.number).includes(q) ||
        o.address?.name?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "desc" ? -diff : diff;
    });

  return (
    <div className="ao-wrap">
      <div className="ao-header">
        <span className="admin-topbar-title">Orders ({orders.length})</span>
        {newCount > 0 && (
          <button className="ao-new-badge" onClick={() => { setNewCount(0); setSortDir("desc"); setStatusFilter("all"); }}>
            {newCount} new order{newCount > 1 ? "s" : ""} ↓
          </button>
        )}
        {visible.length > 0 && (
          <button className="admin-btn-ghost ao-export-btn" onClick={exportCSV}>
            Export CSV ({visible.length})
          </button>
        )}
        {visible.length > 0 && (
          <button className="admin-btn-ghost ao-delete-all-btn" onClick={deleteVisible}>
            Delete {visible.length === orders.length ? "all" : `${visible.length} visible`}
          </button>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="ao-filters">
        <div className="ao-filter-status">
          {(["all", "paid", "fulfilled", "shipped", "delivered", "pending", "cancelled"] as StatusFilter[]).map((s) => (
            counts[s] !== undefined || s === "all" ? (
              <button
                key={s}
                className={`ao-filter-btn${statusFilter === s ? " on" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All" : STATUS_LABELS[s as OrderStatus]}
                {counts[s] ? <span className="ao-filter-count">{counts[s]}</span> : null}
              </button>
            ) : null
          ))}
        </div>
        <div className="ao-filter-right">
          <input
            className="ao-search"
            placeholder="Search email / EA-1000 / name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className={`ao-filter-btn${currencyFilter === "gbp" ? " on" : ""}`}
            onClick={() => setCurrencyFilter(currencyFilter === "gbp" ? "all" : "gbp")}
          >
            £ GBP
          </button>
          <button
            className={`ao-filter-btn${currencyFilter === "pln" ? " on" : ""}`}
            onClick={() => setCurrencyFilter(currencyFilter === "pln" ? "all" : "pln")}
          >
            zł PLN
          </button>
          <button
            className="ao-filter-btn ao-sort-btn"
            onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
            title="Toggle sort order"
          >
            {sortDir === "desc" ? "↓ Newest" : "↑ Oldest"}
          </button>
        </div>
      </div>

      {visible.length === 0 && (
        <p className="admin-empty">
          {orders.length === 0 ? "No orders yet — they will appear here after checkout." : "No orders match the current filters."}
        </p>
      )}

      <div className="ao-list">
        {visible.map((o) => (
          <OrderRow key={o.id} order={o} onUpdate={handleUpdate} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
