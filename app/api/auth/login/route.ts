import { cookies } from "next/headers";
import { checkCredentials, createSessionToken, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (!checkCredentials(username, password)) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
    sameSite: "lax",
  });
  return Response.json({ ok: true });
}
