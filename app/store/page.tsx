"use client";

import { useState } from "react";
import GridView from "@/components/store/GridView";
import BoardView from "@/components/store/BoardView";
import ZineView from "@/components/store/ZineView";
import Footer from "@/components/Footer";
import type { StoreLayout } from "@/lib/types";

const LAYOUTS: [StoreLayout, string][] = [
  ["v1", "Grid"],
  ["v2", "Board"],
  ["v3", "One-by-one"],
];

export default function StorePage() {
  const [layout, setLayout] = useState<StoreLayout>("v1");
  const View = layout === "v1" ? GridView : layout === "v2" ? BoardView : ZineView;

  return (
    <>
      <div className="layout-switch">
        <span className="ls-label">View</span>
        {LAYOUTS.map(([k, label]) => (
          <button
            key={k}
            className={layout === k ? "on" : ""}
            onClick={() => setLayout(k)}
          >
            {label}
          </button>
        ))}
      </div>
      <View />
      <Footer />
    </>
  );
}
