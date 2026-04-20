"use client";

import { useEffect, useState } from "react";
import Cover from "@/components/Cover";
import { RELEASES } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";

const CAT_NAMES: Record<string, string> = {
  LP: "long-play vinyl",
  '12"': "12-inch vinyl",
  '7"': "7-inch single",
  CD: "compact disc",
  CS: "compact cassette",
  TEE: "t-shirt",
  LS: "longsleeve",
  BOOK: "hardcover book",
};

export default function ZineView() {
  const { cart, addToCart } = useCart();
  const [idx, setIdx] = useState(0);
  const [vIdx, setVIdx] = useState(0);

  const r = RELEASES[idx];
  const safeVIdx = Math.min(vIdx, r.variants.length - 1);
  const variant = r.variants[safeVIdx];
  const inCartItem = cart.find((c) => c.id === r.id && c.vIdx === safeVIdx);
  const catName = CAT_NAMES[r.format] ?? r.format.toLowerCase();

  const go = (d: number) => {
    setIdx((i) => (i + d + RELEASES.length) % RELEASES.length);
    setVIdx(0);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <section className="v3">
      <div className="hero">
        <h1>↓ EA / Catalogue</h1>
        <span className="date">
          press → spring 2026 · no.{" "}
          {String(idx + 1).padStart(2, "0")}/{String(RELEASES.length).padStart(2, "0")}
        </span>
        <div className="xl">
          <i>browse</i> <b>one</b> <i>by one</i>
        </div>
      </div>

      <div className="stack-nav">
        <span>{r.cat}</span>
        <div className="progress">
          <i style={{ width: `${((idx + 1) / RELEASES.length) * 100}%` }} />
        </div>
        <span>
          {String(idx + 1).padStart(2, "0")} / {String(RELEASES.length).padStart(2, "0")}
        </span>
        <div className="ctrls">
          <button onClick={() => go(-1)}>←</button>
          <button onClick={() => go(1)}>→</button>
        </div>
      </div>

      <div className="zine">
        <div className="art" data-idx={`№ ${r.cat}`} data-cat={catName}>
          <Cover idx={idx} release={r} />
        </div>
        <div className="meta">
          <div className="cat">release · {r.year}</div>
          <div>
            <div className="artist">{r.artist}</div>
            <h2>
              <i>{r.title}</i>
            </h2>
          </div>
          <p className="desc">{r.desc}</p>
          <dl className="dl">
            <dt>Format</dt>
            <dd>
              {r.format} · {catName}
            </dd>
            <dt>Edition</dt>
            <dd>{r.edition}</dd>
            <dt>Cat.</dt>
            <dd>{r.cat}</dd>
            <dt>Year</dt>
            <dd>{r.year}</dd>
          </dl>
          {r.variants.length > 1 && (
            <div>
              <div className="cat" style={{ marginBottom: 8, color: "var(--fg-dim)" }}>
                pick a variant
              </div>
              <div className="var-pills">
                {r.variants.map((v, i) => (
                  <button
                    key={i}
                    className={i === vIdx ? "on" : ""}
                    onClick={() => setVIdx(i)}
                  >
                    {v.k}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="buy">
            <div className="price-xl">
              €{variant.p}{" "}
              <span style={{ fontSize: 14, color: "var(--fg-dim)" }}>eur</span>
            </div>
            <button
              className={`buy-btn${inCartItem ? " added" : ""}`}
              onClick={() => addToCart(r, safeVIdx)}
            >
              {inCartItem ? `in cart (${inCartItem.qty}) · +` : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
