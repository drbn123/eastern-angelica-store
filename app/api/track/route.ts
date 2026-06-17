import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumberAndEmail } from "@/lib/orders";

export async function POST(req: NextRequest) {
  const { email, number } = await req.json() as { email: string; number: string };
  const num = parseInt(number.replace(/[^0-9]/g, ""), 10);
  if (!email || isNaN(num)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const order = await getOrderByNumberAndEmail(num, email.trim());
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ id: order.id });
}
