"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Lightweight client-side analytics tracker.
 * Fires a POST /api/analytics with path + referrer on every route change.
 * Country/city are read server-side from Vercel headers — nothing is sent from the client.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    // Skip admin routes — don't count your own visits
    if (pathname.startsWith("/admin")) return;
    // Dedupe rapid re-renders
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "pageview",
        path: pathname,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      }),
    }).catch(() => {}); // silent fail
  }, [pathname]);

  return null;
}
