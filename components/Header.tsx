"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/store", label: "Store" },
  { href: "/videos", label: "Videos" },
  { href: "/journal", label: "Journal" },
];

export default function Header() {
  const pathname = usePathname();
  const { cartCount, bump, openCart } = useCart();

  return (
    <header className="main">
      <nav className="nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={pathname === n.href ? "active" : ""}>
            {n.label}
          </Link>
        ))}
      </nav>

      <div />

      <div className="right">
        <span style={{ color: "var(--fg-dim)", cursor: "pointer" }}>Search</span>
        <button className={`cart-btn${bump ? " bump" : ""}`} onClick={openCart}>
          Cart <span className="count">{String(cartCount).padStart(2, "0")}</span>
        </button>
      </div>
    </header>
  );
}
