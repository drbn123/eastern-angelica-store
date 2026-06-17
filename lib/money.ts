export type Currency = "gbp" | "pln";

export const CURRENCY_COOKIE = "ea_currency";
export const DEFAULT_CURRENCY: Currency = "gbp";

export function formatPrice(amount: number, currency: Currency): string {
  if (currency === "gbp") {
    return amount % 1 === 0 ? `£${amount}` : `£${amount.toFixed(2)}`;
  }
  return `${Math.round(amount)} zł`;
}

export function variantPrice(v: { gbp: number; pln: number }, currency: Currency): number {
  return currency === "gbp" ? v.gbp : v.pln;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function shippingCents(subtotalCents: number, currency: Currency): number {
  if (currency === "gbp") return subtotalCents >= 5000 ? 0 : 599;
  return subtotalCents >= 20000 ? 0 : 1900;
}

export function shippingLabel(subtotalCents: number, currency: Currency): string {
  if (currency === "gbp") return subtotalCents >= 5000 ? "Free shipping" : "Standard shipping";
  return subtotalCents >= 20000 ? "Dostawa gratis" : "Dostawa standardowa";
}
