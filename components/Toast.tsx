"use client";

import { useCart } from "@/context/CartContext";

export default function Toast() {
  const { toast } = useCart();
  return (
    <div className={`toast${toast ? " on" : ""}`}>
      <i /> {toast}
    </div>
  );
}
