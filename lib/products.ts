import { randomUUID } from "crypto";
import type { Release, Variant } from "./types";

const useKV = () => !!process.env.KV_REST_API_URL;

async function kvGet<T>(key: string): Promise<T | null> {
  const { kv } = await import("@vercel/kv");
  return kv.get<T>(key);
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const { kv } = await import("@vercel/kv");
  await kv.set(key, value);
}

function fsReadProducts(): Release[] {
  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const file = path.join(process.cwd(), "data", "products.json");
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch { return []; }
}

function fsWriteProducts(products: Release[]): void {
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");
  fs.writeFileSync(path.join(process.cwd(), "data", "products.json"), JSON.stringify(products, null, 2));
}

// Approximate GBP→PLN rate used as fallback when pln price is missing/zero.
const PLN_RATE = 5.0;

// Handles old format {p: number} → {gbp, pln} transparently.
// When pln is 0/missing, falls back to gbp * PLN_RATE so the store
// never shows "0 zł" for products that were created before PLN support.
function normalizeProduct(raw: unknown): Release {
  const r = raw as Record<string, unknown>;
  const rawPrice = typeof r.price === "number"
    ? { gbp: r.price as number, pln: 0 }
    : (r.price as { gbp: number; pln: number }) ?? { gbp: 0, pln: 0 };
  const price = {
    gbp: rawPrice.gbp,
    pln: rawPrice.pln || Math.round(rawPrice.gbp * PLN_RATE),
  };

  const variants: Variant[] = ((r.variants ?? []) as Record<string, unknown>[]).map((v) => {
    let gbp: number, pln: number, k: string;
    if (typeof (v as { p?: number }).p === "number") {
      gbp = (v as { p: number }).p;
      pln = 0;
      k = v.k as string;
    } else {
      const vt = v as unknown as Variant;
      gbp = vt.gbp; pln = vt.pln; k = vt.k;
    }
    return { k, gbp, pln: pln || Math.round(gbp * PLN_RATE) };
  });

  return { ...(r as unknown as Release), price, variants };
}

export async function readProducts(): Promise<Release[]> {
  if (useKV()) {
    const cached = await kvGet<unknown[]>("products");
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached.map(normalizeProduct);
    }
    const initial = fsReadProducts();
    if (initial.length > 0) await kvSet("products", initial);
    return initial;
  }
  const raw = fsReadProducts() as unknown[];
  return raw.map(normalizeProduct);
}

async function writeProducts(products: Release[]): Promise<void> {
  if (useKV()) { await kvSet("products", products); return; }
  fsWriteProducts(products);
}

export async function createProduct(data: Omit<Release, "id">): Promise<Release> {
  const products = await readProducts();
  const product: Release = { id: randomUUID(), ...data };
  await writeProducts([...products, product]);
  return product;
}

export async function updateProduct(id: string, data: Partial<Omit<Release, "id">>): Promise<Release | null> {
  const products = await readProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...data };
  await writeProducts(products);
  return products[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await readProducts();
  const next = products.filter((p) => p.id !== id);
  if (next.length === products.length) return false;
  await writeProducts(next);
  return true;
}
