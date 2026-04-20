"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/store", label: "Store" },
  { href: "/artists", label: "Artists" },
  { href: "/label", label: "Label" },
  { href: "/journal", label: "Journal" },
];

export default function Header() {
  const pathname = usePathname();
  const { cartCount, bump, openCart } = useCart();
  const { toggleTweaks } = useTheme();

  return (
    <header className="main">
      <nav className="nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={pathname === n.href ? "active" : ""}>
            {n.label}
          </Link>
        ))}
      </nav>

      <Link href="/" className="wordmark">
        <div className="wordmark-mark-wrap">
          <Image
            src="/assets/ea-monument.png"
            alt="EA"
            width={44}
            height={44}
            className="wordmark-mark"
          />
          <span className="wordmark-kuzko">kuzko</span>
        </div>
        <div className="wordmark-text">
          <span className="wordmark-italic">Eastern</span>
          <span className="wordmark-italic">Angelica</span>
        </div>
      </Link>

      <div className="right">
        <span style={{ color: "var(--fg-dim)", cursor: "pointer" }}>Search</span>
        <span style={{ color: "var(--fg-dim)", cursor: "pointer" }}>Account</span>
        <button className={`cart-btn${bump ? " bump" : ""}`} onClick={openCart}>
          Cart <span className="count">{String(cartCount).padStart(2, "0")}</span>
        </button>
        <button className="cart-btn" onClick={toggleTweaks} title="Tweaks">
          ⚙
        </button>
      </div>
    </header>
  );
}
