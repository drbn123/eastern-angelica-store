import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // TODO: Replace with real Stripe Checkout session when account is set up:
  // const session = await stripe.checkout.sessions.create({ ... });
  // return NextResponse.json({ url: session.url });

  console.log("Dummy checkout — items:", JSON.stringify(body.items));

  return NextResponse.json({
    url: null,
    message: "Checkout coming soon — Stripe integration pending.",
  });
}
