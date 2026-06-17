import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrderByStripeSession, updateOrder } from "@/lib/orders";
import { sendWhatsApp } from "@/lib/notify";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

type StripeSession = Stripe.Checkout.Session & {
  shipping_details?: {
    name?: string | null;
    address?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      postal_code?: string | null;
      country?: string | null;
    } | null;
  } | null;
};

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
    const raw = event.data.object as StripeSession;
    const session = await getStripe().checkout.sessions.retrieve(raw.id) as StripeSession;
    const order = await getOrderByStripeSession(session.id);
    if (!order) return NextResponse.json({ received: true });

    const addr = session.shipping_details?.address;
    const updated = await updateOrder(order.id, {
      status: "paid",
      email: session.customer_details?.email ?? "",
      address: addr
        ? {
            name: session.shipping_details?.name ?? session.customer_details?.name ?? "",
            line1: addr.line1 ?? "",
            line2: addr.line2 ?? undefined,
            city: addr.city ?? "",
            postal_code: addr.postal_code ?? "",
            country: addr.country ?? "",
          }
        : null,
      stripePaymentIntent:
        typeof session.payment_intent === "string" ? session.payment_intent : undefined,
      paidAt: new Date().toISOString(),
    });
    if (updated) sendWhatsApp(updated);
  }

  return NextResponse.json({ received: true });
}
