import { cookies } from "next/headers";
import { CREDENTIALS, SESSION_COOKIE, SESSION_VALUE } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (username !== CREDENTIALS.username || password !== CREDENTIALS.password) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  return Response.json({ ok: true });
}
