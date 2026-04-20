import type { Release } from "./types";

export const RELEASES: Release[] = [
  {
    id: "EA-001",
    title: "Eastern Angelica",
    artist: "Kuzko",
    format: "LP",
    edition: "Limited / 300",
    year: "2026",
    cat: "EA-001",
    price: 38,
    variants: [
      { k: "Black Vinyl", p: 38 },
      { k: "Marbled / Amber", p: 48 },
      { k: "Test Pressing", p: 120 },
    ],
    tag: "flagship",
    cover: "/assets/ea-front-inside.png",
    back: "/assets/ea-front-outside.png",
    desc: "Debut album — 11 tracks, recorded between the eastern edge and Warsaw. Cover: orthodox cathedral, partisan monument, street lamp. Produced by Luca Dixon, Purple Palado, Gruby Jeff, Matt Labudda, Theseus Ricketts, Lucas Clahar, Harry Collingwood.",
  },
  {
    id: "EA-002",
    title: "Brother Birch",
    artist: "Jawnino × Kuzko",
    format: "12\"",
    edition: "250",
    year: "2025",
    cat: "EA-002",
    price: 32,
    variants: [
      { k: "Bone White", p: 32 },
      { k: "Forest Green", p: 36 },
    ],
    tag: "split",
    desc: "Split EP. A-side — Jawnino, B-side — Kuzko. Recorded in an empty house on the eastern border.",
  },
  {
    id: "EA-003",
    title: "Katedra / Kaseta",
    artist: "MIKA łza",
    format: "CS",
    edition: "100",
    year: "2024",
    cat: "EA-003",
    price: 14,
    variants: [{ k: "Standard", p: 14 }],
    tag: "tape",
    desc: "Home demos on tape — lo-fi, hypnotic. Hand-dubbed, hand-numbered.",
  },
  {
    id: "EA-004",
    title: "Post-Concrete Poems",
    artist: "earl w. kuzko",
    format: "CD",
    edition: "Open",
    year: "2025",
    cat: "EA-004",
    price: 18,
    variants: [
      { k: "Jewel Case", p: 18 },
      { k: "Digipak + Zine", p: 26 },
    ],
    tag: "cd",
    desc: "Collaboration — Kuzko beats, Earl raps. Digipak includes a 24-page bilingual zine.",
  },
  {
    id: "EA-005",
    title: "Tee — Angelica Monument",
    artist: "Merch",
    format: "TEE",
    edition: "Pre-order",
    year: "2026",
    cat: "EA-M01",
    price: 35,
    variants: [
      { k: "S", p: 35 },
      { k: "M", p: 35 },
      { k: "L", p: 35 },
      { k: "XL", p: 35 },
    ],
    tag: "merch",
    desc: "Black t-shirt, 220 g/m² cotton, screen-printed monument mark on chest and back.",
  },
  {
    id: "EA-006",
    title: "Księga Snów",
    artist: "Kuzko (ed.)",
    format: "BOOK",
    edition: "1 / 500",
    year: "2025",
    cat: "EA-B01",
    price: 55,
    variants: [{ k: "Hardcover", p: 55 }],
    tag: "book",
    desc: "140-page photo book of brutalist architecture from the former eastern bloc.",
  },
  {
    id: "EA-007",
    title: "Radiotower",
    artist: "VY/VA",
    format: "7\"",
    edition: "200",
    year: "2024",
    cat: "EA-007",
    price: 16,
    variants: [
      { k: "Black", p: 16 },
      { k: "Swirl", p: 22 },
    ],
    tag: "single",
    desc: "Seven-inch single — two tracks in nine minutes. Fast, rough, tender.",
  },
  {
    id: "EA-008",
    title: "Longsleeve — Cathedral",
    artist: "Merch",
    format: "LS",
    edition: "Pre-order",
    year: "2026",
    cat: "EA-M02",
    price: 48,
    variants: [
      { k: "S", p: 48 },
      { k: "M", p: 48 },
      { k: "L", p: 48 },
    ],
    tag: "merch",
    desc: "Bone-white longsleeve. Front print, sleeves and back — quotes from Eastern Angelica.",
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
