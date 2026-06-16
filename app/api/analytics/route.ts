import { NextRequest, NextResponse } from "next/server";
import { trackPageView, trackCartEvent, getAnalytics } from "@/lib/analytics";
import { isAuthenticated } from "@/lib/auth";

// POST — track an event (page view or cart event)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === "pageview") {
      // Geolocation from Vercel headers (automatic on Vercel platform)
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

    return NextResponse.json({ error: "unknown type" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: true }); // silent fail — tracking should never break UX
  }
}

// GET — read analytics (admin only)
export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await getAnalytics();
  return NextResponse.json(data);
}
