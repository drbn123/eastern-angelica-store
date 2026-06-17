import { randomUUID } from "crypto";
import type { Currency } from "./money";

export type OrderStatus = "pending" | "paid" | "fulfilled" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface OrderItem {
  id: string;
  title: string;
  variant: string;
  qty: number;
  unitPrice: number;
  currency: Currency;
  imageUrl?: string;
}

export interface OrderAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  currency: Currency;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  shippingLabel?: string;
  totalCents: number;
  email: string;
  address: OrderAddress | null;
  stripeSessionId: string;
  stripePaymentIntent?: string;
  createdAt: string;
  paidAt?: string;
  trackingNumber?: string;
  note?: string;
}

const useKV = () => !!process.env.KV_REST_API_URL;

async function kvClient() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

// ── Local file fallback (dev / demo) ──────────────────────────────────────────

function fsReadOrders(): Order[] {
  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const file = path.join(process.cwd(), "data", "orders.json");
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch { return []; }
}

function fsWriteOrders(orders: Order[]): void {
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");
  fs.writeFileSync(
    path.join(process.cwd(), "data", "orders.json"),
    JSON.stringify(orders, null, 2),
  );
}

function fsNextOrderNumber(): number {
  const orders = fsReadOrders();
  return orders.length === 0 ? 1000 : Math.max(...orders.map((o) => o.number)) + 1;
}

// ── KV helpers ────────────────────────────────────────────────────────────────

async function kvNextOrderNumber(): Promise<number> {
  const client = await kvClient();
  const n = await client.incr("orders:counter");
  return n + 999;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createOrder(data: Omit<Order, "id" | "number" | "createdAt">): Promise<Order> {
  const order: Order = {
    id: randomUUID(),
    number: useKV() ? await kvNextOrderNumber() : fsNextOrderNumber(),
    createdAt: new Date().toISOString(),
    ...data,
  };

  if (useKV()) {
    const client = await kvClient();
    await client.set(`order:${order.id}`, order);
    await client.lpush("orders", order.id);
  } else {
    const orders = fsReadOrders();
    fsWriteOrders([order, ...orders]);
  }

  return order;
}

export async function getOrder(id: string): Promise<Order | null> {
  if (useKV()) {
    const client = await kvClient();
    return client.get<Order>(`order:${id}`);
  }
  return fsReadOrders().find((o) => o.id === id) ?? null;
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
  if (useKV()) {
    const client = await kvClient();
    const existing = await client.get<Order>(`order:${id}`);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    await client.set(`order:${id}`, updated);
    return updated;
  }
  const orders = fsReadOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...data };
  fsWriteOrders(orders);
  return orders[idx];
}

export async function getOrderByStripeSession(sessionId: string): Promise<Order | null> {
  if (useKV()) {
    const client = await kvClient();
    const ids = await client.lrange<string>("orders", 0, -1);
    if (!ids.length) return null;
    const orders = await client.mget<Order[]>(...ids.map((id) => `order:${id}`));
    return orders.find((o) => o?.stripeSessionId === sessionId) ?? null;
  }
  return fsReadOrders().find((o) => o.stripeSessionId === sessionId) ?? null;
}

export async function listOrders(limit = 100): Promise<Order[]> {
  if (useKV()) {
    const client = await kvClient();
    const ids = await client.lrange<string>("orders", 0, limit - 1);
    if (!ids.length) return [];
    const orders = await client.mget<Order[]>(...ids.map((id) => `order:${id}`));
    return orders.filter((o): o is Order => !!o);
  }
  return fsReadOrders().slice(0, limit);
}

export async function getOrderByNumberAndEmail(number: number, email: string): Promise<Order | null> {
  if (useKV()) {
    const client = await kvClient();
    const ids = await client.lrange<string>("orders", 0, -1);
    if (!ids.length) return null;
    const orders = await client.mget<Order[]>(...ids.map((id) => `order:${id}`));
    return orders.find((o) => o?.number === number && o.email.toLowerCase() === email.toLowerCase()) ?? null;
  }
  return fsReadOrders().find((o) => o.number === number && o.email.toLowerCase() === email.toLowerCase()) ?? null;
}
