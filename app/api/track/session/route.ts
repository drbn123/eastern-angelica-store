import { NextRequest, NextResponse } from "next/server";
import { getOrderByStripeSession } from "@/lib/orders";

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams.get("s");
  if (!s) return NextResponse.json({ error: "Missing session" }, { status: 400 });
  const order = await getOrderByStripeSession(s);
  if (!order || order.status === "pending") {
    return NextResponse.json({ error: "Not ready" }, { status: 404 });
  }
  return NextResponse.json({ id: order.id });
}
