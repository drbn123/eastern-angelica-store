import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrderByStripeSession, updateOrder } from "@/lib/orders";
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

    // Stripe API 2026-05-27: shipping address is in collected_information.shipping_details.
    // PL paczkomat orders have no shipping address — fall back to the billing details
    // (name/address/phone) collected on the Stripe page so we can label the parcel.
    const shipping = session.collected_information?.shipping_details;
    const billing = session.customer_details;
    const addr = shipping?.address ?? billing?.address ?? null;
    const recipientName = shipping?.name ?? billing?.name ?? "";

    const actualShipCents = session.shipping_cost?.amount_total ?? order.shippingCents;
    const shippingRate = session.shipping_cost?.shipping_rate;
    const shippingLabel = (shippingRate && typeof shippingRate !== "string")
      ? (shippingRate as Stripe.ShippingRate).display_name ?? undefined
      : undefined;

    const paczkomatId = session.metadata?.paczkomatId || order.paczkomatId;
    const paczkomatAddress = session.metadata?.paczkomatAddress || order.paczkomatAddress;

    const updated = await updateOrder(order.id, {
      status: "paid",
      email: billing?.email ?? "",
      phone: billing?.phone ?? undefined,
      address: addr
        ? {
            name: recipientName,
            line1: addr.line1 ?? "",
            line2: addr.line2 ?? undefined,
            city: addr.city ?? "",
            postal_code: addr.postal_code ?? "",
            country: addr.country ?? "",
          }
        : null,
      shippingCents: actualShipCents,
      shippingLabel,
      totalCents: order.subtotalCents + actualShipCents,
      stripePaymentIntent:
        typeof session.payment_intent === "string" ? session.payment_intent : undefined,
      paidAt: new Date().toISOString(),
      ...(paczkomatId ? { paczkomatId, paczkomatAddress } : {}),
    });
    if (updated) {
      sendWhatsApp(updated);
      sendOrderConfirmation(updated);
    }
  }

  return NextResponse.json({ received: true });
}
