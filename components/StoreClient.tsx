"use client";

import { useState } from "react";
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

  function handleProductClick(idx: number) {
    setActiveIdx(idx);
    setLayout("v3");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
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
