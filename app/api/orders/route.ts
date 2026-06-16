import { isAuthenticated } from "@/lib/auth";
import { listOrders } from "@/lib/orders";

export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await listOrders();
  return Response.json(orders);
}
