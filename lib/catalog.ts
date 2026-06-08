import type { Release } from "./types";

export const RELEASES: Release[] = [
  {
    id: "EA-001CD",
    title: "Eastern Angelica",
    artist: "Kuzko",
    format: "CD",
    edition: "Digipak / 500",
    year: "2026",
    cat: "EA-001CD",
    price: 16,
    variants: [
      { k: "Digipak CD", p: 16 },
      { k: "Digipak + Zine", p: 22 },
    ],
    tag: "cd",
    cover: "/assets/ea-cd.gif",
    back: "/assets/ea-jcard-outside.png",
    desc: "Debut album on CD — 11 tracks in a 4-panel digipak with the full Eastern Angelica artwork. Snowfall · 9 Gram · Praise The Flag (ft. Luca Dixon) · 747 · Baptist · Billie Jean (ft. Luca Dixon) · Art B (ft. Jeffrey) · Indulgence · Nevermind · Green Crystal Freestyle · Nail.",
  },
  {
    id: "EA-BOOK",
    title: "POE-MAT",
    artist: "Kuzko",
    format: "BOOK",
    edition: "First edition",
    year: "2026",
    cat: "EA-B01",
    price: 25,
    variants: [{ k: "Paperback", p: 25 }],
    tag: "book",
    placeholder: true,
    desc: "POE-MAT — book of poems by Kuzko. [Placeholder — final cover and details TBC.]",
  },
  {
    id: "EA-BUNDLE",
    title: "Eastern Angelica CD + POE-MAT",
    artist: "Kuzko",
    format: "BUNDLE",
    edition: "Bundle",
    year: "2026",
    cat: "EA-BND01",
    price: 35,
    variants: [{ k: "CD + Book", p: 35 }],
    tag: "bundle",
    placeholder: true,
    desc: "Bundle — Eastern Angelica CD together with the POE-MAT book. [Placeholder — final artwork and pricing TBC.]",
  },
  {
    id: "EA-005",
    title: "EA Random Tee",
    artist: "Merch",
    format: "TEE",
    edition: "Pre-order",
    year: "2026",
    cat: "EA-M01",
    price: 35,
    variants: [
      { k: "White / Black print", p: 35 },
      { k: "Camo / Pink print", p: 35 },
    ],
    tag: "merch",
    cover: "/assets/ea-tee-white.png",
    back: "/assets/ea-tee-camo.png",
    desc: "Heavyweight cotton tee, 220 g/m². Full Eastern Angelica coordinates back-print with the monument mark. Two variants — white with black print, or camo with pink print.",
  },
  {
    id: "EA-VEST",
    title: "EA Vest",
    artist: "Merch",
    format: "VEST",
    edition: "Pre-order",
    year: "2026",
    cat: "EA-M03",
    price: 45,
    variants: [
      { k: "S", p: 45 },
      { k: "M", p: 45 },
      { k: "L", p: 45 },
      { k: "XL", p: 45 },
    ],
    tag: "merch",
    placeholder: true,
    desc: "EA Vest — Eastern Angelica branded vest. [Placeholder — final photo and details TBC.]",
  },
];

const PALETTES = [
  { a: "#3a2a1f", b: "#7a3a1a", c: "#c75334", d: "#e4b98b" },
  { a: "#1b2a2a", b: "#2e4a46", c: "#6ab6b6", d: "#c7d9b8" },
  { a: "#1a1424", b: "#3c2a4e", c: "#7a5aa0", d: "#e0c6e6" },
  { a: "#2a1a0f", b: "#5a2a1a", c: "#a04530", d: "#d4a24c" },
  { a: "#14181c", b: "#2a3340", c: "#6a7f9a", d: "#c4cfd8" },
  { a: "#221a12", b: "#4e3820", c: "#9a7340", d: "#e8c98a" },
  { a: "#0f1a14", b: "#264030", c: "#5a7a50", d: "#b8cc9a" },
  { a: "#1a0e0a", b: "#4a1a12", c: "#9e2a1c", d: "#e8ded0" },
];

