"use client";

import { useTheme } from "@/context/ThemeContext";
import type { AccentKey, ThemeMode, TypoKey } from "@/lib/types";

const ACCENTS: [AccentKey, string][] = [
  ["rust", "#c75334"],
  ["amber", "#d4a24c"],
  ["red", "#d93a1a"],
  ["bone", "#ece8df"],
  ["cyan", "#6ab6b6"],
];

const TYPO: [TypoKey, string][] = [
  ["mono-serif", "mono + serif"],
  ["all-mono", "all mono"],
  ["grotesk", "grotesk + mono"],
];

export default function Tweaks() {
  const { tweaks, tweaksOpen, applyTweaks, closeTweaks } = useTheme();

  return (
    <div className={`tweaks${tweaksOpen ? " on" : ""}`}>
      <div className="hd">
        <span>Tweaks</span>
        <button onClick={closeTweaks}>×</button>
      </div>
      <div className="row">
        <label>Motyw</label>
        <div className="opts">
          {(["dark", "light"] as ThemeMode[]).map((k) => (
            <button
              key={k}
              className={tweaks.theme === k ? "on" : ""}
              onClick={() => applyTweaks({ theme: k })}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="row">
        <label>Typografia</label>
        <div className="opts">
          {TYPO.map(([k, n]) => (
            <button
              key={k}
              className={tweaks.typo === k ? "on" : ""}
              onClick={() => applyTweaks({ typo: k })}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="row">
        <label>Akcent</label>
        <div className="opts">
          {ACCENTS.map(([k, c]) => (
            <button
              key={k}
              className={`swatch${tweaks.accent === k ? " on" : ""}`}
              style={{ "--sw": c } as React.CSSProperties}
              onClick={() => applyTweaks({ accent: k })}
              title={k}
            >
              <i />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
