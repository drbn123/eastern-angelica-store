"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GridView from "@/components/store/GridView";
import ZineView from "@/components/store/ZineView";
import Footer from "@/components/Footer";
import type { Release, StoreLayout } from "@/lib/types";

const LAYOUTS: [StoreLayout, string][] = [
  ["v1", "Grid"],
  ["v3", "One-by-one"],
];

export default function StoreClient({ releases }: { releases: Release[] }) {
  const [layout, setLayout] = useState<StoreLayout>("v1");
  const [activeIdx, setActiveIdx] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("order") === "success") {
      setOrderSuccess(true);
      router.replace("/store", { scroll: false });
      setTimeout(() => setOrderSuccess(false), 6000);
    }
  }, [searchParams, router]);

  function handleProductClick(idx: number) {
    setActiveIdx(idx);
    setLayout("v3");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      {orderSuccess && (
        <div className="order-success-banner">
          Order placed — thank you! Check your email for confirmation.
        </div>
      )}
      <div className="layout-switch">
        <span className="ls-label">View</span>
        {LAYOUTS.map(([k, label]) => (
          <button key={k} className={layout === k ? "on" : ""} onClick={() => setLayout(k)}>
            {label}
          </button>
        ))}
      </div>
      {layout === "v1" && <GridView releases={releases} onProductClick={handleProductClick} />}
      {layout === "v3" && <ZineView releases={releases} initialIdx={activeIdx} />}
      <Footer />
    </>
  );
}
