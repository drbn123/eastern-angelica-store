"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  tx: number; ty: number;
  vx: number; vy: number;
  alpha: number; targetAlpha: number;
  r: number; delay: number;
  done: boolean;
}

const SIZE = 340;
const STEP = 2;

export default function LogoHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.scale(dpr, dpr);

    // Persistent canvas for settled particles — updated incrementally, blitted in one call per frame
    const doneCanvas = document.createElement("canvas");
    doneCanvas.width = SIZE * dpr;
    doneCanvas.height = SIZE * dpr;
    const doneCtx = doneCanvas.getContext("2d")!;
    doneCtx.scale(dpr, dpr);
    doneCtx.fillStyle = "#f2eee3";

    const img = new window.Image();
    img.src = "/assets/ea-monument.png";
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = SIZE; off.height = SIZE;
      const tCtx = off.getContext("2d")!;
      tCtx.drawImage(img, 0, 0, SIZE, SIZE);

      const { data } = tCtx.getImageData(0, 0, SIZE, SIZE);
      const particles: Particle[] = [];

      for (let y = 0; y < SIZE; y += STEP) {
        for (let x = 0; x < SIZE; x += STEP) {
          const i = (y * SIZE + x) * 4;
          if (data[i + 3] > 40) {
            particles.push({
              tx: x, ty: y,
              x: Math.random() * SIZE,
              y: Math.random() * SIZE,
              vx: 0, vy: 0,
              alpha: 0,
              targetAlpha: (data[i + 3] / 255) * 0.95,
              r: 1.8 + Math.random() * 2,
              delay: Math.floor(Math.random() * 18),
              done: false,
            });
          }
        }
      }

      let prevTime = performance.now();

      const draw = (now: number) => {
        const dt = Math.min((now - prevTime) / 16.67, 2.5);
        prevTime = now;

        ctx.clearRect(0, 0, SIZE, SIZE);
        // One draw call for all settled particles instead of N individual arc/fill calls
        ctx.drawImage(doneCanvas, 0, 0, SIZE, SIZE);

        let live = 0;
        const dampen = Math.pow(0.74, dt);
        ctx.fillStyle = "#f2eee3";

        for (const p of particles) {
          if (p.done) continue;

          if (p.delay > 0) { p.delay -= dt; live++; continue; }

          p.alpha = Math.min(p.targetAlpha, p.alpha + 0.04 * dt);

          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < 1.2 && Math.abs(p.vx) < 0.5 && Math.abs(p.vy) < 0.5) {
            p.x = p.tx; p.y = p.ty; p.done = true;
            // Paint settled particle onto persistent canvas — happens once per particle
            doneCtx.globalAlpha = p.targetAlpha;
            doneCtx.beginPath();
            doneCtx.arc(p.tx, p.ty, Math.max(0.4, p.r * 0.45), 0, Math.PI * 2);
            doneCtx.fill();
            continue;
          }

          p.vx = (p.vx + dx * 0.1 * dt) * dampen;
          p.vy = (p.vy + dy * 0.1 * dt) * dampen;
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 14) { p.vx = p.vx / speed * 14; p.vy = p.vy / speed * 14; }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          live++;

          p.r = Math.max(0.6, p.r - 0.02 * dt);
          const progress = Math.max(0, 1 - d / 120);
          const displayR = p.r * (1 - progress * 0.5);

          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.4, displayR), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;

        if (live > 0) {
          rafRef.current = requestAnimationFrame(draw);
        } else {
          ctx.clearRect(0, 0, SIZE, SIZE);
          ctx.drawImage(off, 0, 0);
        }
      };

      setTimeout(() => {
        prevTime = performance.now();
        rafRef.current = requestAnimationFrame(draw);
      }, 150);
    };

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="logo-hero-inner">
      <canvas ref={canvasRef} className="logo-hero-canvas" />
      <div className="logo-hero-text-anim">
        <span className="lh-script">Eastern Angelica</span>
        <span className="lh-label">Recordings · Est. 2024</span>
      </div>
    </div>
  );
}
