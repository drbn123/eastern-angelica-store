"use client";

import Image from "next/image";
import { useState } from "react";
import { coverSvg } from "@/lib/catalog";
import type { Release } from "@/lib/types";

interface Props {
  idx: number;
  release?: Release;
  className?: string;
}

const isGif = (url: string) => url.split("?")[0].toLowerCase().endsWith(".gif");

export default function Cover({ idx, release, className = "" }: Props) {
  const [hovered, setHovered] = useState(false);
  const photo = release?.cover;

  if (photo) {
    const gif = isGif(photo);
    return (
      <div
        className={`cover cover-photo ${className}`}
        onMouseEnter={() => gif && setHovered(true)}
        onMouseLeave={() => gif && setHovered(false)}
      >
        {gif && hovered ? (
          <img src={photo} alt={release?.title ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <Image src={photo} alt={release?.title ?? ""} fill style={{ objectFit: "cover" }} />
        )}
      </div>
    );
  }
  return (
    <div
      className={`cover ${className}`}
      dangerouslySetInnerHTML={{ __html: coverSvg(idx) }}
    />
  );
}
