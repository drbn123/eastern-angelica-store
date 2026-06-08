import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Release } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "products.json");

export function readProducts(): Release[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeProducts(products: Release[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

export function createProduct(data: Omit<Release, "id">): Release {
  const products = readProducts();
  const product: Release = { id: randomUUID(), ...data };
  writeProducts([...products, product]);
  return product;
}

export function updateProduct(id: string, data: Partial<Omit<Release, "id">>): Release | null {
  const products = readProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...data };
  writeProducts(products);
  return products[idx];
}

export function deleteProduct(id: string): boolean {
  const products = readProducts();
  const next = products.filter((p) => p.id !== id);
  if (next.length === products.length) return false;
  writeProducts(next);
  return true;
}
