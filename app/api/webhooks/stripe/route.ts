import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrderByStripeSession } from "@/lib/orders";
import { applyPaidSession } from "@/lib/stripe-sync";
import { sendWhatsApp } from "@/lib/notify";
import { sendOrderConfirmation } from "@/lib/email";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const raw = event.data.object as Stripe.Checkout.Session;
    const session = await getStripe().checkout.sessions.retrieve(raw.id, {
      expand: ["shipping_cost.shipping_rate"],
    });
    const order = await getOrderByStripeSession(session.id);
    if (!order) return NextResponse.json({ received: true });

    const updated = await applyPaidSession(order, session);
    if (updated) {
      sendWhatsApp(updated);
      sendOrderConfirmation(updated);
    }
  }

  return NextResponse.json({ received: true });
}
