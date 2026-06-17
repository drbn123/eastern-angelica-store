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
  country?: string;
}

export interface AnalyticsData {
  dailyViews: { date: string; count: number }[];
  totalViews: number;
  topCountries: { country: string; count: number }[];
  topPaths: { path: string; count: number }[];
  topReferrers: { source: string; count: number }[];
  cartAdds: number;
  cartCheckoutStarts: number;
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

/**
 * Compute analytics for a given time range by scanning raw event lists.
 * fromTs=0 means "all time" (entire event list, capped at 5000 views / 10000 cart events).
 */
export async function getAnalytics(fromTs: number, toTs: number): Promise<AnalyticsData> {
  if (!useKV()) return emptyAnalytics(fromTs, toTs);

  const client = await kv();

  // ── Scan raw page views ──
  const rawViews = await client.lrange<string>("analytics:views", 0, 4999);
  let totalViews = 0;
  const dailyCounts: Record<string, number> = {};
  const countries: Record<string, number> = {};
  const paths: Record<string, number> = {};
  const referrers: Record<string, number> = {};
  let earliest = toTs;

  for (const raw of rawViews) {
    try {
      const ev = (typeof raw === "string" ? JSON.parse(raw) : raw) as PageViewEvent;
      if (ev.ts >= fromTs && ev.ts <= toTs) {
        totalViews++;
        const date = new Date(ev.ts).toISOString().slice(0, 10);
        dailyCounts[date] = (dailyCounts[date] ?? 0) + 1;
        if (ev.country) countries[ev.country] = (countries[ev.country] ?? 0) + 1;
        const p = (ev.path || "/").slice(0, 80);
        paths[p] = (paths[p] ?? 0) + 1;
        if (ev.referrer) {
          try {
            const host = new URL(ev.referrer).hostname.replace(/^www\./, "");
            if (host) referrers[host] = (referrers[host] ?? 0) + 1;
          } catch { /* skip */ }
        } else {
          referrers["(direct)"] = (referrers["(direct)"] ?? 0) + 1;
        }
        if (ev.ts < earliest) earliest = ev.ts;
      }
    } catch { /* skip */ }
  }

  // ── Build daily views array spanning the requested range ──
  const dayMs = 24 * 60 * 60 * 1000;
  const startDay = fromTs === 0
    ? new Date(earliest).toISOString().slice(0, 10)
    : new Date(fromTs).toISOString().slice(0, 10);
  const endDay = new Date(toTs).toISOString().slice(0, 10);
  const dailyViews: { date: string; count: number }[] = [];
  for (
    let d = new Date(startDay + "T00:00:00Z").getTime();
    d <= new Date(endDay + "T00:00:00Z").getTime();
    d += dayMs
  ) {
    const key = new Date(d).toISOString().slice(0, 10);
    dailyViews.push({ date: key, count: dailyCounts[key] ?? 0 });
  }

  // ── Scan cart events ──
  const rawCart = await client.lrange<string>("analytics:cart", 0, 9999);
  let cartAdds = 0, cartCheckoutStarts = 0;
  for (const raw of rawCart) {
    try {
      const ev = (typeof raw === "string" ? JSON.parse(raw) : raw) as CartEvent;
      if (ev.ts >= fromTs && ev.ts <= toTs) {
        if (ev.type === "add") cartAdds++;
        if (ev.type === "checkout_start") cartCheckoutStarts++;
      }
    } catch { /* skip */ }
  }

  // ── Aggregates ──
  const topCountries = Object.entries(countries)
    .sort(([, a], [, b]) => b - a).slice(0, 10)
    .map(([country, count]) => ({ country, count }));
  const topPaths = Object.entries(paths)
    .sort(([, a], [, b]) => b - a).slice(0, 10)
    .map(([path, count]) => ({ path, count }));
  const topReferrers = Object.entries(referrers)
    .sort(([, a], [, b]) => b - a).slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  return { dailyViews, totalViews, topCountries, topPaths, topReferrers, cartAdds, cartCheckoutStarts };
}

function emptyAnalytics(fromTs: number, toTs: number): AnalyticsData {
  const dailyViews: { date: string; count: number }[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const start = fromTs === 0 ? toTs - 6 * dayMs : fromTs;
  for (let d = start; d <= toTs; d += dayMs) {
    dailyViews.push({ date: new Date(d).toISOString().slice(0, 10), count: 0 });
  }
  return { dailyViews, totalViews: 0, topCountries: [], topPaths: [], topReferrers: [], cartAdds: 0, cartCheckoutStarts: 0 };
}
