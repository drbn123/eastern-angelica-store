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
 * Shows a GIF's first frame as a static poster (drawn to a canvas) when idle,
 * and the live, looping animation only while hovered. The animated <img> is
 * mounted fresh on each hover so it always restarts from frame 0 and stops
 * the moment the cursor leaves.
 */
export default function GifHover({ src, alt }: { src: string; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);

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

  return (
    <div
      style={{ position: "absolute", inset: 0 }}
      onMouseEnter={() => setPlaying(true)}
      onMouseLeave={() => setPlaying(false)}
    >
      <canvas ref={canvasRef} style={FILL} aria-hidden />
      {playing && <img src={src} alt={alt} style={FILL} draggable={false} />}
    </div>
  );
}
