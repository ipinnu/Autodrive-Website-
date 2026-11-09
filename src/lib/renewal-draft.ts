import type { Quote, Selection } from "./customer-checkout";

type RenewalDraft = { selection: Selection[]; quote?: Quote };
const key = (uid: string) => `autodrive-renewal-draft-${uid}`;
export function readRenewalDraft(uid: string): RenewalDraft {
  try {
    const value = JSON.parse(sessionStorage.getItem(key(uid)) || "null");
    if (!Array.isArray(value?.selection) || value.selection.length > 50) return { selection: [] };
    const selection = value.selection.filter((s: Selection) => typeof s?.carId === "string" && typeof s?.documentId === "string");
    const quote = value.quote;
    return { selection, ...(quote && quote.expiresAt > Date.now() && sameSelection(selection, quote.selectedDocuments) ? { quote } : {}) };
  } catch { return { selection: [] }; }
}
export function saveRenewalDraft(uid: string, selection: Selection[], quote?: Quote) {
  try { sessionStorage.setItem(key(uid), JSON.stringify({ selection, ...(quote ? { quote } : {}) })); } catch { /* In-memory selection still works when storage is unavailable. */ }
}
export function sameSelection(a: Selection[], b: Selection[]) {
  return Array.isArray(b) && a.length === b.length && a.every((s, i) => s.carId === b[i]?.carId && s.documentId === b[i]?.documentId);
}
