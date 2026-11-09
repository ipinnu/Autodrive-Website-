const returnKey = "autodrive-checkout-return";
const lifetime = 24 * 60 * 60 * 1000;

export function validCheckoutRef(ref: unknown): ref is string {
  return typeof ref === "string" && /^WebRenew[a-f0-9]{32}[A-Za-z0-9_-]{1,128}$/.test(ref);
}

export function rememberCheckout(ref: string, uid?: string) {
  if (!validCheckoutRef(ref)) return;
  try {
    const storage = uid ? localStorage : sessionStorage;
    storage.setItem(uid ? returnKey + "-" + uid : returnKey, JSON.stringify({ ref, at: Date.now() }));
  } catch {
    // Checkout remains usable if browser storage is blocked.
  }
}

export function readCheckout(uid?: string, consume = false): string | undefined {
  try {
    const storage = uid ? localStorage : sessionStorage;
    const key = uid ? returnKey + "-" + uid : returnKey;
    const value = JSON.parse(storage.getItem(key) || "null");
    if (consume || (value && Date.now() - value.at > lifetime)) storage.removeItem(key);
    if (value && Date.now() - value.at <= lifetime && validCheckoutRef(value.ref)) return value.ref;
  } catch {
    // The customer can still find their orders in Renewals.
  }
}
