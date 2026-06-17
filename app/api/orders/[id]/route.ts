import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getOrder, updateOrder, deleteOrder, type OrderStatus } from "@/lib/orders";
import { sendShippingUpdate } from "@/lib/email";

const VALID_STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "shipped", "delivered", "cancelled", "refunded"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(order);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json() as { status?: OrderStatus; note?: string; trackingNumber?: string };

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await updateOrder(id, {
    ...(body.status ? { status: body.status } : {}),
    ...(body.note !== undefined ? { note: body.note } : {}),
    ...(body.trackingNumber !== undefined ? { trackingNumber: body.trackingNumber } : {}),
  });
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  if (body.status === "shipped" || body.status === "delivered") {
    sendShippingUpdate(updated);
  }
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = await deleteOrder(id);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
