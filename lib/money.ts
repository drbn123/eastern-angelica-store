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

export function shippingCents(_subtotalCents: number, currency: Currency): number {
  return currency === "gbp" ? 545 : 4900;
}

export function shippingLabel(_subtotalCents: number, currency: Currency): string {
  return currency === "gbp" ? "Shipping from £5.45" : "Dostawa od 49 zł";
}
