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
  targetAlpha: number;
  r: number;
  delay: number;
}

const CANVAS_SIZE = 480;
const SAMPLE_STEP = 4;

export default function LogoHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textVisible, setTextVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;
    ctx.scale(dpr, dpr);

    const W = CANVAS_SIZE;
    const H = CANVAS_SIZE;
    const pad = 60;

    const img = new Image();
    img.src = "/assets/ea-monument.png";
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const offCtx = off.getContext("2d")!;
      offCtx.drawImage(img, pad, pad, W - pad * 2, H - pad * 2);
      const { data } = offCtx.getImageData(0, 0, W, H);

      const particles: Particle[] = [];

      for (let y = 0; y < H; y += SAMPLE_STEP) {
        for (let x = 0; x < W; x += SAMPLE_STEP) {
          const i = (y * W + x) * 4;
          if (data[i + 3] > 40) {
            particles.push({
              tx: x,
              ty: y,
              // Start from random positions within the canvas — no edge clipping
              x: Math.random() * W,
              y: Math.random() * H,
              vx: (Math.random() - 0.5) * 0.8,
              vy: (Math.random() - 0.5) * 0.8,
              alpha: 0,
              targetAlpha: (data[i + 3] / 255) * 0.85 + 0.1,
              r: 3.5 + Math.random() * 3,
              // Stagger: particles fade in and converge at different times
              delay: Math.floor(Math.random() * 55),
            });
          }
        }
      }

      const draw = () => {
        ctx.clearRect(0, 0, W, H);

        let maxDist = 0;
        let anyDelayed = false;

        for (const p of particles) {
          if (p.delay > 0) {
            p.delay--;
            anyDelayed = true;
            continue;
          }

          // Fade in gradually
          p.alpha = Math.min(p.targetAlpha, p.alpha + 0.022);

          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          maxDist = Math.max(maxDist, d);

          // Softer spring + more damping = slower, more graceful convergence
          p.vx += dx * 0.018;
          p.vy += dy * 0.018;
          p.vx *= 0.87;
          p.vy *= 0.87;
          p.x += p.vx;
          p.y += p.vy;

          const progress = Math.max(0, 1 - d / 180);
          p.r = Math.max(1, p.r - 0.03);
          const displayR = p.r * (1 - progress * 0.6);

          if (displayR > 1.8) {
            ctx.shadowColor = "rgba(242,238,227,0.3)";
            ctx.shadowBlur = displayR * 2.5;
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

        if (maxDist > 1.2 || anyDelayed) {
          rafRef.current = requestAnimationFrame(draw);
        } else {
          ctx.clearRect(0, 0, W, H);
          ctx.drawImage(img, pad, pad, W - pad * 2, H - pad * 2);
          setTimeout(() => setTextVisible(true), 120);
        }
      };

      setTimeout(() => {
        rafRef.current = requestAnimationFrame(draw);
      }, 300);
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
