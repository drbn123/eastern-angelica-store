"use client";

import { useState } from "react";
import Cover from "@/components/Cover";
import { RELEASES } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";

const FILTERS: [string, string][] = [
  ["all", "All"],
  ["vinyl", "Vinyl"],
  ["cd", "CD"],
  ["tape", "Tape"],
  ["merch", "Merch"],
  ["book", "Books"],
];

function matchFilter(format: string, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "vinyl") return ["LP", '12"', '7"'].includes(format);
  if (filter === "cd") return format === "CD";
  if (filter === "tape") return format === "CS";
  if (filter === "merch") return ["TEE", "LS"].includes(format);
  if (filter === "book") return format === "BOOK";
  return true;
}

export default function GridView() {
  const { cart, addToCart } = useCart();
  const [filter, setFilter] = useState("all");
  const [picks, setPicks] = useState<Record<string, number>>(
    () => Object.fromEntries(RELEASES.map((r) => [r.id, 0]))
  );

  const shown = RELEASES.filter((r) => matchFilter(r.format, filter));

  return (
    <section className="v1">
      <div className="hero">
        <h1>
          <i>Catalogue —</i> <b>everything we&apos;ve released.</b>
        </h1>
        <p className="blurb">
          Independent label out of Warsaw. Vinyl, tapes, CDs, books and shirts. Every release
          hand-numbered, wrapped in recycled paper, shipped on Mondays.
        </p>
        <div className="meta">
          <span>04 / 2026</span>
          <span>08 titles</span>
          <span>·</span>
        </div>
      </div>

      <div className="filterbar">
        <div className="chips">
          {FILTERS.map(([k, v]) => (
            <button
              key={k}
              className={`chip${filter === k ? " on" : ""}`}
              onClick={() => setFilter(k)}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="dim">Sort → newest ↓</span>
      </div>

      <div className="grid">
        {shown.map((r, i) => {
          const vIdx = picks[r.id] ?? 0;
          const variant = r.variants[vIdx];
          const inCartItem = cart.find((c) => c.id === r.id && c.vIdx === vIdx);
          const added = !!inCartItem;
          const globalIdx = RELEASES.indexOf(r);
          return (
            <article key={r.id} className="card">
              <span className="idx">№ {String(i + 1).padStart(2, "0")}</span>
              <Cover idx={globalIdx} release={r} />
              <div className="title-row">
                <div>
                  <div className="artist">{r.artist}</div>
                  <h3>{r.title}</h3>
                </div>
                <div className="price">€{variant.p}</div>
              </div>
              <dl className="kv">
                <dt>Format</dt>
                <dd>
                  <b>{r.format}</b>
                </dd>
                <dt>Edition</dt>
                <dd>
                  <b>{r.edition}</b>
                </dd>
                <dt>Year</dt>
                <dd>
                  <b>{r.year}</b>
                </dd>
                <dt>Cat.</dt>
                <dd>
                  <b>{r.cat}</b>
                </dd>
              </dl>
              <div className="foot">
                {r.variants.length > 1 && (
                  <select
                    className="var-select"
                    value={vIdx}
                    onChange={(e) => setPicks({ ...picks, [r.id]: +e.target.value })}
                  >
                    {r.variants.map((v, vi) => (
                      <option key={vi} value={vi}>
                        {v.k} — €{v.p}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className={`add${added ? " added" : ""}`}
                  onClick={() => addToCart(r, vIdx)}
                >
                  {added ? `↑ in cart (${inCartItem.qty})` : "+ Add to cart"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
