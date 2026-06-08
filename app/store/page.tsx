import { readProducts } from "@/lib/products";
import StoreClient from "@/components/StoreClient";

export const dynamic = "force-dynamic";

export default function StorePage() {
  const releases = readProducts();
  return <StoreClient releases={releases} />;
}
