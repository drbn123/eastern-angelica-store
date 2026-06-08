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
    return new Date(iso).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function VideoGrid({ videos }: { videos: Video[] }) {
  const [active, setActive] = useState<string | null>(null);

  if (!videos.length) {
    return <p className="videos-empty">No videos found.</p>;
  }

  return (
    <div className="videos-grid">
      {videos.map((v, i) => {
        const playing = active === v.videoId;
        return (
          <article key={v.videoId} className={`video-card${playing ? " playing" : ""}`}>
            <span className="video-idx">№ {String(i + 1).padStart(2, "0")}</span>
            <div className="video-thumb" onClick={() => setActive(playing ? null : v.videoId)}>
              {playing ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1&rel=0&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={v.title}
                />
              ) : (
                <>
                  <Image
                    src={`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`}
                    alt={v.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: "cover" }}
                  />
                  <div className="video-play">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </>
              )}
            </div>
            <div className="video-meta">
              <h3>{v.title}</h3>
              <span className="video-date">{formatDate(v.published)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
