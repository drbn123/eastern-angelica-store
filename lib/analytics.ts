// Analytics library — stores page views and cart events in Vercel KV (Redis)

const useKV = () => !!process.env.KV_REST_API_URL;

async function kv() {
  const { kv: client } = await import("@vercel/kv");
  return client;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface PageViewEvent {
  ts: number;      // unix ms
  path: string;
  country: string; // ISO 3166-1 alpha-2, e.g. "PL", "GB", "" if unknown
  city: string;
  referrer: string;
}

export interface CartEvent {
  ts: number;
  type: "add" | "remove" | "checkout_start";
}

export interface AnalyticsData {
  // Page views per day (last 14 days), key = "YYYY-MM-DD"
  dailyViews: { date: string; count: number }[];
  // Total views (last 30 days)
  totalViews30: number;
  // Total views (last 7 days)
  totalViews7: number;
  // Top countries: { country: "PL", count: 5 }[]
  topCountries: { country: string; count: number }[];
  // Top paths: { path: "/store", count: 12 }[]
  topPaths: { path: string; count: number }[];
  // Cart events (last 30 days)
  cartAdds: number;
  cartCheckoutStarts: number;
  // Live — derived from orders passed in
  totalOrders: number;
  paidOrders: number;
  fulfilledOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
  revenueGBP: number;  // in pence
  revenuePLN: number;  // in grosz
  // Top products from order data
  topProducts: { title: string; qty: number }[];
}

// ── Write helpers ──────────────────────────────────────────────────────────

/** Call this from the API route when a page view arrives. */
export async function trackPageView(event: Omit<PageViewEvent, "ts">): Promise<void> {
  if (!useKV()) return;
  const client = await kv();
  const now = Date.now();
  const dayKey = new Date(now).toISOString().slice(0, 10); // "YYYY-MM-DD"

  const ev: PageViewEvent = { ...event, ts: now };

  // Append to a capped list (keep last 5000 events)
  await client.lpush("analytics:views", JSON.stringify(ev));
  await client.ltrim("analytics:views", 0, 4999);

  // Increment daily counter
  await client.incr(`analytics:day:${dayKey}`);

  // Increment country counter
  if (event.country) {
    await client.zincrby("analytics:countries", 1, event.country);
  }

  // Increment path counter
  const safePath = event.path.slice(0, 80); // guard against huge paths
  await client.zincrby("analytics:paths", 1, safePath || "/");
}

/** Call this when a cart event happens (client-side via API). */
export async function trackCartEvent(event: Omit<CartEvent, "ts">): Promise<void> {
  if (!useKV()) return;
  const client = await kv();
  const ev: CartEvent = { ...event, ts: Date.now() };
  await client.lpush("analytics:cart", JSON.stringify(ev));
  await client.ltrim("analytics:cart", 0, 9999);
}

// ── Read helpers ───────────────────────────────────────────────────────────

/** Fetch all analytics data for the admin dashboard. */
export async function getAnalytics(): Promise<Omit<AnalyticsData, "totalOrders" | "paidOrders" | "fulfilledOrders" | "shippedOrders" | "cancelledOrders" | "revenueGBP" | "revenuePLN" | "topProducts">> {
  if (!useKV()) {
    return emptyAnalytics();
  }

  const client = await kv();
  const now = Date.now();
  const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;
  const cutoff7  = now -  7 * 24 * 60 * 60 * 1000;

  // --- Daily view counts (last 14 days from Redis keys) ---
  const dailyViews: { date: string; count: number }[] = [];
  const dateKeys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dateKeys.push(key);
  }

  const dailyCounts = await Promise.all(
    dateKeys.map((k) => client.get<number>(`analytics:day:${k}`))
  );
  for (let i = 0; i < dateKeys.length; i++) {
    dailyViews.push({ date: dateKeys[i], count: (dailyCounts[i] as number) || 0 });
  }

  // --- Views from raw event list for time-range totals ---
  const rawViews = await client.lrange<string>("analytics:views", 0, 4999);
  let totalViews30 = 0;
  let totalViews7 = 0;
  for (const raw of rawViews) {
    try {
      const ev = typeof raw === "string" ? JSON.parse(raw) as PageViewEvent : raw as unknown as PageViewEvent;
      if (ev.ts >= cutoff30) totalViews30++;
      if (ev.ts >= cutoff7)  totalViews7++;
    } catch { /* skip malformed */ }
  }

  // --- Top countries (sorted set, descending) ---
  const countriesRaw = await client.zrange<string[]>("analytics:countries", 0, 9, { rev: true, withScores: true });
  const topCountries: { country: string; count: number }[] = [];
  for (let i = 0; i < countriesRaw.length; i += 2) {
    topCountries.push({ country: String(countriesRaw[i]), count: Number(countriesRaw[i + 1]) });
  }

  // --- Top paths ---
  const pathsRaw = await client.zrange<string[]>("analytics:paths", 0, 9, { rev: true, withScores: true });
  const topPaths: { path: string; count: number }[] = [];
  for (let i = 0; i < pathsRaw.length; i += 2) {
    topPaths.push({ path: String(pathsRaw[i]), count: Number(pathsRaw[i + 1]) });
  }

  // --- Cart events ---
  const rawCart = await client.lrange<string>("analytics:cart", 0, 9999);
  let cartAdds = 0;
  let cartCheckoutStarts = 0;
  for (const raw of rawCart) {
    try {
      const ev = typeof raw === "string" ? JSON.parse(raw) as CartEvent : raw as unknown as CartEvent;
      if (ev.ts >= cutoff30) {
        if (ev.type === "add") cartAdds++;
        if (ev.type === "checkout_start") cartCheckoutStarts++;
      }
    } catch { /* skip */ }
  }

  return { dailyViews, totalViews30, totalViews7, topCountries, topPaths, cartAdds, cartCheckoutStarts };
}

function emptyAnalytics() {
  const dailyViews: { date: string; count: number }[] = [];
  const now = Date.now();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    dailyViews.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return { dailyViews, totalViews30: 0, totalViews7: 0, topCountries: [], topPaths: [], cartAdds: 0, cartCheckoutStarts: 0 };
}
