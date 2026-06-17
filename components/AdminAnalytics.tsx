"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Order } from "@/lib/orders";
import type { LiveCart, AnalyticsData } from "@/lib/analytics";
import { formatPrice } from "@/lib/money";

const COUNTRY_NAMES: Record<string, string> = {
  PL: "Poland 🇵🇱", GB: "United Kingdom 🇬🇧", DE: "Germany 🇩🇪",
  FR: "France 🇫🇷", US: "United States 🇺🇸", NL: "Netherlands 🇳🇱",
  SE: "Sweden 🇸🇪", NO: "Norway 🇳🇴", CZ: "Czech Republic 🇨🇿",
  SK: "Slovakia 🇸🇰", UA: "Ukraine 🇺🇦", LT: "Lithuania 🇱🇹",
  LV: "Latvia 🇱🇻", EE: "Estonia 🇪🇪", HU: "Hungary 🇭🇺",
  RO: "Romania 🇷🇴", IT: "Italy 🇮🇹", ES: "Spain 🇪🇸",
  PT: "Portugal 🇵🇹", BE: "Belgium 🇧🇪", AT: "Austria 🇦🇹",
  CH: "Switzerland 🇨🇭", DK: "Denmark 🇩🇰", FI: "Finland 🇫🇮",
  IE: "Ireland 🇮🇪", CA: "Canada 🇨🇦", AU: "Australia 🇦🇺",
  JP: "Japan 🇯🇵", KR: "South Korea 🇰🇷", CN: "China 🇨🇳",
};

// ── SVG Line Chart ────────────────────────────────────────────────────────────

function LineChart({ data }: { data: { date: string; count: number }[] }) {
  const W = 560; const H = 120;
  const PAD = { top: 12, right: 16, bottom: 32, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  if (data.length < 2) return <p className="an-empty-note">Not enough data to chart.</p>;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top + chartH - (d.count / maxVal) * chartH,
    date: d.date, count: d.count,
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = [
    `M ${pts[0].x},${PAD.top + chartH}`,
    ...pts.map((p) => `L ${p.x},${p.y}`),
    `L ${pts[pts.length - 1].x},${PAD.top + chartH}`, "Z",
  ].join(" ");
  const yLabels = [0, Math.round(maxVal / 2), maxVal];
  const labelInterval = Math.max(1, Math.floor(pts.length / 8));
  const xLabels = pts.filter((_, i) => i % labelInterval === 0 || i === pts.length - 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="an-linechart" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="an-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--fg)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--fg)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yLabels.map((v, i) => {
        const y = PAD.top + chartH - (v / maxVal) * chartH;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fill="var(--fg-dim)" fontSize="9" fontFamily="var(--mono)">{v}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#an-area-grad)" />
      <polyline points={polyline} fill="none" stroke="var(--fg)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        data.length <= 31 ? (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--bg)" stroke="var(--fg)" strokeWidth="1.5">
            <title>{p.date}: {p.count} views</title>
          </circle>
        ) : null
      ))}
      {xLabels.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fill="var(--fg-dim)" fontSize="9" fontFamily="var(--mono)">{p.date.slice(5)}</text>
      ))}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="var(--line)" strokeWidth="1" />
    </svg>
  );
}

function BarChart({ items, label }: { items: { label: string; count: number }[]; label: string }) {
  const maxVal = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="an-barchart">
      <p className="an-chart-label">{label}</p>
      <div className="an-bars">
        {items.length === 0 && <p className="an-empty-note">No data yet</p>}
        {items.map((item, i) => (
          <div key={i} className="an-bar-row">
            <span className="an-bar-name">{item.label}</span>
            <div className="an-bar-track">
              <div className="an-bar-fill" style={{ width: `${(item.count / maxVal) * 100}%` }} />
            </div>
            <span className="an-bar-count">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="an-kpi">
      <span className="an-kpi-label">{label}</span>
      <span className="an-kpi-value">{value}</span>
      {sub && <span className="an-kpi-sub">{sub}</span>}
    </div>
  );
}

function RevenueKpiCard({ gbp, pln }: { gbp: number; pln: number }) {
  const [cur, setCur] = useState<"gbp" | "pln">("gbp");
  return (
    <div className="an-kpi">
      <div className="an-kpi-header">
        <span className="an-kpi-label">Revenue</span>
        <div className="an-rev-tabs">
          <button className={`an-rev-tab${cur === "gbp" ? " on" : ""}`} onClick={() => setCur("gbp")}>GBP</button>
          <button className={`an-rev-tab${cur === "pln" ? " on" : ""}`} onClick={() => setCur("pln")}>PLN</button>
        </div>
      </div>
      <span className="an-kpi-value">{formatPrice((cur === "gbp" ? gbp : pln) / 100, cur)}</span>
      <span className="an-kpi-sub">paid + shipped</span>
    </div>
  );
}

function StatusBar({ label, count, total, cls }: { label: string; count: number; total: number; cls: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="an-status-row">
      <span className={`ao-badge ao-badge-${cls}`}>{label}</span>
      <div className="an-status-track">
        <div className="an-status-fill" style={{ width: `${pct}%` }} data-status={cls} />
      </div>
      <span className="an-status-count">{count}</span>
    </div>
  );
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 0x1F1E6 + c.charCodeAt(0) - 65));
}

