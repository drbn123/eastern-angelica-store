"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WaitPage() {
  const params = useSearchParams();
  const router = useRouter();
  const s = params.get("s");

  useEffect(() => {
    if (!s) return;
    const poll = setInterval(async () => {
      const res = await fetch(`/api/track/session?s=${s}`);
      if (res.ok) {
        const { id } = await res.json();
        clearInterval(poll);
        router.replace(`/order/${id}`);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [s, router]);

  return (
    <main className="order-wait">
      <p>Processing your order…</p>
    </main>
  );
}
