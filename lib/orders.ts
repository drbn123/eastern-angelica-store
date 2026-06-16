import { randomUUID } from "crypto";
import type { Currency } from "./money";

export type OrderStatus = "pending" | "paid" | "fulfilled" | "shipped" | "cancelled" | "refunded";

export interface OrderItem {
  id: string;
  title: string;
  variant: string;
  qty: number;
  unitPrice: number;
  currency: Currency;
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
  totalCents: number;
  email: string;
  address: OrderAddress | null;
  stripeSessionId: string;
  stripePaymentIntent?: string;
  createdAt: string;
  paidAt?: string;
  note?: string;
}

const useKV = () => !!process.env.KV_REST_API_URL;

async function kv() {
  const { kv: client } = await import("@vercel/kv");
  return client;
}

async function nextOrderNumber(): Promise<number> {
  const client = await kv();
  const n = await client.incr("orders:counter");
  return n + 999;
}

export async function createOrder(data: Omit<Order, "id" | "number" | "createdAt">): Promise<Order> {
  const order: Order = {
    id: randomUUID(),
    number: await nextOrderNumber(),
    createdAt: new Date().toISOString(),
    ...data,
  };

  if (useKV()) {
    const client = await kv();
    await client.set(`order:${order.id}`, order);
    await client.lpush("orders", order.id);
  }

  return order;
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!useKV()) return null;
  const client = await kv();
  return client.get<Order>(`order:${id}`);
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
  if (!useKV()) return null;
  const client = await kv();
  const existing = await client.get<Order>(`order:${id}`);
  if (!existing) return null;
  const updated = { ...existing, ...data };
  await client.set(`order:${id}`, updated);
  return updated;
}

export async function getOrderByStripeSession(sessionId: string): Promise<Order | null> {
  if (!useKV()) return null;
  const client = await kv();
  const ids = await client.lrange<string>("orders", 0, -1);
  if (!ids.length) return null;
  const orders = await client.mget<Order[]>(...ids.map((id) => `order:${id}`));
  return orders.find((o) => o?.stripeSessionId === sessionId) ?? null;
}

export async function listOrders(limit = 100): Promise<Order[]> {
  if (!useKV()) return [];
  const client = await kv();
  const ids = await client.lrange<string>("orders", 0, limit - 1);
  if (!ids.length) return [];
  const orders = await client.mget<Order[]>(...ids.map((id) => `order:${id}`));
  return orders.filter((o): o is Order => !!o);
}
