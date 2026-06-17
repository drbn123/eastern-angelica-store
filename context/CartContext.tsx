"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { CartItem, Release } from "@/lib/types";
import { type Currency, CURRENCY_COOKIE, DEFAULT_CURRENCY, variantPrice } from "@/lib/money";

interface CartContextValue {
  cart: CartItem[];
  cartCount: number;
  bump: boolean;
  cartOpen: boolean;
  toast: string;
  products: Release[];
  currency: Currency;
  setCurrency: (c: Currency) => void;
  addToCart: (release: Release, vIdx: number) => void;
  updateQty: (id: string, vIdx: number, delta: number) => void;
  removeItem: (id: string, vIdx: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readCurrencyCookie(): Currency {
  if (typeof document === "undefined") return DEFAULT_CURRENCY;
  const match = document.cookie.match(/(?:^|;\s*)ea_currency=([^;]+)/);
  const val = match?.[1];
  return val === "gbp" || val === "pln" ? val : DEFAULT_CURRENCY;
}

function saveCurrencyCookie(c: Currency) {
  document.cookie = `${CURRENCY_COOKIE}=${c};path=/;max-age=31536000;samesite=lax`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const [toast, setToast] = useState("");
  const [products, setProducts] = useState<Release[]>([]);
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const snapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionId = useRef<string | null>(null);

  function getSessionId(): string {
    if (sessionId.current) return sessionId.current;
    const stored = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("ea:sid") : null;
    if (stored) { sessionId.current = stored; return stored; }
    const id = crypto.randomUUID();
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem("ea:sid", id);
    sessionId.current = id;
    return id;
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ea:cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {}
    const hasCookie = !!document.cookie.match(/(?:^|;\s*)ea_currency=/);
    if (hasCookie) {
      setCurrencyState(readCurrencyCookie());
    } else if (navigator.language.startsWith("pl")) {
      setCurrencyState("pln");
    }
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Release[]) => setProducts(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("ea:cart", JSON.stringify(cart));
  }, [cart]);

  // Debounced live cart snapshot (2s delay, only when cart has items)
  useEffect(() => {
    if (cart.length === 0) return;
    if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    snapshotTimer.current = setTimeout(() => {
      const sid = getSessionId();
      const items = cart.flatMap((c) => {
        const release = products.find((p) => p.id === c.id);
        const variant = release?.variants[c.vIdx];
        if (!release || !variant) return [];
        return [{ title: release.title, variant: variant.k, qty: c.qty, unitPrice: variantPrice(variant, currency) }];
      });
      const totalCents = items.reduce((s, i) => s + Math.round(i.unitPrice * 100) * i.qty, 0);
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "cart_snapshot", sessionId: sid, items, currency, totalCents }),
      }).catch(() => {});
    }, 2000);
  }, [cart, currency, products]);

  const setCurrency = useCallback((c: Currency) => {
    saveCurrencyCookie(c);
    setCurrencyState(c);
  }, []);

  const addToCart = useCallback((release: Release, vIdx: number) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === release.id && c.vIdx === vIdx);
      if (exists) {
        return prev.map((c) => (c === exists ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { id: release.id, vIdx, qty: 1 }];
    });
    setBump(true);
    setTimeout(() => setBump(false), 400);
    setToast(`+ ${release.title} — ${release.variants[vIdx].k}`);
    setTimeout(() => setToast(""), 1800);
    // Track cart event
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "cart", event: "add" }),
    }).catch(() => {});
  }, []);

  const updateQty = useCallback((id: string, vIdx: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id && c.vIdx === vIdx ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  }, []);

  const removeItem = useCallback((id: string, vIdx: number) => {
    setCart((prev) => prev.filter((c) => !(c.id === id && c.vIdx === vIdx)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        bump,
        cartOpen,
        toast,
        products,
        currency,
        setCurrency,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        openCart: () => setCartOpen(true),
        closeCart: () => setCartOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
