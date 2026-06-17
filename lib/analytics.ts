// Analytics library — stores page views and cart events in Vercel KV (Redis)

const useKV = () => !!process.env.KV_REST_API_URL;

async function kv() {
  const { kv: client } = await import("@vercel/kv");
  return client;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface PageViewEvent {
  ts: number;
  path: string;
  country: string;
  city: string;
  referrer: string;
}

export interface CartEvent {
  ts: number;
  type: "add" | "remove" | "checkout_start";
}

export interface LiveCartItem {
  title: string;
  variant: string;
  qty: number;
  unitPrice: number;
}

export interface LiveCart {
  sessionId: string;
  ts: number;
  items: LiveCartItem[];
  currency: string;
  totalCents: number;
}

export interface AnalyticsData {
  dailyViews: { date: string; count: number }[];
  totalViews30: number;
  totalViews7: number;
  topCountries: { country: string; count: number }[];
  topPaths: { path: string; count: number }[];
  topReferrers: { source: string; count: number }[];
  cartAdds: number;
  cartCheckoutStarts: number;
  cartAdds7: number;
  cartCheckoutStarts7: number;
  // Live — derived from orders passed in
  totalOrders: number;
  paidOrders: number;
  fulfilledOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
  revenueGBP: number;
  revenuePLN: number;
  topProducts: { title: string; qty: number }[];
}

// ── Write helpers ──────────────────────────────────────────────────────────

export async function trackPageView(event: Omit<PageViewEvent, "ts">): Promise<void> {
  if (!useKV()) return;
  const client = await kv();
  const now = Date.now();
  const dayKey = new Date(now).toISOString().slice(0, 10);

  const ev: PageViewEvent = { ...event, ts: now };

  await client.lpush("analytics:views", JSON.stringify(ev));
  await client.ltrim("analytics:views", 0, 4999);
  await client.incr(`analytics:day:${dayKey}`);

  if (event.country) {
    await client.zincrby("analytics:countries", 1, event.country);
  }

  const safePath = event.path.slice(0, 80);
  await client.zincrby("analytics:paths", 1, safePath || "/");

  if (event.referrer) {
    try {
      const host = new URL(event.referrer).hostname.replace(/^www\./, "");
      if (host) await client.zincrby("analytics:referrers", 1, host);
    } catch { /* ignore malformed URLs */ }
  } else {
    await client.zincrby("analytics:referrers", 1, "(direct)");
  }
}

export async function trackCartEvent(event: Omit<CartEvent, "ts">): Promise<void> {
  if (!useKV()) return;
  const client = await kv();
  const ev: CartEvent = { ...event, ts: Date.now() };
  await client.lpush("analytics:cart", JSON.stringify(ev));
  await client.ltrim("analytics:cart", 0, 9999);
}

/** Upsert a live cart snapshot with 10-minute TTL. */
export async function trackCartSnapshot(snapshot: LiveCart): Promise<void> {
  if (!useKV()) return;
  const client = await kv();
  const key = `live:cart:${snapshot.sessionId}`;
  await Promise.all([
    client.set(key, JSON.stringify(snapshot), { ex: 600 }),
    client.zadd("live:carts", { score: snapshot.ts, member: snapshot.sessionId }),
  ]);
}

// ── Read helpers ───────────────────────────────────────────────────────────

/** Return all carts updated in the last 10 minutes. */
export async function getActiveCarts(): Promise<LiveCart[]> {
  if (!useKV()) return [];
  const client = await kv();
  const cutoff = Date.now() - 10 * 60 * 1000;

  // Prune stale entries from the sorted set
  await client.zremrangebyscore("live:carts", 0, cutoff);

  const sessionIds = await client.zrange<string[]>("live:carts", 0, -1, { rev: true });
  if (!sessionIds.length) return [];

  const keys = sessionIds.map((id) => `live:cart:${id}`);
  const raws = await client.mget<string[]>(...keys);

  const carts: LiveCart[] = [];
  for (const raw of raws) {
    if (!raw) continue;
    try {
      const c = typeof raw === "string" ? JSON.parse(raw) : raw;
      carts.push(c as LiveCart);
    } catch { /* skip */ }
  }
  return carts;
}

export async function getAnalytics(): Promise<Omit<AnalyticsData, "totalOrders" | "paidOrders" | "fulfilledOrders" | "shippedOrders" | "cancelledOrders" | "revenueGBP" | "revenuePLN" | "topProducts">> {
  if (!useKV()) return emptyAnalytics();

  const client = await kv();
  const now = Date.now();
  const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;
  const cutoff7  = now -  7 * 24 * 60 * 60 * 1000;

  // Daily view counts (last 14 days)
  const dailyViews: { date: string; count: number }[] = [];
  const dateKeys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    dateKeys.push(d.toISOString().slice(0, 10));
  }
  const dailyCounts = await Promise.all(
    dateKeys.map((k) => client.get<number>(`analytics:day:${k}`))
  );
  for (let i = 0; i < dateKeys.length; i++) {
    dailyViews.push({ date: dateKeys[i], count: (dailyCounts[i] as number) || 0 });
  }

  // Views totals from raw event list
  const rawViews = await client.lrange<string>("analytics:views", 0, 4999);
  let totalViews30 = 0;
  let totalViews7 = 0;
  for (const raw of rawViews) {
    try {
      const ev = typeof raw === "string" ? JSON.parse(raw) as PageViewEvent : raw as unknown as PageViewEvent;
      if (ev.ts >= cutoff30) totalViews30++;
      if (ev.ts >= cutoff7)  totalViews7++;
    } catch { /* skip */ }
  }

  // Top countries
  const countriesRaw = await client.zrange<string[]>("analytics:countries", 0, 9, { rev: true, withScores: true });
  const topCountries: { country: string; count: number }[] = [];
  for (let i = 0; i < countriesRaw.length; i += 2) {
    topCountries.push({ country: String(countriesRaw[i]), count: Number(countriesRaw[i + 1]) });
  }

  // Top paths
  const pathsRaw = await client.zrange<string[]>("analytics:paths", 0, 9, { rev: true, withScores: true });
  const topPaths: { path: string; count: number }[] = [];
  for (let i = 0; i < pathsRaw.length; i += 2) {
    topPaths.push({ path: String(pathsRaw[i]), count: Number(pathsRaw[i + 1]) });
  }

  // Cart events — both 7d and 30d
  const rawCart = await client.lrange<string>("analytics:cart", 0, 9999);
  let cartAdds = 0, cartCheckoutStarts = 0;
  let cartAdds7 = 0, cartCheckoutStarts7 = 0;
  for (const raw of rawCart) {
    try {
      const ev = typeof raw === "string" ? JSON.parse(raw) as CartEvent : raw as unknown as CartEvent;
      if (ev.ts >= cutoff30) {
        if (ev.type === "add") cartAdds++;
        if (ev.type === "checkout_start") cartCheckoutStarts++;
      }
      if (ev.ts >= cutoff7) {
        if (ev.type === "add") cartAdds7++;
        if (ev.type === "checkout_start") cartCheckoutStarts7++;
      }
    } catch { /* skip */ }
  }

  // Top referrers
  const referrersRaw = await client.zrange<string[]>("analytics:referrers", 0, 9, { rev: true, withScores: true });
  const topReferrers: { source: string; count: number }[] = [];
  for (let i = 0; i < referrersRaw.length; i += 2) {
    topReferrers.push({ source: String(referrersRaw[i]), count: Number(referrersRaw[i + 1]) });
  }

  return { dailyViews, totalViews30, totalViews7, topCountries, topPaths, topReferrers, cartAdds, cartCheckoutStarts, cartAdds7, cartCheckoutStarts7 };
}

function emptyAnalytics() {
  const dailyViews: { date: string; count: number }[] = [];
  const now = Date.now();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    dailyViews.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return { dailyViews, totalViews30: 0, totalViews7: 0, topCountries: [], topPaths: [], topReferrers: [], cartAdds: 0, cartCheckoutStarts: 0, cartAdds7: 0, cartCheckoutStarts7: 0 };
}
