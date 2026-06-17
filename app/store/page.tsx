import type { Metadata } from "next";
import { readProducts } from "@/lib/products";
import StoreClient from "@/components/StoreClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store",
  description: "Physical releases, merch and more from KUZKO.",
};

export default async function StorePage() {
  const releases = await readProducts();
  return <StoreClient releases={releases} />;
}
