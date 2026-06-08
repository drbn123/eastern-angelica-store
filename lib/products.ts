import { randomUUID } from "crypto";
import type { Release } from "./types";

const useKV = () => !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
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

export async function readProducts(): Promise<Release[]> {
  if (useKV()) {
    const redis = await getRedis();
    let cached = await redis.get<Release[] | string>("products");
    // Handle old double-encoded data
    if (typeof cached === "string") { try { cached = JSON.parse(cached); } catch { cached = null; } }
    if (Array.isArray(cached) && cached.length > 0) return cached as Release[];
    // First deploy — seed from committed products.json
    const initial = fsReadProducts();
    if (initial.length > 0) {
      await redis.set("products", JSON.stringify(initial));
    }
    return initial;
  }
  return fsReadProducts();
}

async function writeProducts(products: Release[]): Promise<void> {
  if (useKV()) {
    const redis = await getRedis();
    await redis.set("products", products);
    return;
  }
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
