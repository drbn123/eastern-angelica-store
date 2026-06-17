export interface Variant {
  k: string;
  gbp: number;
  pln: number;
}

export interface Release {
  id: string;
  title: string;
  artist: string;
  format: string;
  edition: string;
  year: string;
  cat: string;
  price: { gbp: number; pln: number };
  variants: Variant[];
  tag: string;
  cover?: string;
  back?: string;
  placeholder?: boolean;
  descEn: string;
  descPl: string;
}

export interface CartItem {
  id: string;
  vIdx: number;
  qty: number;
}

export type ThemeMode = "dark" | "light";
export type AccentKey = "rust" | "amber" | "red" | "bone" | "cyan";
export type TypoKey = "mono-serif" | "all-mono" | "grotesk";

export interface Tweaks {
  theme: ThemeMode;
  accent: AccentKey;
  typo: TypoKey;
}

export type StoreLayout = "v1" | "v2" | "v3";
