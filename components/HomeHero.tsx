"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Cover from "@/components/Cover";
import { RELEASES } from "@/lib/catalog";

export default function HomeHero() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
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
    <section className="v0">
      <div className="v0-photo-hero">
        <Image
          src="/assets/ea-front-inside.png"
          alt="Eastern Angelica"
          fill
          className="v0-bg"
          priority
        />
        <div className="v0-bg-scrim" />

        <div className="v0-hero-content">
          <div className="v0-logo-block">
            <Image
              src="/assets/ea-monument.png"
              alt="EA monument"
              width={68}
              height={68}
              className="v0-monument"
            />
            <div className="v0-label-mark">
              <span className="v0-label-italic">Eastern Angelica</span>
              <span className="v0-label-sub">RECORDINGS · EST. 2024</span>
            </div>
          </div>

          <div className="v0-manifest">
            <p>
              <em>Eastern Angelica</em> — a record company
              <br />
              for <em>folk</em>, <em>rap</em>, and <em>liturgy</em>
              <br />
              of the <em>eastern edge</em>.
            </p>
            <p className="v0-manifest-creed">
              May we all find the Angelica we seek.
              <br />
              It&rsquo;s bound to us like the breath in our lungs.
              <br />
              You&rsquo;ll likely find it on the mossy path less travelled by.
            </p>
          </div>
        </div>
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
            <li key={r.id}>
              <Link href="/store" style={{ display: "contents" }}>
                <Cover idx={i} release={r} />
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
            <span style={{ gridColumn: "2 / 5", color: "var(--fg-dim)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>
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
  );
}
