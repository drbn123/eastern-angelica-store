"use client";

import { useEffect, useRef } from "react";

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

const CANVAS_W = 480;
const LOGO_H = 480;
const TEXT_H = 96;
const CANVAS_H = LOGO_H + TEXT_H;
const SAMPLE_STEP = 4;
const TEXT_SAMPLE_STEP = 2;

export default function LogoHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;
    ctx.scale(dpr, dpr);

    const pad = 60;

    const img = new Image();
    img.src = "/assets/ea-monument.png";
    img.onload = async () => {
      // Wait for web fonts so text renders correctly on canvas
      try {
        await Promise.all([
          document.fonts.load("44px 'Pinyon Script'"),
          document.fonts.load("700 9px 'JetBrains Mono'"),
        ]);
      } catch (_) {
        await document.fonts.ready;
      }

      // --- Sample logo pixels ---
      const logoOff = document.createElement("canvas");
      logoOff.width = CANVAS_W;
      logoOff.height = LOGO_H;
      const logoCtx = logoOff.getContext("2d")!;
      logoCtx.drawImage(img, pad, pad, CANVAS_W - pad * 2, LOGO_H - pad * 2);
      const { data: logoData } = logoCtx.getImageData(0, 0, CANVAS_W, LOGO_H);

      // --- Sample text pixels ---
      const textOff = document.createElement("canvas");
      textOff.width = CANVAS_W;
      textOff.height = TEXT_H;
      const tCtx = textOff.getContext("2d")!;
      tCtx.fillStyle = "#f2eee3";
      tCtx.textAlign = "center";
      tCtx.textBaseline = "top";

      tCtx.font = "44px 'Pinyon Script', cursive";
      tCtx.fillText("Eastern Angelica", CANVAS_W / 2, 4);

      tCtx.font = "700 9px 'JetBrains Mono', monospace";
      try { (tCtx as any).letterSpacing = "0.32em"; } catch (_) {}
      tCtx.fillText("RECORDINGS · EST. 2024", CANVAS_W / 2, 62);

      const { data: textData } = tCtx.getImageData(0, 0, CANVAS_W, TEXT_H);

      const particles: Particle[] = [];

      // Logo particles
      for (let y = 0; y < LOGO_H; y += SAMPLE_STEP) {
        for (let x = 0; x < CANVAS_W; x += SAMPLE_STEP) {
          const i = (y * CANVAS_W + x) * 4;
          if (logoData[i + 3] > 40) {
            particles.push({
              tx: x, ty: y,
              x: Math.random() * CANVAS_W,
              y: Math.random() * CANVAS_H,
              vx: (Math.random() - 0.5) * 0.8,
              vy: (Math.random() - 0.5) * 0.8,
              alpha: 0,
              targetAlpha: (logoData[i + 3] / 255) * 0.85 + 0.1,
              r: 3.5 + Math.random() * 3,
              delay: Math.floor(Math.random() * 55),
            });
          }
        }
      }

      // Text particles — stagger starts at frame 80 so text assembles after logo
      for (let y = 0; y < TEXT_H; y += TEXT_SAMPLE_STEP) {
        for (let x = 0; x < CANVAS_W; x += TEXT_SAMPLE_STEP) {
          const i = (y * CANVAS_W + x) * 4;
          if (textData[i + 3] > 40) {
            particles.push({
              tx: x, ty: LOGO_H + y,
              x: Math.random() * CANVAS_W,
              y: Math.random() * CANVAS_H,
              vx: (Math.random() - 0.5) * 0.8,
              vy: (Math.random() - 0.5) * 0.8,
              alpha: 0,
              targetAlpha: (textData[i + 3] / 255) * 0.8 + 0.1,
              r: 2 + Math.random() * 2,
              delay: 80 + Math.floor(Math.random() * 55),
            });
          }
        }
      }

      let finishing = false;
      let finishAlpha = 0;

      const draw = () => {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        let maxDist = 0;
        let anyDelayed = false;

        for (const p of particles) {
          if (p.delay > 0) {
            p.delay--;
            anyDelayed = true;
            continue;
          }

          p.alpha = Math.min(p.targetAlpha, p.alpha + 0.022);

          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          maxDist = Math.max(maxDist, d);

          p.vx += dx * 0.018;
          p.vy += dy * 0.018;
          p.vx *= 0.87;
          p.vy *= 0.87;
          p.x += p.vx;
          p.y += p.vy;

          const progress = Math.max(0, 1 - d / 180);
          p.r = Math.max(0.8, p.r - 0.03);
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

        // Cross-fade clean image over assembled particles — no flash
        if (finishing) {
          finishAlpha = Math.min(1, finishAlpha + 0.045);
          ctx.globalAlpha = finishAlpha;
          ctx.drawImage(img, pad, pad, CANVAS_W - pad * 2, LOGO_H - pad * 2);
          ctx.drawImage(textOff, 0, LOGO_H);
          ctx.globalAlpha = 1;
          if (finishAlpha < 1) rafRef.current = requestAnimationFrame(draw);
          return;
        }

        ctx.globalAlpha = 1;

        if (maxDist > 1.2 || anyDelayed) {
          rafRef.current = requestAnimationFrame(draw);
        } else {
          finishing = true;
          rafRef.current = requestAnimationFrame(draw);
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
    </div>
  );
}
