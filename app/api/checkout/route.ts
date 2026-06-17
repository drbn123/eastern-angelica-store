import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { readProducts } from "@/lib/products";
import { createOrder } from "@/lib/orders";
import { type Currency, toCents, shippingCents, shippingLabel } from "@/lib/money";
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
      address: {
        name: "Demo Customer",
        line1: "1 Demo Street",
        city: currency === "gbp" ? "London" : "Warszawa",
        postal_code: currency === "gbp" ? "EC1A 1BB" : "00-001",
        country: currency === "gbp" ? "GB" : "PL",
      },
      stripeSessionId: `demo_${Date.now()}`,
      paidAt: new Date().toISOString(),
    });
    sendWhatsApp(order);
    return NextResponse.json({ url: `${base}/store?order=success&demo=${order.number}` });
  }

  const WORLDWIDE_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] = [
    "AC","AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AT","AU","AW","AZ",
    "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BW","BY","BZ",
    "CA","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CV","CW","CY","CZ",
    "DE","DJ","DK","DM","DO","DZ",
    "EC","EE","EG","ER","ES","ET",
    "FI","FJ","FK","FO","FR",
    "GA","GB","GD","GE","GF","GH","GI","GL","GM","GN","GP","GQ","GR","GT","GW","GY",
    "HK","HN","HR","HT","HU",
    "ID","IE","IL","IN","IQ","IS","IT",
    "JM","JO","JP",
    "KE","KG","KH","KI","KM","KN","KR","KW","KY","KZ",
    "LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY",
    "MA","MC","MD","ME","MG","MK","ML","MM","MN","MO","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ",
    "NA","NC","NE","NG","NI","NL","NO","NP","NR","NU","NZ",
    "OM",
    "PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY",
    "QA",
    "RE","RO","RS","RW",
    "SA","SB","SC","SE","SG","SH","SI","SK","SL","SM","SN","SO","SR","ST","SV","SX","SZ",
    "TC","TD","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TZ",
    "UA","UG","US","UY","UZ",
    "VA","VC","VE","VG","VN","VU",
    "WF","WS","XK","YE",
    "ZA","ZM","ZW",
  ];

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: currency === "gbp"
      ? ["card"]
      : ["card", "blik", "p24"],
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: WORLDWIDE_COUNTRIES,
    },
    shipping_options: currency === "gbp"
      ? [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 545, currency: "gbp" },
              display_name: "Small Parcel (LP/12\") — Royal Mail UK",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 3 },
                maximum: { unit: "business_day" as const, value: 5 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 980, currency: "gbp" },
              display_name: "International Tracked — Royal Mail (tracking + £50 cover)",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 3 },
                maximum: { unit: "business_day" as const, value: 14 },
              },
            },
          },
        ]
      : [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 4900, currency: "pln" },
              display_name: "International Tracked — Royal Mail (tracking + £50 cover)",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 3 },
                maximum: { unit: "business_day" as const, value: 14 },
              },
            },
          },
        ],
    success_url: `${base}/store?order=success&session_id={CHECKOUT_SESSION_ID}`,
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
