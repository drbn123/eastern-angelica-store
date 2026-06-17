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

export default function GifHover({ src, alt, autoplay = false }: { src: string; alt: string; autoplay?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef<string | null>(null);
  const [playSrc, setPlaySrc] = useState<string | null>(null);
  // true on touch/stylus devices where hover doesn't work reliably
  const [noHover, setNoHover] = useState(false);

  useEffect(() => {
    setNoHover(window.matchMedia("(hover: none)").matches);
  }, []);

  // Draw the first frame onto a canvas as the static idle poster.
  useEffect(() => {
    if (autoplay || noHover) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [src, autoplay, noHover]);

  // Prefetch the GIF bytes once so hovering can replay from a fresh object URL.
  useEffect(() => {
    if (autoplay || noHover) return;
    let cancelled = false;
    fetch(src)
      .then((r) => r.blob())
      .then((b) => { if (!cancelled) blobRef.current = b; })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    };
  }, [src, autoplay, noHover]);

  const play = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    if (blobRef.current) {
      urlRef.current = URL.createObjectURL(blobRef.current);
      setPlaySrc(urlRef.current);
    } else {
      setPlaySrc(src);
    }
  };

  const stop = () => {
    setPlaySrc(null);
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
  };

  // Always-on: just render the img directly (loops natively, no hover logic needed)
  if (autoplay || noHover) {
    return <img src={src} alt={alt} style={FILL} draggable={false} />;
  }

  return (
    <div style={{ position: "absolute", inset: 0 }} onMouseEnter={play} onMouseLeave={stop}>
      <canvas ref={canvasRef} style={FILL} aria-hidden />
      {playSrc && <img src={playSrc} alt={alt} style={FILL} draggable={false} />}
    </div>
  );
}
