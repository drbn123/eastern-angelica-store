"use client";

import Image from "next/image";
import { coverSvg } from "@/lib/catalog";
import type { Release } from "@/lib/types";

interface Props {
  idx: number;
  release?: Release;
  className?: string;
}

export default function Cover({ idx, release, className = "" }: Props) {
  const photo = release?.cover;
  if (photo) {
    return (
      <div className={`cover cover-photo ${className}`}>
        <Image src={photo} alt={release?.title ?? ""} fill style={{ objectFit: "cover" }} />
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
