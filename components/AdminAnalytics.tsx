"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/lib/orders";
import { formatPrice } from "@/lib/money";

// ── Country name map ──────────────────────────────────────────────────────────
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

function countryName(code: string) {
  return COUNTRY_NAMES[code] ?? `${code}`;
}

// ── Interfaces ────────────────────────────────────────────────────────────────

interface AnalyticsPayload {
  dailyViews: { date: string; count: number }[];
  totalViews30: number;
  totalViews7: number;
  topCountries: { country: string; count: number }[];
  topPaths: { path: string; count: number }[];
  cartAdds: number;
  cartCheckoutStarts: number;
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────

function LineChart({ data }: { data: { date: string; count: number }[] }) {
  const W = 560;
  const H = 120;
  const PAD = { top: 12, right: 16, bottom: 32, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.count), 1);

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top + chartH - (d.count / maxVal) * chartH,
    date: d.date,
    count: d.count,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = [
    `M ${pts[0].x},${PAD.top + chartH}`,
    ...pts.map((p) => `L ${p.x},${p.y}`),
    `L ${pts[pts.length - 1].x},${PAD.top + chartH}`,
    "Z",
  ].join(" ");

  // Y axis labels
  const yLabels = [0, Math.round(maxVal / 2), maxVal];

  // X labels — show every ~3 dates
  const xLabels = pts.filter((_, i) => i % 4 === 0 || i === pts.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="an-linechart" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="an-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--fg)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--fg)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map((v, i) => {
        const y = PAD.top + chartH - (v / maxVal) * chartH;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
              stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end"
              fill="var(--fg-dim)" fontSize="9" fontFamily="var(--mono)">{v}</text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#an-area-grad)" />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke="var(--fg)"
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Points */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--bg)"
          stroke="var(--fg)" strokeWidth="1.5">
          <title>{p.date}: {p.count} views</title>
        </circle>
      ))}

      {/* X axis labels */}
      {xLabels.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle"
          fill="var(--fg-dim)" fontSize="9" fontFamily="var(--mono)">
          {p.date.slice(5)} {/* "MM-DD" */}
        </text>
      ))}

      {/* X axis baseline */}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH}
        stroke="var(--line)" strokeWidth="1" />
    </svg>
  );
}

// ── Horizontal Bar Chart (countries / paths) ──────────────────────────────────

