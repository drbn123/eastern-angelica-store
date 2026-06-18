import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { readProducts } from "@/lib/products";
import { createOrder } from "@/lib/orders";
import { type Currency, toCents, shippingCents } from "@/lib/money";
import { sendWhatsApp } from "@/lib/notify";

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
  const body = await req.json() as {
    items: CartItemInput[];
    currency: Currency;
    region?: "uk" | "pl";
    paczkomatId?: string;
    paczkomatAddress?: string;
  };
  const { items, currency, region, paczkomatId, paczkomatAddress } = body;

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
    // In demo mode (no PLN prices set yet) treat 0 as the GBP price
    const effectivePrice = unitPrice > 0 ? unitPrice : (currency === "pln" ? variant.gbp : 0);
    if (effectivePrice <= 0) continue;

    const unitCents = toCents(effectivePrice);
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
      unitPrice: effectivePrice,
      currency,
      ...(product.cover ? { imageUrl: product.cover.startsWith("/") ? `${base}${product.cover}` : product.cover } : {}),
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "No valid items" }, { status: 400 });
  }

  const shipCents = shippingCents(subtotalCents, currency);

  // ── Demo mode: no Stripe key — create order directly and redirect to success ──
  if (!process.env.STRIPE_SECRET_KEY) {
    const order = await createOrder({
      status: "paid",
      currency,
      items: orderItems,
      subtotalCents,
      shippingCents: shipCents,
      totalCents: subtotalCents + shipCents,
      email: "demo@example.com",
      phone: region === "pl" ? "+48 600 100 200" : "+44 20 7946 0000",
      address: region === "pl"
        ? { name: "Demo Klient", line1: "ul. Demonstracyjna 1", city: "Warszawa", postal_code: "00-001", country: "PL" }
        : { name: "Demo Customer", line1: "1 Demo Street", city: "London", postal_code: "EC1A 1BB", country: "GB" },
      stripeSessionId: `demo_${Date.now()}`,
      paidAt: new Date().toISOString(),
      ...(paczkomatId ? { paczkomatId, paczkomatAddress } : {}),
    });
    sendWhatsApp(order);
    return NextResponse.json({ url: `${base}/order/${order.id}` });
  }

  const isPL = region === "pl";

  const shippingAmount = currency === "gbp" ? 330 : 1200;

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      // Phone is required to dispatch an InPost paczkomat (SMS pickup code) and
      // useful for Royal Mail — collect it on every order. Email is always collected.
      phone_number_collection: { enabled: true },
      // PL paczkomat: the locker IS the destination, so we don't collect a shipping
      // address — but we still need the recipient's name/address for the InPost label,
      // so require billing address. UK: collect a GB shipping address as before.
      ...(isPL
        ? { billing_address_collection: "required" as const }
        : {
            shipping_address_collection: {
              allowed_countries: ["GB"] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
            },
          }),
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingAmount, currency },
            display_name: isPL
              ? "InPost Paczkomat — dostawa do paczkomatu"
              : "UK — Royal Mail Small Parcel (LP/12\", 2kg)",
            delivery_estimate: isPL
              ? {
                  minimum: { unit: "business_day" as const, value: 1 },
                  maximum: { unit: "business_day" as const, value: 3 },
                }
              : {
                  minimum: { unit: "business_day" as const, value: 3 },
                  maximum: { unit: "business_day" as const, value: 5 },
                },
          },
        },
      ],
      success_url: `${base}/order/by-session?s={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/store`,
      metadata: {
        currency,
        ...(paczkomatId ? { paczkomatId, paczkomatAddress: paczkomatAddress ?? "" } : {}),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe error";
    console.error("[checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

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
    ...(paczkomatId ? { paczkomatId, paczkomatAddress } : {}),
  });

  return NextResponse.json({ url: session.url });
}
