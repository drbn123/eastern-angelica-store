"use client";

import { useEffect, useRef, useState } from "react";

export const isGif = (url: string) => url.split("?")[0].toLowerCase().endsWith(".gif");

const FILL: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

/**
 * Shows a GIF's first frame as a static poster (drawn to a canvas) while idle,
 * and the live, looping animation only while hovered.
 *
 * To guarantee the animation always restarts from frame 0 (browsers otherwise
 * share a single animation timeline per GIF URL and resume mid-loop), the GIF
 * is fetched once into an in-memory Blob and a fresh object URL is minted on
 * each hover — a new URL is a new resource identity, so it decodes from the
 * start. No re-download, so it stays smooth.
 */
export default function GifHover({ src, alt }: { src: string; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef<string | null>(null);
  const [playSrc, setPlaySrc] = useState<string | null>(null);

  // Draw the first frame onto a canvas as the static idle poster.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [src]);

  // Prefetch the GIF bytes once so hovering can replay from a fresh object URL
  // without hitting the network again.
  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => r.blob())
      .then((b) => { if (!cancelled) blobRef.current = b; })
      .catch(() => { /* cross-origin/offline: fall back to raw src on hover */ });
    return () => {
      cancelled = true;
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    };
  }, [src]);

  const play = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    if (blobRef.current) {
      urlRef.current = URL.createObjectURL(blobRef.current);
      setPlaySrc(urlRef.current);
    } else {
      setPlaySrc(src); // blob not ready yet — degrade gracefully
    }
  };

  const stop = () => {
    setPlaySrc(null);
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
  };

  return (
    <div style={{ position: "absolute", inset: 0 }} onMouseEnter={play} onMouseLeave={stop}>
      <canvas ref={canvasRef} style={FILL} aria-hidden />
      {playSrc && <img src={playSrc} alt={alt} style={FILL} draggable={false} />}
    </div>
  );
}
