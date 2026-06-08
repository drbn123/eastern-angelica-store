"use client";

const ITEMS = [
  "Eastern Angelica — out now on CD / digipak edition",
  "CD + POE-MAT bundle available",
  "Pre-order the EA Random Tee & Vest",
  "Shipping worldwide from London",
  "Zine included with every digipak",
];

export default function TopStrip() {
  const text = `${ITEMS.join("  ·  ")}  ·  ${ITEMS.join("  ·  ")}`;
  return (
    <div className="topstrip">
      <div className="marquee">
        <span>{text}</span>
      </div>
    </div>
  );
}
