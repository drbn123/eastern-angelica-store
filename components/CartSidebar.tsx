"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import Cover from "@/components/Cover";
import { formatPrice, variantPrice, toCents } from "@/lib/money";

type Region = "uk" | "international";

const SHIP: Record<Region, { gbp: number; pln: number; label: string }> = {
  uk:            { gbp: 545,  pln: 545,  label: "UK — Royal Mail Small Parcel" },
  international: { gbp: 980,  pln: 4900, label: "International Tracked — Royal Mail" },
};

export default function CartSidebar() {
  const { cart, cartOpen, closeCart, updateQty, removeItem, clearCart, products, currency } = useCart();
  const [region, setRegion] = useState<Region | null>(null);
  const [pickingRegion, setPickingRegion] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const items = cart
    .map((c) => ({ ...c, release: products.find((r) => r.id === c.id) }))
    .filter((c): c is typeof c & { release: NonNullable<typeof c.release> } => !!c.release);

  const subtotalCents = items.reduce(
    (s, it) => s + toCents(variantPrice(it.release.variants[it.vIdx], currency)) * it.qty,
    0,
  );
  const shipCents = region ? SHIP[region][currency] : null;
  const totalCents = subtotalCents + (shipCents ?? 0);

  const handleCheckout = async (r: Region) => {
    setPickingRegion(false);
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((it) => ({ id: it.id, vIdx: it.vIdx, qty: it.qty })), currency, region: r }),
      });
      const data = await res.json();
      if (data.url) {
        clearCart();
        closeCart();
        window.location.href = data.url;
      } else {
        alert(data.message ?? data.error ?? "Checkout failed — please try again.");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <div className={`cart-scrim${cartOpen ? " on" : ""}`} onClick={closeCart} />
      <aside className={`cart${cartOpen ? " on" : ""}`} aria-hidden={!cartOpen}>
        <div className="hd">
          <b>Cart</b>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <span>{cart.reduce((s, c) => s + c.qty, 0)} items</span>
            <button onClick={closeCart}>× close</button>
          </div>
        </div>
        <div className="items">
          {items.length === 0 && (
            <div className="empty">
              empty,{" "}
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontStyle: "normal",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                add something from the catalogue
              </span>
            </div>
          )}
          {items.map((it, i) => (
            <div key={`${it.id}-${it.vIdx}`} className="item">
              <Cover idx={i} release={it.release} />
              <div>
                <h4>{it.release.title}</h4>
                <div className="sub">
                  {it.release.artist} · {it.release.variants[it.vIdx].k}
                </div>
                <div className="qty">
                  <button onClick={() => updateQty(it.id, it.vIdx, -1)}>−</button>
                  <span>{it.qty}</span>
                  <button onClick={() => updateQty(it.id, it.vIdx, +1)}>+</button>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="price">
                  {formatPrice(variantPrice(it.release.variants[it.vIdx], currency) * it.qty, currency)}
                </div>
                <a className="rm" onClick={() => removeItem(it.id, it.vIdx)}>
                  remove
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="ft">
          <div className="row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents / 100, currency)}</span>
          </div>
          <div className="row">
            <span>{region ? SHIP[region].label : "Shipping"}</span>
            <span>{shipCents == null ? "—" : formatPrice(shipCents / 100, currency)}</span>
          </div>
          <div className="row total">
            <span>Total</span>
            <span>{shipCents == null ? formatPrice(subtotalCents / 100, currency) : formatPrice(totalCents / 100, currency)}</span>
          </div>

          {pickingRegion ? (
            <div className="region-pick">
              <div className="region-label">Where are you shipping to?</div>
              <div className="region-btns">
                <button onClick={() => { setRegion("uk"); handleCheckout("uk"); }}>
                  🇬🇧 UK<span>{formatPrice(SHIP.uk[currency] / 100, currency)}</span>
                </button>
                <button onClick={() => { setRegion("international"); handleCheckout("international"); }}>
                  🌍 International<span>{formatPrice(SHIP.international[currency] / 100, currency)}</span>
                </button>
              </div>
              <button className="region-back" onClick={() => setPickingRegion(false)}>← back</button>
            </div>
          ) : (
            <button
              className="checkout"
              disabled={items.length === 0 || checkoutLoading}
              onClick={() => setPickingRegion(true)}
            >
              {checkoutLoading ? "Loading…" : "→ checkout"}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
