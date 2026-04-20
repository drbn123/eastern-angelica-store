"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Tweaks } from "@/lib/types";

const DEFAULT_TWEAKS: Tweaks = {
  theme: "dark",
  accent: "bone",
  typo: "mono-serif",
};

interface ThemeContextValue {
  tweaks: Tweaks;
  tweaksOpen: boolean;
  applyTweaks: (patch: Partial<Tweaks>) => void;
  toggleTweaks: () => void;
  closeTweaks: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ea:tweaks");
      if (saved) setTweaks(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    const el = document.body;
    el.dataset.theme = tweaks.theme;
    el.dataset.accent = tweaks.accent;
    el.dataset.typo = tweaks.typo;
    localStorage.setItem("ea:tweaks", JSON.stringify(tweaks));
  }, [tweaks]);

  const applyTweaks = (patch: Partial<Tweaks>) => {
    setTweaks((prev) => ({ ...prev, ...patch }));
  };

  return (
    <ThemeContext.Provider
      value={{
        tweaks,
        tweaksOpen,
        applyTweaks,
        toggleTweaks: () => setTweaksOpen((v) => !v),
        closeTweaks: () => setTweaksOpen(false),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