function BarChart({ items, label }: {
  items: { label: string; count: number }[];
  label: string;
}) {
  const maxVal = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="an-barchart">
      <p className="an-chart-label">{label}</p>
      <div className="an-bars">
        {items.length === 0 && (
          <p className="an-empty-note">No data yet</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="an-bar-row">
            <span className="an-bar-name">{item.label}</span>
            <div className="an-bar-track">
              <div
                className="an-bar-fill"
                style={{ width: `${(item.count / maxVal) * 100}%` }}
              />
            </div>
            <span className="an-bar-count">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="an-kpi">
      <span className="an-kpi-label">{label}</span>
      <span className="an-kpi-value">{value}</span>
      {sub && <span className="an-kpi-sub">{sub}</span>}
    </div>
  );
}

// ── Order stats helpers ───────────────────────────────────────────────────────

function deriveOrderStats(orders: Order[]) {
  let revenueGBP = 0;
  let revenuePLN = 0;
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

  const topProducts = Object.entries(productCounts)
    .map(([title, qty]) => ({ title, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return {
    totalOrders: orders.length,
    paidOrders: orders.filter((o) => o.status === "paid").length,
    fulfilledOrders: orders.filter((o) => o.status === "fulfilled").length,
    shippedOrders: orders.filter((o) => o.status === "shipped").length,
    cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    revenueGBP,
    revenuePLN,
    topProducts,
  };
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusBar({ label, count, total, cls }: {
  label: string; count: number; total: number; cls: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="an-status-row">
      <span className={`ao-badge ao-badge-${cls}`}>{label}</span>
      <div className="an-status-track">
        <div className="an-status-fill" style={{ width: `${pct}%` }}
          data-status={cls} />
      </div>
      <span className="an-status-count">{count}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminAnalytics({ orders }: { orders: Order[] }) {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const orderStats = deriveOrderStats(orders);

  const totalViews = range === 7 ? (data?.totalViews7 ?? 0) : (data?.totalViews30 ?? 0);
  const convRate = totalViews > 0 ? ((orderStats.paidOrders / totalViews) * 100).toFixed(2) : "0.00";

  const revenueGBP = orderStats.revenueGBP;
  const revenuePLN = orderStats.revenuePLN;

  return (
    <div className="an-wrap">

      {/* ── Range selector ── */}
      <div className="an-header">
        <span className="admin-topbar-title">Analytics</span>
        <div className="an-range-tabs">
          <button className={`an-range-tab${range === 7 ? " on" : ""}`} onClick={() => setRange(7)}>7 days</button>
          <button className={`an-range-tab${range === 30 ? " on" : ""}`} onClick={() => setRange(30)}>30 days</button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="an-kpi-row">
        <KpiCard
          label="Page views"
          value={loading ? "—" : totalViews.toLocaleString()}
          sub={`last ${range} days`}
        />
        <KpiCard
          label="Cart adds"
          value={loading ? "—" : (data?.cartAdds ?? 0).toLocaleString()}
          sub="last 30 days"
        />
        <KpiCard
          label="Orders"
          value={orderStats.totalOrders.toLocaleString()}
          sub={`${orderStats.paidOrders} paid`}
        />
        <KpiCard
          label="Conversion"
          value={`${convRate}%`}
          sub="orders / views"
        />
        <KpiCard
          label="Revenue GBP"
          value={formatPrice(revenueGBP / 100, "gbp")}
          sub="paid + shipped"
        />
        <KpiCard
          label="Revenue PLN"
          value={formatPrice(revenuePLN / 100, "pln")}
          sub="paid + shipped"
        />
      </div>

      {/* ── Line Chart ── */}
      <div className="an-section">
        <p className="an-section-title">Daily visits — last 14 days</p>
        <div className="an-linechart-wrap">
          {loading ? (
            <div className="an-loading">Loading…</div>
          ) : (
            <LineChart data={data?.dailyViews ?? []} />
          )}
        </div>
      </div>

      {/* ── Countries + Paths ── */}
      <div className="an-two-col">
        {loading ? (
          <div className="an-loading">Loading…</div>
        ) : (
          <>
            <BarChart
              label="Top countries"
              items={(data?.topCountries ?? []).map((c) => ({
                label: countryName(c.country) || c.country || "Unknown",
                count: c.count,
              }))}
            />
            <BarChart
              label="Top pages"
              items={(data?.topPaths ?? []).map((p) => ({
                label: p.path,
                count: p.count,
              }))}
            />
          </>
        )}
      </div>

      {/* ── Order breakdown ── */}
      <div className="an-section">
        <p className="an-section-title">Order status breakdown</p>
        <div className="an-status-list">
          <StatusBar label="Paid" count={orderStats.paidOrders} total={orderStats.totalOrders} cls="paid" />
          <StatusBar label="Fulfilled" count={orderStats.fulfilledOrders} total={orderStats.totalOrders} cls="fulfilled" />
          <StatusBar label="Shipped" count={orderStats.shippedOrders} total={orderStats.totalOrders} cls="shipped" />
          <StatusBar label="Pending" count={orderStats.pendingOrders} total={orderStats.totalOrders} cls="pending" />
          <StatusBar label="Cancelled" count={orderStats.cancelledOrders} total={orderStats.totalOrders} cls="cancelled" />
        </div>
      </div>

      {/* ── Top products ── */}
      {orderStats.topProducts.length > 0 && (
        <div className="an-section">
          <p className="an-section-title">Best selling products</p>
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

      {/* ── Cart funnel ── */}
      <div className="an-section">
        <p className="an-section-title">Checkout funnel (30 days)</p>
        <div className="an-funnel">
          <div className="an-funnel-step">
            <span className="an-funnel-num">{loading ? "—" : (data?.cartAdds ?? 0)}</span>
            <span className="an-funnel-label">Added to cart</span>
          </div>
          <span className="an-funnel-arrow">→</span>
          <div className="an-funnel-step">
            <span className="an-funnel-num">{loading ? "—" : (data?.cartCheckoutStarts ?? 0)}</span>
            <span className="an-funnel-label">Started checkout</span>
          </div>
          <span className="an-funnel-arrow">→</span>
          <div className="an-funnel-step">
            <span className="an-funnel-num">{orderStats.paidOrders}</span>
            <span className="an-funnel-label">Completed</span>
          </div>
        </div>
      </div>

    </div>
  );
}
