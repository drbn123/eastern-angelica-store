import type { Order } from "./orders";
import { formatPrice } from "./money";

export async function sendWhatsApp(order: Order): Promise<void> {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return;

  const items = order.items.map((i) => `${i.title} x${i.qty}`).join(", ");
  const total = formatPrice(order.totalCents / 100, order.currency);
  const country = order.address?.country ?? (order.currency === "gbp" ? "GB" : "PL");
  const flag = country === "GB" ? "🇬🇧" : country === "PL" ? "🇵🇱" : "🌍";

  const text = `${flag} New order EA-${order.number}\n${items}\nTotal: ${total}\n${order.email || "no email"}`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;

  try {
    await fetch(url);
  } catch {
    // non-critical — don't break checkout if notification fails
  }
}
