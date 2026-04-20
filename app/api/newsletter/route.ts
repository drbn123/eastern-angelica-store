import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // TODO: Replace with real Brevo API call when account is set up:
  // await fetch("https://api.brevo.com/v3/contacts", {
  //   method: "POST",
  //   headers: { "api-key": process.env.BREVO_API_KEY!, "Content-Type": "application/json" },
  //   body: JSON.stringify({ email, attributes: { FIRSTNAME: name }, listIds: [YOUR_LIST_ID] }),
  // });

  console.log("Newsletter signup:", { name, email });

  return NextResponse.json({ ok: true });
}
