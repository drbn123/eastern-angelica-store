"use client";

import { useState } from "react";
import Image from "next/image";

interface Video {
  videoId: string;
  title: string;
  published: string;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const month = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
    return `${month} ${d.getFullYear()}`;
  } catch {
    return iso.slice(0, 7);
  }
}

function trackName(title: string) {
  const parts = title.split(/\s[-–—]\s/);
  return parts.length > 1 ? parts.slice(1).join(" — ") : title;
}

function Thumb({
  video,
  playing,
  onPlay,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  video: Video;
  playing: boolean;
  onPlay: () => void;
  sizes?: string;
}) {
  return (
    <div className={`vid-thumb${playing ? " playing" : ""}`} onClick={onPlay}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={video.title}
        />
      ) : (
        <>
          <Image
            src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
            alt={video.title}
            fill
            sizes={sizes}
            style={{ objectFit: "cover" }}
          />
          <div className="vid-play">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

export default function VideoGrid({ videos }: { videos: Video[] }) {
  const [active, setActive] = useState<string | null>(null);

  if (!videos.length) {
    return (
      <section className="v1">
        <div className="hero"><h1><i>Videos</i></h1></div>
        <p className="vid-empty">No videos found.</p>
      </section>
    );
  }

  const toggle = (id: string) => setActive(active === id ? null : id);

  return (
    <section className="v1">
      <div className="hero">
        <h1><i>Videos</i></h1>
        <div className="blurb" />
        <div className="meta">
          <span>{videos.length} videos</span>
          <span>Kuzko</span>
        </div>
      </div>

      <div className="vid-grid">
        {videos.map((v, i) => (
          <article key={v.videoId} className="vid-card">
            <span className="idx">№ {String(i + 1).padStart(2, "0")}</span>
            <Thumb
              video={v}
              playing={active === v.videoId}
              onPlay={() => toggle(v.videoId)}
            />
            <div className="vid-meta">
              <span className="vid-label">Kuzko · {formatDate(v.published)}</span>
              <h3 className="vid-title"><i>{trackName(v.title)}</i></h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
