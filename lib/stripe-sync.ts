import type Stripe from "stripe";
import { type Order, updateOrder } from "./orders";

// Stripe API 2026-05-27: shipping address is in collected_information.shipping_details.
// PL paczkomat orders have no shipping address — fall back to the billing details
// (name/address/phone) collected on the Stripe page so we can label the parcel.
export async function applyPaidSession(order: Order, session: Stripe.Checkout.Session): Promise<Order | null> {
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

  return updateOrder(order.id, {
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
}
