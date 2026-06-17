import { redirect, notFound } from "next/navigation";
import { getOrderByStripeSession } from "@/lib/orders";

export default async function BySessionPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  if (!s) notFound();
  const order = await getOrderByStripeSession(s);
  if (!order) {
    // Webhook may not have fired yet — poll briefly
    redirect(`/order/by-session/wait?s=${s}`);
  }
  redirect(`/order/${order.id}`);
}
