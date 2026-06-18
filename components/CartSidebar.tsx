"use client";

import { useState, useEffect, useRef } from "react";
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

// InPost GeoWidget v5 — requires a token from the InPost business panel
// (manager.paczkomaty.pl → API). Safe to expose client-side (scoped to map only).
const INPOST_TOKEN = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN ?? "";
const INPOST_JS = "https://geowidget.inpost.pl/inpost-geowidget.js";
const INPOST_CSS = "https://geowidget.inpost.pl/inpost-geowidget.css";

// Module-level guard so the SDK <script>/<link> is injected only once per page load
const sdk = { loading: false, ready: false };

function loadInpostSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (sdk.ready) return resolve();
    if (!document.querySelector(`link[href="${INPOST_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = INPOST_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${INPOST_JS}"]`);
    if (existing) {
      if (sdk.ready) resolve();
      else existing.addEventListener("load", () => { sdk.ready = true; resolve(); });
      existing.addEventListener("error", reject);
      return;
    }
    sdk.loading = true;
    const script = document.createElement("script");
    script.src = INPOST_JS;
    script.defer = true;
    script.onload = () => { sdk.ready = true; sdk.loading = false; resolve(); };
    script.onerror = (e) => { sdk.loading = false; reject(e); };
    document.head.appendChild(script);
  });
}

export default function CartSidebar() {
  const { cart, cartOpen, openCart, closeCart, updateQty, removeItem, clearCart, products, currency } = useCart();
  const [region, setRegion] = useState<Region | null>(null);
  const [pickingRegion, setPickingRegion] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPaczkomatMap, setShowPaczkomatMap] = useState(false);
  const [paczkomat, setPaczkomat] = useState<Paczkomat | null>(null);
  const [widgetError, setWidgetError] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const items = cart
    .map((c) => ({ ...c, release: products.find((r) => r.id === c.id) }))
    .filter((c): c is typeof c & { release: NonNullable<typeof c.release> } => !!c.release);

  const subtotalCents = items.reduce(
    (s, it) => s + toCents(variantPrice(it.release.variants[it.vIdx], currency)) * it.qty,
    0,
  );
  const displayedShipCents = paczkomat ? SHIP.pl[currency] : region ? SHIP[region][currency] : null;
  const displayedTotal = subtotalCents + (displayedShipCents ?? 0);
  const displayedShipLabel = paczkomat ? SHIP.pl.label : region ? SHIP[region].label : "Shipping";

  // Mount the InPost GeoWidget v5 web component when the map overlay opens
  useEffect(() => {
    if (!showPaczkomatMap) return;
    if (!INPOST_TOKEN) { setWidgetError(true); return; }

    let cancelled = false;

    loadInpostSdk()
      .then(() => {
        if (cancelled) return;
        const container = mapContainerRef.current;
        if (!container || container.querySelector("inpost-geowidget")) return;

        const widget = document.createElement("inpost-geowidget");
        widget.setAttribute("token", INPOST_TOKEN);
        widget.setAttribute("language", "pl");
        widget.setAttribute("config", "parcelcollect");

        widget.addEventListener("onpoint", ((e: Event) => {
          const detail = (e as CustomEvent).detail ?? {};
          const a = detail.address ?? {};
          const d = detail.address_details ?? {};
          const addr =
            [a.line1, a.line2].filter(Boolean).join(", ") ||
            [d.street, d.building_number, d.post_code, d.city].filter(Boolean).join(" ");
          setPaczkomat({ id: detail.name ?? "", address: addr });
          setShowPaczkomatMap(false);
        }) as EventListener);

        container.appendChild(widget);
      })
      .catch(() => { if (!cancelled) setWidgetError(true); });

    return () => { cancelled = true; };
  }, [showPaczkomatMap]);

  const closeMap = () => {
    // Tear down the widget so it re-initialises cleanly next time
    if (mapContainerRef.current) mapContainerRef.current.innerHTML = "";
    setShowPaczkomatMap(false);
  };

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
          ...(paczkomatData ? { paczkomatId: paczkomatData.id, paczkomatAddress: paczkomatData.address } : {}),
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

  const openMap = () => {
    setWidgetError(false);
    setRegion("pl");
    setPickingRegion(false);
    setShowPaczkomatMap(true);
  };

  const confirmManualCode = () => {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    setPaczkomat({ id: code, address: "" });
    setManualCode("");
    closeMap();
  };

  const totalQty = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <>
      {showPaczkomatMap && (
        <div className="paczkomat-overlay">
          <div className="paczkomat-header">
            <span>Wybierz paczkomat InPost</span>
            <button onClick={() => { closeMap(); setPickingRegion(true); setRegion(null); }}>× zamknij</button>
          </div>
          {widgetError ? (
            <div className="paczkomat-fallback">
              <p>Mapa paczkomatów jest chwilowo niedostępna.</p>
              <p className="paczkomat-fallback-sub">
                Znajdź swój paczkomat na{" "}
                <a href="https://inpost.pl/znajdz-paczkomat" target="_blank" rel="noreferrer">inpost.pl/znajdz-paczkomat</a>{" "}
                i wpisz jego kod poniżej.
              </p>
              <div className="paczkomat-manual">
                <input
                  placeholder="np. KRA01M"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmManualCode()}
                />
                <button onClick={confirmManualCode} disabled={!manualCode.trim()}>Potwierdź</button>
              </div>
            </div>
          ) : (
            <div id="inpost-map-widget" className="paczkomat-map" ref={mapContainerRef} />
          )}
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
              <span style={{ fontFamily: "var(--mono)", fontStyle: "normal", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                add something from the catalogue
              </span>
            </div>
          )}
          {items.map((it, i) => (
            <div key={`${it.id}-${it.vIdx}`} className="item">
              <Cover idx={i} release={it.release} />
              <div>
                <h4>{it.release.title}</h4>
                <div className="sub">{it.release.artist} · {it.release.variants[it.vIdx].k}</div>
                <div className="qty">
                  <button onClick={() => updateQty(it.id, it.vIdx, -1)}>−</button>
                  <span>{it.qty}</span>
                  <button onClick={() => updateQty(it.id, it.vIdx, +1)}>+</button>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="price">{formatPrice(variantPrice(it.release.variants[it.vIdx], currency) * it.qty, currency)}</div>
                <a className="rm" onClick={() => removeItem(it.id, it.vIdx)}>remove</a>
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
                {paczkomat.address && <span className="paczkomat-chosen-addr">{paczkomat.address}</span>}
              </div>
              <button
                className="checkout"
                disabled={items.length === 0 || checkoutLoading}
                onClick={() => handleCheckout("pl", paczkomat)}
              >
                {checkoutLoading ? "Loading…" : `→ zapłać ${formatPrice(displayedTotal / 100, currency)}`}
              </button>
              <button className="region-back" onClick={() => { setPaczkomat(null); openMap(); }}>
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
                <button onClick={openMap}>
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
