import { isAuthenticated } from "@/lib/auth";
import { readPosts } from "@/lib/posts";
import { readProducts } from "@/lib/products";
import AdminLogin from "@/components/AdminLogin";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAuthenticated();
  if (!authed) return <AdminLogin />;
  const posts = await readPosts();
  const products = await readProducts();
  return <AdminPanel initialPosts={posts} initialProducts={products} />;
}
