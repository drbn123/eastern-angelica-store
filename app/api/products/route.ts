import { readProducts, createProduct } from "@/lib/products";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  return Response.json(await readProducts());
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await request.json();
  if (!data.title?.trim()) {
    return Response.json({ error: "Title required" }, { status: 400 });
  }
  const product = await createProduct(data);
  return Response.json(product, { status: 201 });
}
