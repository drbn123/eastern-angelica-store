import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "ea_session";

// Admin credentials and the session signing secret come from environment
// variables. The dev fallbacks only apply to local `next dev`; production sets
// real values (ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET) on Vercel.
// A second operator account is optional: set ADMIN_USERNAME_2 / ADMIN_PASSWORD_2.
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "dev-only-insecure-secret";

interface AdminAccount {
  username: string;
  password: string;
}

function adminAccounts(): AdminAccount[] {
  const accounts: AdminAccount[] = [
    { username: process.env.ADMIN_USERNAME ?? "admin", password: process.env.ADMIN_PASSWORD ?? "admin" },
  ];
  if (process.env.ADMIN_USERNAME_2 && process.env.ADMIN_PASSWORD_2) {
    accounts.push({ username: process.env.ADMIN_USERNAME_2, password: process.env.ADMIN_PASSWORD_2 });
  }
  return accounts;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function sign(value: string): string {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

// Constant-time comparison. Inputs here are equal-length HMAC digests, so this
// never leaks length or content through timing.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkCredentials(username: unknown, password: unknown): boolean {
  if (typeof username !== "string" || typeof password !== "string") return false;
  // Compare HMACs so neither timing nor length reveals the real credentials.
  // Check every configured account without early-exit, then return the result.
  let ok = false;
  for (const acct of adminAccounts()) {
    if (safeEqual(sign(username), sign(acct.username)) && safeEqual(sign(password), sign(acct.password))) {
      ok = true;
    }
  }
  return ok;
}

// Stateless signed session token: base64url(payload) + "." + HMAC(payload).
// Can't be forged without the secret, and carries its own expiry.
export function createSessionToken(): string {
  const body = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, sign(body))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export { SESSION_COOKIE, SESSION_TTL_MS };