// ── Live Carts Section ────────────────────────────────────────────────────────

function LiveCarts() {
  const [carts, setCarts] = useState<LiveCart[] | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function fetchLive() {
    fetch("/api/analytics?live=1")
      .then((r) => r.json())
      .then((d: { carts: LiveCart[] }) => { setCarts(d.carts ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchLive();
    intervalRef.current = setInterval(fetchLive, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const totalValue = (carts ?? []).reduce((s, c) => s + (c.currency === "gbp" ? c.totalCents : 0), 0);
  const totalValuePLN = (carts ?? []).reduce((s, c) => s + (c.currency === "pln" ? c.totalCents : 0), 0);

  return (
    <div className="an-section">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <p className="an-section-title" style={{ margin: 0 }}>Live active carts</p>
        <span className="an-live-dot" />
        <span style={{ fontSize: 10, color: "var(--fg-dim)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          auto-refresh 30s
        </span>
        <button
          onClick={fetchLive}
          style={{ marginLeft: "auto", background: "none", border: "1px solid var(--line)", color: "var(--fg-dim)", fontFamily: "var(--mono)", fontSize: 10, padding: "3px 10px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em" }}
        >
          refresh
        </button>
      </div>

      {loading && <div className="an-loading">Loading…</div>}

      {!loading && (!carts || carts.length === 0) && (
        <p className="an-empty-note">No active carts right now.</p>
      )}

      {!loading && carts && carts.length > 0 && (
        <>
          <div className="an-kpi-row" style={{ marginBottom: 16 }}>
            <KpiCard label="Active carts" value={carts.length} sub="last 10 min" />
            {totalValue > 0 && <KpiCard label="Value GBP" value={formatPrice(totalValue / 100, "gbp")} sub="in active carts" />}
            {totalValuePLN > 0 && <KpiCard label="Value PLN" value={formatPrice(totalValuePLN / 100, "pln")} sub="in active carts" />}
          </div>
          <div className="an-live-carts">
            {carts.map((c) => (
              <div key={c.sessionId} className="an-live-cart">
                <div className="an-live-cart-head">
                  <span className="an-live-cart-id">···{c.sessionId.slice(-6)}</span>
                  {c.country && <span title={c.country}>{countryFlag(c.country)}</span>}
                  <span className="an-live-cart-currency">{c.currency.toUpperCase()}</span>
                  <span className="an-live-cart-total">{formatPrice(c.totalCents / 100, c.currency as "gbp" | "pln")}</span>
                  <span className="an-live-cart-time">{timeAgo(c.ts)}</span>
                </div>
                <div className="an-live-cart-items">
                  {c.items.map((it, i) => (
                    <div key={i} className="an-live-cart-item">
                      <span>{it.qty}×</span>
                      <span>{it.title}</span>
                      <span className="an-live-cart-variant">— {it.variant}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Order stats (client-side, filtered by date range) ─────────────────────────

function deriveOrderStats(orders: Order[]) {
  let revenueGBP = 0, revenuePLN = 0;
  const productCounts: Record<string, number> = {};
  for (const o of orders) {
    if (o.status === "paid" || o.status === "fulfilled" || o.status === "shipped") {
      if (o.currency === "gbp") revenueGBP += o.totalCents;
      else revenuePLN += o.totalCents;
      for (const item of o.items) {
        productCounts[item.title] = (productCounts[item.title] ?? 0) + item.qty;
      }
    }
  }
  return {
    totalOrders: orders.length,
    paidOrders: orders.filter((o) => o.status === "paid").length,
    fulfilledOrders: orders.filter((o) => o.status === "fulfilled").length,
    shippedOrders: orders.filter((o) => o.status === "shipped").length,
    cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    revenueGBP, revenuePLN,
    topProducts: Object.entries(productCounts)
      .map(([title, qty]) => ({ title, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5),
  };
}

// ── Range helpers ─────────────────────────────────────────────────────────────

type RangeMode = "7" | "30" | "all" | "custom";

function toDateInput(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function rangeLabel(mode: RangeMode, from: string, to: string): string {
  if (mode === "7") return "last 7 days";
  if (mode === "30") return "last 30 days";
  if (mode === "all") return "all time";
  if (from && to) return `${from} → ${to}`;
  return "custom";
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminAnalytics({ orders }: { orders: Order[] }) {
  const now = Date.now();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rangeMode, setRangeMode] = useState<RangeMode>("7");
  const [customFrom, setCustomFrom] = useState(toDateInput(now - 30 * 86400000));
  const [customTo, setCustomTo] = useState(toDateInput(now));

  function getFromTo(): { from: number; to: number } {
    const n = Date.now();
    if (rangeMode === "7") return { from: n - 7 * 86400000, to: n };
    if (rangeMode === "30") return { from: n - 30 * 86400000, to: n };
    if (rangeMode === "all") return { from: 0, to: n };
    return {
      from: new Date(customFrom + "T00:00:00Z").getTime(),
      to: new Date(customTo + "T23:59:59Z").getTime(),
    };
  }

  function fetchData(isRefresh = false) {
    if (rangeMode === "custom" && (!customFrom || !customTo)) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const { from, to } = getFromTo();
    fetch(`/api/analytics?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { fetchData(); }, [rangeMode]);

  useEffect(() => {
    if (rangeMode === "custom" && customFrom && customTo && customFrom <= customTo) {
      fetchData();
    }
  }, [customFrom, customTo]);

  const filteredOrders = useMemo(() => {
    if (rangeMode === "all") return orders;
    const { from, to } = getFromTo();
    return orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= from && t <= to;
    });
  }, [orders, rangeMode, customFrom, customTo]);

  const orderStats = deriveOrderStats(filteredOrders);
  const totalViews = data?.totalViews ?? 0;
  const cartAdds = data?.cartAdds ?? 0;
  const checkoutStarts = data?.cartCheckoutStarts ?? 0;
  const convRate = totalViews > 0 ? ((orderStats.paidOrders / totalViews) * 100).toFixed(2) : "0.00";
  const label = rangeLabel(rangeMode, customFrom, customTo);

  return (
    <div className="an-wrap">

      {/* ── Header ── */}
      <div className="an-header">
        <span className="admin-topbar-title">Analytics</span>
        <div className="an-header-right">
          <button
            className={`an-refresh-btn${refreshing ? " spinning" : ""}`}
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh data"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="an-range-tabs">
            {(["7", "30", "all", "custom"] as RangeMode[]).map((m) => (
              <button
                key={m}
                className={`an-range-tab${rangeMode === m ? " on" : ""}`}
                onClick={() => setRangeMode(m)}
              >
                {m === "7" ? "7 days" : m === "30" ? "30 days" : m === "all" ? "All time" : "Custom"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Custom date pickers ── */}
      {rangeMode === "custom" && (
        <div className="an-custom-range">
          <label className="an-date-label">
            From
            <input
              type="date"
              className="an-date-input"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </label>
          <span className="an-date-sep">→</span>
          <label className="an-date-label">
            To
            <input
              type="date"
              className="an-date-input"
              value={customTo}
              min={customFrom}
              max={toDateInput(Date.now())}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </label>
        </div>
      )}

      {/* ── KPI Row (6 cards → clean 3×2 grid) ── */}
      <div className="an-kpi-row">
        <KpiCard label="Page views" value={loading ? "—" : totalViews.toLocaleString()} sub={label} />
        <KpiCard label="Cart adds" value={loading ? "—" : cartAdds.toLocaleString()} sub={label} />
        <KpiCard label="Checkout starts" value={loading ? "—" : checkoutStarts.toLocaleString()} sub={label} />
        <KpiCard label="Orders" value={orderStats.totalOrders.toLocaleString()} sub={`${orderStats.paidOrders} paid`} />
        <KpiCard label="Conversion" value={`${convRate}%`} sub="orders / views" />
        <RevenueKpiCard gbp={orderStats.revenueGBP} pln={orderStats.revenuePLN} />
      </div>

      {/* ── Line Chart ── */}
      <div className="an-section">
        <p className="an-section-title">
          Daily visits — {label}
          {data && ` (${data.dailyViews.length} days)`}
        </p>
        <div className="an-linechart-wrap">
          {loading ? <div className="an-loading">Loading…</div> : <LineChart data={data?.dailyViews ?? []} />}
        </div>
      </div>

      {/* ── Countries + Paths ── */}
      <div className="an-two-col">
        {loading ? <div className="an-loading">Loading…</div> : (
          <>
            <BarChart label="Top countries" items={(data?.topCountries ?? []).map((c) => ({ label: COUNTRY_NAMES[c.country] ?? c.country, count: c.count }))} />
            <BarChart label="Top pages" items={(data?.topPaths ?? []).map((p) => ({ label: p.path, count: p.count }))} />
          </>
        )}
      </div>

      {/* ── Traffic sources ── */}
      <div className="an-section">
        <p className="an-section-title">Traffic sources</p>
        {loading ? <div className="an-loading">Loading…</div> : (
          <BarChart label="" items={(data?.topReferrers ?? []).map((r) => ({ label: r.source, count: r.count }))} />
        )}
      </div>

      {/* ── Checkout funnel ── */}
      <div className="an-section">
        <p className="an-section-title">Checkout funnel — {label}</p>
        <div className="an-funnel">
          <div className="an-funnel-step">
            <span className="an-funnel-num">{loading ? "—" : cartAdds}</span>
            <span className="an-funnel-label">Added to cart</span>
          </div>
          <div className="an-funnel-arrow-wrap">
            <span className="an-funnel-arrow">→</span>
            {cartAdds > 0 && !loading && (
              <span className="an-funnel-drop">{Math.round((checkoutStarts / cartAdds) * 100)}%</span>
            )}
          </div>
          <div className="an-funnel-step">
            <span className="an-funnel-num">{loading ? "—" : checkoutStarts}</span>
            <span className="an-funnel-label">Started checkout</span>
          </div>
          <div className="an-funnel-arrow-wrap">
            <span className="an-funnel-arrow">→</span>
            {checkoutStarts > 0 && !loading && (
              <span className="an-funnel-drop">{Math.round((orderStats.paidOrders / checkoutStarts) * 100)}%</span>
            )}
          </div>
          <div className="an-funnel-step">
            <span className="an-funnel-num">{orderStats.paidOrders}</span>
            <span className="an-funnel-label">Completed</span>
          </div>
        </div>
      </div>

      {/* ── Live Active Carts ── */}
      <LiveCarts />

      {/* ── Order status breakdown ── */}
      <div className="an-section">
        <p className="an-section-title">Order status breakdown — {label}</p>
        <div className="an-status-list">
          <StatusBar label="Paid"      count={orderStats.paidOrders}      total={orderStats.totalOrders} cls="paid" />
          <StatusBar label="Fulfilled" count={orderStats.fulfilledOrders} total={orderStats.totalOrders} cls="fulfilled" />
          <StatusBar label="Shipped"   count={orderStats.shippedOrders}   total={orderStats.totalOrders} cls="shipped" />
          <StatusBar label="Pending"   count={orderStats.pendingOrders}   total={orderStats.totalOrders} cls="pending" />
          <StatusBar label="Cancelled" count={orderStats.cancelledOrders} total={orderStats.totalOrders} cls="cancelled" />
        </div>
      </div>

      {/* ── Top products ── */}
      {orderStats.topProducts.length > 0 && (
        <div className="an-section">
          <p className="an-section-title">Best selling products — {label}</p>
          <div className="an-top-products">
            {orderStats.topProducts.map((p, i) => (
              <div key={i} className="an-product-row">
                <span className="an-product-idx">#{i + 1}</span>
                <span className="an-product-title">{p.title}</span>
                <span className="an-product-qty">{p.qty} sold</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
