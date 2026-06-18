"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import Cover from "@/components/Cover";
import { formatPrice, variantPrice, toCents } from "@/lib/money";

type Region = "uk" | "pl";

interface Paczkomat {
  id: string;
  address: string;
}

const SHIP: Record<Region, { gbp: number; pln: number; label: string }> = {
  uk: { gbp: 330, pln: 1200, label: "UK — Royal Mail" },
  pl: { gbp: 330, pln: 1200, label: "Polska — InPost Paczkomat" },
};

declare global {
  interface Window {
    easyPack?: {
      init: (cfg: object) => void;
      mapWidget: (id: string, cb: (point: Record<string, unknown>) => void) => void;
    };
  }
}

const easyPackInited = { current: false };

export default function CartSidebar() {
  const { cart, cartOpen, openCart, closeCart, updateQty, removeItem, clearCart, products, currency } = useCart();
  const [region, setRegion] = useState<Region | null>(null);
  const [pickingRegion, setPickingRegion] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPaczkomatMap, setShowPaczkomatMap] = useState(false);
  const [paczkomat, setPaczkomat] = useState<Paczkomat | null>(null);
  const mapReadyRef = useRef(false);

  const items = cart
    .map((c) => ({ ...c, release: products.find((r) => r.id === c.id) }))
    .filter((c): c is typeof c & { release: NonNullable<typeof c.release> } => !!c.release);

  const subtotalCents = items.reduce(
    (s, it) => s + toCents(variantPrice(it.release.variants[it.vIdx], currency)) * it.qty,
    0,
  );
  const shipCents = region ? SHIP[region][currency] : null;
  const totalCents = subtotalCents + (shipCents ?? 0);

  const mountWidget = useCallback(() => {
    if (mapReadyRef.current) return;
    mapReadyRef.current = true;
    if (!easyPackInited.current) {
      window.easyPack?.init({ defaultLocale: "pl", points: { types: ["parcel_locker_only"] } });
      easyPackInited.current = true;
    }
    window.easyPack?.mapWidget("inpost-map-widget", (point) => {
      const a = point.address as Record<string, string> | undefined;
      const addr = [a?.line1, a?.line2].filter(Boolean).join(", ");
      setPaczkomat({ id: point.name as string, address: addr });
      setShowPaczkomatMap(false);
      mapReadyRef.current = false;
    });
    // Leaflet renders black tiles when container was hidden on init — trigger resize to fix
    setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
  }, []);

  useEffect(() => {
    if (!showPaczkomatMap) return;

    if (!document.querySelector('link[href*="easypack24"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://geowidget.easypack24.net/css/easypack.css";
      document.head.appendChild(link);
    }

    if (window.easyPack) {
      mountWidget();
    } else if (!document.querySelector('script[src*="easypack24"]')) {
      const script = document.createElement("script");
      script.src = "https://geowidget.easypack24.net/js/sdk-for-embed.js";
      script.async = true;
      script.onload = mountWidget;
      document.head.appendChild(script);
    }
  }, [showPaczkomatMap, mountWidget]);

  const handleCheckout = async (r: Region, paczkomatData?: Paczkomat) => {
    setPickingRegion(false);
    setCheckoutLoading(true);
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "cart", event: "checkout_start" }),
    }).catch(() => {});
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({ id: it.id, vIdx: it.vIdx, qty: it.qty })),
          currency,
          region: r,
          ...(paczkomatData
            ? { paczkomatId: paczkomatData.id, paczkomatAddress: paczkomatData.address }
            : {}),
        }),
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

  const openPaczkomatMap = () => {
    mapReadyRef.current = false;
    setShowPaczkomatMap(true);
    setPickingRegion(false);
    setRegion("pl");
  };

  const totalQty = cart.reduce((s, c) => s + c.qty, 0);

  const displayedShipLabel = paczkomat
    ? SHIP.pl.label
    : region
    ? SHIP[region].label
    : "Shipping";

  const displayedShipCents = paczkomat
    ? SHIP.pl[currency]
    : shipCents;

  const displayedTotal = subtotalCents + (displayedShipCents ?? 0);

  return (
    <>
      {showPaczkomatMap && (
        <div className="paczkomat-overlay">
          <div className="paczkomat-header">
            <span>Wybierz paczkomat InPost</span>
            <button onClick={() => { setShowPaczkomatMap(false); mapReadyRef.current = false; setPickingRegion(true); setRegion(null); }}>× zamknij</button>
          </div>
          <div id="inpost-map-widget" className="paczkomat-map" />
        </div>
      )}

      {totalQty > 0 && !cartOpen && (
        <button className="cart-fab" onClick={openCart}>
          <span>Cart</span>
          <span className="cart-fab-count">{totalQty}</span>
          <span className="cart-fab-price">{formatPrice(subtotalCents / 100, currency)}</span>
        </button>
      )}
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
            <span>{displayedShipLabel}</span>
            <span>{displayedShipCents == null ? "—" : formatPrice(displayedShipCents / 100, currency)}</span>
          </div>
          <div className="row total">
            <span>Total</span>
            <span>{displayedShipCents == null ? formatPrice(subtotalCents / 100, currency) : formatPrice(displayedTotal / 100, currency)}</span>
          </div>

          {paczkomat && !pickingRegion ? (
            <div className="region-pick">
              <div className="paczkomat-chosen">
                <span className="paczkomat-chosen-id">📦 {paczkomat.id}</span>
                <span className="paczkomat-chosen-addr">{paczkomat.address}</span>
              </div>
              <button
                className="checkout"
                disabled={items.length === 0 || checkoutLoading}
                onClick={() => handleCheckout("pl", paczkomat)}
              >
                {checkoutLoading ? "Loading…" : `→ zapłać ${formatPrice(displayedTotal / 100, currency)}`}
              </button>
              <button className="region-back" onClick={() => { setPaczkomat(null); setRegion(null); setPickingRegion(true); }}>
                ← zmień paczkomat
              </button>
            </div>
          ) : pickingRegion ? (
            <div className="region-pick">
              <div className="region-label">Where are you shipping to?</div>
              <div className="region-btns">
                <button onClick={() => { setRegion("uk"); handleCheckout("uk"); }}>
                  🇬🇧 UK<span>{formatPrice(SHIP.uk[currency] / 100, currency)}</span>
                </button>
                <button onClick={openPaczkomatMap}>
                  🇵🇱 Polska (Paczkomat)<span>{formatPrice(SHIP.pl[currency] / 100, currency)}</span>
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
