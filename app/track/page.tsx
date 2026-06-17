"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TrackPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, number }),
      });
      if (!res.ok) {
        setError("Order not found. Check your email and order number.");
        return;
      }
      const { id } = await res.json();
      router.push(`/order/${id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="track-page">
      <Link href="/store" className="track-back">← Store</Link>
      <h1 className="track-title">Track your order</h1>
      <form className="track-form" onSubmit={handleSubmit}>
        <label className="track-label">
          Order number
          <input
            className="track-input"
            placeholder="EA-1000"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
          />
        </label>
        <label className="track-label">
          Email address
          <input
            className="track-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {error && <div className="track-error">{error}</div>}
        <button className="track-submit" type="submit" disabled={loading}>
          {loading ? "Searching…" : "Find order →"}
        </button>
      </form>
    </main>
  );
}
