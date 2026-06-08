import HomeHero from "@/components/HomeHero";
import { readProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const releases = readProducts();
  return <HomeHero releases={releases} />;
}
