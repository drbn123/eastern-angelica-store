import { isAuthenticated } from "@/lib/auth";
import { readPosts } from "@/lib/posts";
import { readProducts } from "@/lib/products";
import AdminLogin from "@/components/AdminLogin";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAuthenticated();
  if (!authed) return <AdminLogin />;
  const posts = readPosts();
  const products = readProducts();
  return <AdminPanel initialPosts={posts} initialProducts={products} />;
}
