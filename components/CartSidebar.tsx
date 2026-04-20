"use client";

import { useCart } from "@/context/CartContext";
import { RELEASES } from "@/lib/catalog";
import Cover from "@/components/Cover";
import { useRouter } from "next/navigation";

export default function CartSidebar() {
  const { cart, cartOpen, closeCart, updateQty, removeItem } = useCart();
  const router = useRouter();

  const items = cart.map((c) => ({
    ...c,
    release: RELEASES.find((r) => r.id === c.id)!,
  }));
  const subtotal = items.reduce((s, it) => s + it.release.variants[it.vIdx].p * it.qty, 0);
  const shipping = subtotal > 0 ? 24 : 0;

  const handleCheckout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (data.url) router.push(data.url);
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
          {items.map((it) => {
            const idx = RELEASES.indexOf(it.release);
            return (
              <div key={`${it.id}-${it.vIdx}`} className="item">
                <Cover idx={idx} release={it.release} />
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
                  <div className="price">€{it.release.variants[it.vIdx].p * it.qty}</div>
                  <a className="rm" onClick={() => removeItem(it.id, it.vIdx)}>
                    remove
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        <div className="ft">
          <div className="row">
            <span>Subtotal</span>
            <span>€{subtotal}</span>
          </div>
          <div className="row">
            <span>Shipping (EU)</span>
            <span>€{shipping}</span>
          </div>
          <div className="row total">
            <span>Total</span>
            <span>€{subtotal + shipping}</span>
          </div>
          <button className="checkout" disabled={items.length === 0} onClick={handleCheckout}>
            → checkout
          </button>
        </div>
      </aside>
    </>
  );
}
