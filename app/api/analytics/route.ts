import { NextRequest, NextResponse } from "next/server";
import { trackPageView, trackCartEvent, trackCartSnapshot, getAnalytics, getActiveCarts } from "@/lib/analytics";
import { isAuthenticated } from "@/lib/auth";
import type { LiveCart } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === "pageview") {
      const country = req.headers.get("x-vercel-ip-country") ?? "";
      const city    = req.headers.get("x-vercel-ip-city")    ?? "";
      const path     = (body.path as string | undefined)?.slice(0, 80) ?? "/";
      const referrer = (body.referrer as string | undefined)?.slice(0, 200) ?? "";
      await trackPageView({ country, city, path, referrer });
      return NextResponse.json({ ok: true });
    }

    if (type === "cart") {
      const eventType = body.event as "add" | "remove" | "checkout_start";
      if (!["add", "remove", "checkout_start"].includes(eventType)) {
        return NextResponse.json({ error: "invalid event" }, { status: 400 });
      }
      await trackCartEvent({ type: eventType });
      return NextResponse.json({ ok: true });
    }

    if (type === "cart_snapshot") {
      const { sessionId, items, currency, totalCents } = body as {
        sessionId: string;
        items: LiveCart["items"];
        currency: string;
        totalCents: number;
      };
      if (!sessionId) return NextResponse.json({ ok: true });
      await trackCartSnapshot({ sessionId, ts: Date.now(), items, currency, totalCents });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown type" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  if (searchParams.get("live") === "1") {
    const carts = await getActiveCarts();
    return NextResponse.json({ carts });
  }

  const data = await getAnalytics();
  return NextResponse.json(data);
}
