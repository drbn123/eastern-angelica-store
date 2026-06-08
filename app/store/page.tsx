import { readProducts } from "@/lib/products";
import StoreClient from "@/components/StoreClient";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const releases = await readProducts();
  return <StoreClient releases={releases} />;
}
