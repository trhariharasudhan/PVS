/**
 * Retail price visibility guard.
 *
 * PVS is a B2B manufacturer. The sample catalogue prices in data/products.ts are
 * NOT confirmed by the business, so they stay hidden unless the owner explicitly
 * turns them on with NEXT_PUBLIC_SHOW_RETAIL_PRICES=true (after verifying them).
 *
 * Every price shown to a customer must go through these helpers so a single
 * flag controls what is promised on the site.
 */

export const SHOW_RETAIL_PRICES = process.env.NEXT_PUBLIC_SHOW_RETAIL_PRICES === "true";

export const PRICE_ON_REQUEST = "Price on request";

/** Shipping copy: only make a promise when prices (and terms) are confirmed. */
export const SHIPPING_TERMS = SHOW_RETAIL_PRICES ? "Free (All India)" : "Confirmed on enquiry";

/** Label for a product's catalogue price string (e.g. "₹18,500"). */
export function displayPrice(priceDisplay?: string | null): string {
  if (!SHOW_RETAIL_PRICES || !priceDisplay) return PRICE_ON_REQUEST;
  return priceDisplay;
}

/** Format an amount in INR, or "Price on request" when prices are hidden / unknown. */
export function formatAmount(amount?: number | null): string {
  if (!SHOW_RETAIL_PRICES || amount == null || !Number.isFinite(amount) || amount <= 0) {
    return PRICE_ON_REQUEST;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Text fragment for WhatsApp messages: includes a total only when prices are confirmed. */
export function totalForMessage(amount: number): string {
  return SHOW_RETAIL_PRICES ? ` (Total: ₹${amount.toLocaleString("en-IN")})` : "";
}
