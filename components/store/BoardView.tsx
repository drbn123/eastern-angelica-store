"use client";

import Cover from "@/components/Cover";
import { RELEASES } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";

const PINS = [
  { size: "lg", top: 60, left: 40, rot: -4 },
  { size: "md", top: 140, left: 380, rot: 3 },
  { size: "sm", top: 340, left: 100, rot: -2 },
  { size: "lg", top: 420, left: 720, rot: 5 },
  { size: "md", top: 540, left: 300, rot: -3 },
  { size: "sm", top: 760, left: 620, rot: 2 },
  { size: "md", top: 860, left: 60, rot: 4 },
  { size: "lg", top: 980, left: 420, rot: -2 },
];

export default function BoardView() {
  const { cart, addToCart } = useCart();

  return (
    <section className="v2">
      <div className="hero">
        <h1>
          the <i>pinboard</i>
        </h1>
        <div className="tag">
          <b>cork / collage</b> — everything happening with us laid out like on a table. Click,
          hold, add to cart. <br />
          <br />
          Covers, posters, zine fragments, prototypes. Current releases — all in one frame.
        </div>
      </div>

      <div className="board">
        <div className="tape-label" style={{ top: 20, left: 40, transform: "rotate(-4deg)" }}>
          → fresh
        </div>
        <div
          className="tape-label"
          style={{ top: 900, right: 60, transform: "rotate(3deg)" } as React.CSSProperties}
        >
          merch / winter 25
        </div>
        <div
          className="tape-label"
          style={{ bottom: 40, left: "40%", transform: "rotate(-2deg)" }}
        >
          pre-order
        </div>

        {RELEASES.map((r, i) => {
          const pin = PINS[i % PINS.length];
          const vIdx = 0;
          const inCart = cart.some((c) => c.id === r.id && c.vIdx === vIdx);
          return (
            <div
              key={r.id}
              className={`pin ${pin.size}`}
              style={{ top: pin.top, left: pin.left, transform: `rotate(${pin.rot}deg)` }}
            >
              <div className="tape" />
              <div style={{ position: "relative" }}>
                <Cover idx={i} release={r} />
                <button
                  className={`quick${inCart ? " added" : ""}`}
                  onClick={() => addToCart(r, vIdx)}
                  aria-label="Add to cart"
                >
                  {inCart ? "✓" : "+"}
                </button>
              </div>
              <div className="info">
                <div>
                  <div className="artist">{r.artist}</div>
                  <h3>{r.title}</h3>
                </div>
                <div className="price">€{r.price}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
