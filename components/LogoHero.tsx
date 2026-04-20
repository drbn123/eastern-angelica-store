"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  alpha: number;
  /** start radius (large soft dot) → shrinks to 1 as it assembles */
  r: number;
}

const CANVAS_SIZE = 480;
const SAMPLE_STEP = 3;
const SPREAD = 1200;

export default function LogoHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textVisible, setTextVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // Scale for retina
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;
    ctx.scale(dpr, dpr);

    const W = CANVAS_SIZE;
    const H = CANVAS_SIZE;

    const img = new Image();
    img.src = "/assets/ea-monument.png";
    img.onload = () => {
      // Sample logo pixels via offscreen canvas
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const offCtx = off.getContext("2d")!;
      // center the logo with some padding
      const pad = 60;
      offCtx.drawImage(img, pad, pad, W - pad * 2, H - pad * 2);
      const { data } = offCtx.getImageData(0, 0, W, H);

      const particles: Particle[] = [];

      for (let y = 0; y < H; y += SAMPLE_STEP) {
        for (let x = 0; x < W; x += SAMPLE_STEP) {
          const i = (y * W + x) * 4;
          if (data[i + 3] > 40) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * SPREAD + 80;
            particles.push({
              tx: x,
              ty: y,
              x: W / 2 + Math.cos(angle) * dist,
              y: H / 2 + Math.sin(angle) * dist,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              alpha: (data[i + 3] / 255) * 0.9 + 0.1,
              r: 4 + Math.random() * 4,
            });
          }
        }
      }

      let assembled = false;

      const draw = () => {
        ctx.clearRect(0, 0, W, H);

        let maxDist = 0;

        for (const p of particles) {
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          maxDist = Math.max(maxDist, d);

          // Spring physics
          p.vx += dx * 0.055;
          p.vy += dy * 0.055;
          p.vx *= 0.76;
          p.vy *= 0.76;
          p.x += p.vx;
          p.y += p.vy;

          // Radius shrinks as particle nears target
          const progress = Math.max(0, 1 - d / 300);
          p.r = Math.max(1, p.r - 0.06);
          const displayR = p.r * (1 - progress * 0.65);

          // Soft glow when far, sharp pixel when close
          if (displayR > 1.8) {
            ctx.shadowColor = "rgba(242,238,227,0.35)";
            ctx.shadowBlur = displayR * 3;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = "#f2eee3";
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, displayR), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        if (maxDist > 1.2) {
          rafRef.current = requestAnimationFrame(draw);
        } else {
          // Draw final clean static logo
          ctx.clearRect(0, 0, W, H);
          ctx.drawImage(img, pad, pad, W - pad * 2, H - pad * 2);
          assembled = true;
          setTimeout(() => setTextVisible(true), 120);
        }
      };

      // Small delay before starting so page paint settles
      setTimeout(() => {
        rafRef.current = requestAnimationFrame(draw);
      }, 200);
    };

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="logo-hero-inner">
      <canvas ref={canvasRef} className="logo-hero-canvas" />
      <div className={`logo-hero-text${textVisible ? " on" : ""}`}>
        <span className="logo-hero-name">Eastern Angelica</span>
        <span className="logo-hero-sub">Recordings · Est. 2024</span>
      </div>
    </div>
  );
}
