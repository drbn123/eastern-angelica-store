"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { coverSvg, RELEASES } from "@/lib/catalog";
import type { Release } from "@/lib/types";
import LogoHero from "@/components/LogoHero";

export default function HomeHero() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const recent = RELEASES.slice(0, 5);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    setSubmitted(true);
  };

  return (
    <>
      {recent.map((r, i) => (
        <ReleasePreview key={r.id} release={r} idx={i} visible={hovered === i} />
      ))}

      <section className={`v0${hovered !== null ? " v0-previewing" : ""}`}>
        {/* Left panel — black + particle logo */}
        <div className="v0-logo-panel">
          <LogoHero />
        </div>

        <aside className="v0-side">
          <div className="v0-side-hd">
            <h2 className="v0-side-title">Recent Releases</h2>
            <Link href="/store" className="v0-view-all">
              → View all
            </Link>
          </div>
          <ul className="v0-recent">
            {recent.map((r, i) => (
              <li
                key={r.id}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={hovered === i ? "v0-recent-active" : ""}
              >
                <Link href="/store" style={{ display: "contents" }}>
                  <div className="v0-recent-thumb">
                    {r.cover ? (
                      <Image src={r.cover} alt={r.title} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <div
                        style={{ width: "100%", height: "100%" }}
                        dangerouslySetInnerHTML={{ __html: coverSvg(i) }}
                      />
                    )}
                  </div>
                  <div className="v0-recent-meta">
                    <span className="v0-recent-artist">{r.artist}</span>
                    <span className="v0-recent-title">{r.title}</span>
                    <span className="v0-recent-format">
                      {r.format} · {r.edition}
                    </span>
                  </div>
                  <span className="v0-recent-price">{r.price} €</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="v0-newsletter">
          {submitted ? (
            <>
              <span className="v0-nl-label">Newsletter</span>
              <span
                style={{
                  gridColumn: "2 / 5",
                  color: "var(--fg-dim)",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                ✓ subscribed — thanks
              </span>
            </>
          ) : (
            <form onSubmit={handleNewsletter} style={{ display: "contents" }}>
              <span className="v0-nl-label">Newsletter</span>
              <input
                className="v0-nl-input"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="v0-nl-input"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="v0-nl-btn">
                Subscribe
              </button>
              <span className="v0-nl-right">© EA Recordings 2026</span>
              <span className="v0-nl-socials">IG · BC · SPOTIFY · TIKTOK</span>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

function ReleasePreview({
  release,
  idx,
  visible,
}: {
  release: Release;
  idx: number;
  visible: boolean;
}) {
  return (
    <div className={`v0-release-preview${visible ? " on" : ""}`} aria-hidden>
      {release.cover ? (
        <Image src={release.cover} alt="" fill style={{ objectFit: "cover" }} sizes="100vw" />
      ) : (
        <div
          className="v0-release-preview-svg"
          dangerouslySetInnerHTML={{ __html: coverSvg(idx) }}
        />
      )}
      <div className="v0-release-preview-scrim" />
      <div className="v0-release-preview-meta">
        <span className="v0-release-preview-artist">{release.artist}</span>
        <h2 className="v0-release-preview-title">{release.title}</h2>
        <span className="v0-release-preview-detail">
          {release.format} · {release.edition} · {release.year}
        </span>
      </div>
    </div>
  );
}
