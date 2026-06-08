import HomeHero from "@/components/HomeHero";
import { readProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const releases = await readProducts();
  return <HomeHero releases={releases} />;
}