export function coverSvg(i: number): string {
  const p = PALETTES[i % PALETTES.length];
  const kind = i % 8;
  const covers = [
    `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${p.a}"/>
      <rect x="0" y="220" width="400" height="180" fill="${p.b}"/>
      <path d="M120 400 L120 240 Q120 150 200 150 Q280 150 280 240 L280 400 Z" fill="${p.c}"/>
      <path d="M160 400 L160 280 Q160 230 200 230 Q240 230 240 280 L240 400 Z" fill="${p.a}"/>
      <circle cx="200" cy="100" r="34" fill="${p.d}" opacity="0.9"/>
      <g stroke="${p.d}" stroke-width="1" opacity="0.45">
        <line x1="0" y1="60" x2="400" y2="60"/>
        <line x1="0" y1="80" x2="400" y2="80"/>
      </g>
    </svg>`,
    `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${p.b}"/>
      <g transform="translate(200 200)">
        ${Array.from({ length: 8 }, (_, k) => `<ellipse cx="0" cy="-90" rx="36" ry="80" fill="${p.c}" transform="rotate(${k * 45})" opacity="0.9"/>`).join("")}
        ${Array.from({ length: 8 }, (_, k) => `<ellipse cx="0" cy="-60" rx="20" ry="50" fill="${p.d}" transform="rotate(${k * 45 + 22.5})" opacity="0.85"/>`).join("")}
        <circle r="34" fill="${p.a}"/>
        <circle r="18" fill="${p.d}"/>
      </g>
    </svg>`,
    `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${p.a}"/>
      <rect x="40" y="280" width="320" height="120" fill="${p.b}"/>
      <rect x="70" y="200" width="260" height="90" fill="${p.c}"/>
      <rect x="110" y="130" width="180" height="80" fill="${p.b}"/>
      <rect x="150" y="80" width="100" height="60" fill="${p.c}"/>
      <g fill="${p.d}" opacity="0.8">
        ${Array.from({ length: 8 }, (_, k) => `<rect x="${90 + k * 30}" y="230" width="6" height="30"/>`).join("")}
        ${Array.from({ length: 5 }, (_, k) => `<rect x="${130 + k * 30}" y="155" width="6" height="24"/>`).join("")}
      </g>
    </svg>`,
    `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g${i}" cx="50%" cy="55%" r="60%">
          <stop offset="0%" stop-color="${p.d}"/>
          <stop offset="50%" stop-color="${p.c}"/>
          <stop offset="100%" stop-color="${p.a}"/>
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill="url(#g${i})"/>
      <g fill="${p.a}" opacity="0.5">
        <ellipse cx="100" cy="160" rx="180" ry="30"/>
        <ellipse cx="320" cy="260" rx="180" ry="22"/>
        <ellipse cx="180" cy="320" rx="220" ry="18"/>
      </g>
      <circle cx="260" cy="140" r="22" fill="${p.d}" opacity="0.9"/>
    </svg>`,
    `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${p.a}"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<rect x="0" y="${k * 40}" width="400" height="${k % 2 ? 12 : 28}" fill="${k % 3 ? p.c : p.d}" opacity="${0.6 + (k % 3) * 0.12}"/>`).join("")}
    </svg>`,
    `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${p.a}"/>
      <ellipse cx="200" cy="170" rx="90" ry="110" fill="${p.b}"/>
      <ellipse cx="200" cy="380" rx="180" ry="120" fill="${p.c}"/>
      <ellipse cx="200" cy="160" rx="60" ry="82" fill="${p.d}" opacity="0.55"/>
      <g fill="${p.a}" opacity="0.6">
        <rect x="0" y="0" width="400" height="18"/>
        <rect x="0" y="382" width="400" height="18"/>
      </g>
    </svg>`,
    `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${p.b}"/>
      <rect x="40" y="40" width="320" height="320" fill="none" stroke="${p.d}" stroke-width="2"/>
      <path d="M200 80 L200 320 M90 200 L310 200" stroke="${p.d}" stroke-width="10"/>
      <path d="M140 140 L260 140 M140 260 L260 260" stroke="${p.c}" stroke-width="4"/>
      <circle cx="200" cy="200" r="50" fill="${p.c}"/>
      <circle cx="200" cy="200" r="20" fill="${p.a}"/>
    </svg>`,
    `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" fill="${p.c}"/>
      <rect y="260" width="400" height="140" fill="${p.a}"/>
      <path d="M0 260 L60 200 L110 240 L180 170 L240 220 L310 180 L400 230 L400 260 Z" fill="${p.b}"/>
      <circle cx="300" cy="120" r="40" fill="${p.d}"/>
    </svg>`,
  ];
  return covers[kind];
}
