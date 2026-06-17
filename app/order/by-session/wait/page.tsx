"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function WaitInner() {
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

  return <p>Processing your order…</p>;
}

export default function WaitPage() {
  return (
    <main className="order-wait">
      <Suspense fallback={<p>Processing your order…</p>}>
        <WaitInner />
      </Suspense>
    </main>
  );
}
