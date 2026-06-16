import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { readProducts } from "@/lib/products";
import { createOrder } from "@/lib/orders";
import { type Currency, toCents, shippingCents, shippingLabel } from "@/lib/money";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

interface CartItemInput {
  id: string;
  vIdx: number;
  qty: number;
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ url: null, message: "Stripe not configured yet." }, { status: 503 });
  }

  const body = await req.json() as { items: CartItemInput[]; currency: Currency };
  const { items, currency } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Empty cart" }, { status: 400 });
  }
  if (currency !== "gbp" && currency !== "pln") {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }

  const products = await readProducts();
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const orderItems = [];
  let subtotalCents = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.id);
    if (!product) continue;
    const variant = product.variants[item.vIdx];
    if (!variant) continue;

    const unitPrice = currency === "gbp" ? variant.gbp : variant.pln;
    if (unitPrice <= 0) {
      return NextResponse.json(
        { error: `${product.title} — ${variant.k}: price not set for ${currency.toUpperCase()}` },
        { status: 400 },
      );
    }
    const unitCents = toCents(unitPrice);
    subtotalCents += unitCents * item.qty;

    lineItems.push({
      price_data: {
        currency,
        product_data: {
          name: `${product.title} — ${variant.k}`,
          ...(product.cover ? { images: [product.cover.startsWith("/") ? `${base}${product.cover}` : product.cover] } : {}),
        },
        unit_amount: unitCents,
      },
      quantity: item.qty,
    });

    orderItems.push({
      id: product.id,
      title: product.title,
      variant: variant.k,
      qty: item.qty,
      unitPrice,
      currency,
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "No valid items" }, { status: 400 });
  }

  const shipCents = shippingCents(subtotalCents, currency);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: currency === "gbp"
      ? ["card"]
      : ["card", "blik", "p24"],
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: currency === "gbp" ? ["GB"] : ["PL"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shipCents, currency },
          display_name: shippingLabel(subtotalCents, currency),
          delivery_estimate: {
            minimum: { unit: "business_day" as const, value: currency === "gbp" ? 3 : 2 },
            maximum: { unit: "business_day" as const, value: currency === "gbp" ? 7 : 5 },
          },
        },
      },
    ],
    success_url: `${base}/store?order=success`,
    cancel_url: `${base}/store`,
    metadata: { currency },
  });

  await createOrder({
    status: "pending",
    currency,
    items: orderItems,
    subtotalCents,
    shippingCents: shipCents,
    totalCents: subtotalCents + shipCents,
    email: "",
    address: null,
    stripeSessionId: session.id,
  });

  return NextResponse.json({ url: session.url });
}
