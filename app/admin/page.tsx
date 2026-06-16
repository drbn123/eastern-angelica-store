import { isAuthenticated } from "@/lib/auth";
import { readPosts } from "@/lib/posts";
import { readProducts } from "@/lib/products";
import { listOrders } from "@/lib/orders";
import AdminLogin from "@/components/AdminLogin";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAuthenticated();
  if (!authed) return <AdminLogin />;
  const [posts, products, orders] = await Promise.all([readPosts(), readProducts(), listOrders()]);
  return <AdminPanel initialPosts={posts} initialProducts={products} initialOrders={orders} />;
}
