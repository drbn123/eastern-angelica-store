import { cookies } from "next/headers";

const SESSION_COOKIE = "ea_session";
const SESSION_VALUE = "ea-admin-ok-2026";
export const CREDENTIALS = { username: "admin", password: "admin" };

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export { SESSION_COOKIE, SESSION_VALUE };
