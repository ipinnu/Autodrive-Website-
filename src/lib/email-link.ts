import { sendSignInLinkToEmail } from "firebase/auth";
import { client } from "./customer";

export type PlateIntent = "renew" | "remind";
export type PlateDraft = { plate: string; fullName: string; intent: PlateIntent };
type EmailDraft = { id: string; email: string; expires: number; plateDraft?: PlateDraft };
const pendingKey = "autodrive-email-link";
const continuationKey = "autodrive-verified-plate";
const lifetime = 60 * 60 * 1000;

export function normalizePlate(plate: string) {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function readEmailDraft(id: string | null): EmailDraft | undefined {
  if (!id) return;
  try {
    const draft = JSON.parse(localStorage.getItem(pendingKey) || "null") as EmailDraft | null;
    if (draft && draft.expires <= Date.now()) localStorage.removeItem(pendingKey);
    else if (draft?.id === id) return draft;
  } catch { /* Email confirmation still works without local storage. */ }
}

export async function requestEmailLink(email: string, plateDraft?: PlateDraft) {
  const draft: EmailDraft = { id: crypto.randomUUID(), email: email.trim().toLowerCase(), expires: Date.now() + lifetime, plateDraft };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) || draft.email.length > 254) throw new Error("Enter a valid email address.");
  const callback = new URL("/renew/from-plate", window.location.origin);
  callback.searchParams.set("draft", draft.id);
  try { localStorage.setItem(pendingKey, JSON.stringify(draft)); } catch { /* The callback can ask for the email again. */ }
  try {
    await sendSignInLinkToEmail(client().auth, draft.email, { url: callback.href, handleCodeInApp: true });
  } catch (error) {
    clearEmailDraft(draft.id);
    throw error;
  }
}

export function clearEmailDraft(id: string | null) {
  try { if (readEmailDraft(id)) localStorage.removeItem(pendingKey); } catch { /* Storage may be unavailable. */ }
}

export function rememberVerifiedPlate(uid: string, draft: PlateDraft) {
  try {
    sessionStorage.setItem(continuationKey, JSON.stringify({ uid, draft, expires: Date.now() + lifetime }));
    return true;
  } catch { return false; }
}

export function readVerifiedPlate(uid: string): PlateDraft | undefined {
  try {
    const value = JSON.parse(sessionStorage.getItem(continuationKey) || "null");
    if (value?.expires <= Date.now()) clearVerifiedPlate();
    else if (value?.uid === uid) return value.draft as PlateDraft;
  } catch { /* Regular onboarding is still available. */ }
}

export function clearVerifiedPlate() {
  try { sessionStorage.removeItem(continuationKey); } catch { /* Storage may be unavailable. */ }
}
