"use client";

const ITEMS = [
  "Eastern Angelica — out now on marbled amber / 48 copies left",
  "Free shipping on 2+ vinyls in PL",
  "Pre-order KZK-008 longsleeve",
  "Shipping worldwide from Warszawa",
  "Zine included with every digipak",
];

export default function TopStrip() {
  const text = `${ITEMS.join("  ·  ")}  ·  ${ITEMS.join("  ·  ")}`;
  return (
    <div className="topstrip">
      <span className="tiny up">● live</span>
      <div className="marquee">
        <span>{text}</span>
      </div>
      <span className="tiny up">EU / PLN · EUR · USD</span>
    </div>
  );
}
