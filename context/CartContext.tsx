"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem, Release } from "@/lib/types";

interface CartContextValue {
  cart: CartItem[];
  cartCount: number;
  bump: boolean;
  cartOpen: boolean;
  toast: string;
  addToCart: (release: Release, vIdx: number) => void;
  updateQty: (id: string, vIdx: number, delta: number) => void;
  removeItem: (id: string, vIdx: number) => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ea:cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("ea:cart", JSON.stringify(cart));
  }, [cart]);

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

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        bump,
        cartOpen,
        toast,
        addToCart,
        updateQty,
        removeItem,
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
