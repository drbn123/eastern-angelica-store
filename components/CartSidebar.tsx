"use client";

import { useCart } from "@/context/CartContext";
import Cover from "@/components/Cover";
import { formatPrice, variantPrice, toCents, shippingCents, shippingLabel } from "@/lib/money";

export default function CartSidebar() {
  const { cart, cartOpen, closeCart, updateQty, removeItem, clearCart, products, currency } = useCart();

  const items = cart
    .map((c) => ({ ...c, release: products.find((r) => r.id === c.id) }))
    .filter((c): c is typeof c & { release: NonNullable<typeof c.release> } => !!c.release);

  const subtotalCents = items.reduce(
    (s, it) => s + toCents(variantPrice(it.release.variants[it.vIdx], currency)) * it.qty,
    0,
  );
  const shipCents = cart.length > 0 ? shippingCents(subtotalCents, currency) : 0;
  const totalCents = subtotalCents + shipCents;

  const handleCheckout = async () => {
    const payload = {
      items: items.map((it) => ({ id: it.id, vIdx: it.vIdx, qty: it.qty })),
      currency,
    };
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.url) {
      clearCart();
      closeCart();
      window.location.href = data.url;
    } else {
      alert(data.message ?? data.error ?? "Checkout failed — please try again.");
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
            <span>{shippingLabel(subtotalCents, currency)}</span>
            <span>{shipCents === 0 ? "Free" : formatPrice(shipCents / 100, currency)}</span>
          </div>
          <div className="row total">
            <span>Total</span>
            <span>{formatPrice(totalCents / 100, currency)}</span>
          </div>
          <button className="checkout" disabled={items.length === 0} onClick={handleCheckout}>
            → checkout
          </button>
        </div>
      </aside>
    </>
  );
}
