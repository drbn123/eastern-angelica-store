import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAuthenticated } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { applyPaidSession } from "@/lib/stripe-sync";
import { sendWhatsApp } from "@/lib/notify";
import { sendOrderConfirmation } from "@/lib/email";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

// Recovers orders stuck on "pending" when checkout.session.completed never reached
// the webhook (e.g. a domain redirect swallowing the delivery). Re-checks each
// pending order's Checkout Session directly against Stripe, independent of webhook
// delivery, so it works regardless of why the webhook failed.
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await listOrders(500);
  const pending = orders.filter((o) => o.status === "pending" && !o.stripeSessionId.startsWith("demo_"));

  const stripe = getStripe();
  let updated = 0;
  const errors: string[] = [];

  for (const order of pending) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
        expand: ["shipping_cost.shipping_rate"],
      });
      if (session.payment_status !== "paid") continue;

      const result = await applyPaidSession(order, session);
      if (result) {
        updated++;
        sendWhatsApp(result);
        sendOrderConfirmation(result);
      }
    } catch (err) {
      errors.push(`EA-${order.number}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return NextResponse.json({ checked: pending.length, updated, errors });
}
