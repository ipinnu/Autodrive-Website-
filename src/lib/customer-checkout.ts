import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { client, track } from "./customer";
export type Selection = { carId: string; documentId: string };
export type Quote = { quoteToken: string; txRef: string; amount: number; logisticsFeeNGN: number;
  earliestDeliveryDate: string; selectedDocuments: Array<Selection & { car: string; customerPriceNGN: number }>;
  requiredUploads: Array<{ carId: string; carName: string; evidenceType: string; label: string }> };
export type Address = { addressId?: string; addressLine: string; city: string; state: string; postcode: string; formatted: string; latitude?: number; longitude?: number; isPrimary?: boolean };
export const money = (v: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(v);
export async function customerApi<T>(path: string, body: unknown): Promise<T> {
  const user = client().auth.currentUser;
  if (!user) throw new Error("Please sign in.");
  const token = await user.getIdToken();
  const response = await fetch(`/api/customer/${path}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Your request could not be completed.");
  return result;
}
export async function savedAddresses(): Promise<Address[]> {
  const { auth, db } = client();
  if (!auth.currentUser) return [];
  const snapshot = await getDocs(collection(db, "UserInfo", auth.currentUser.uid, "addresses"));
  return snapshot.docs.map((d) => ({ ...d.data(), addressId: d.id } as Address));
}
export async function searchAddresses(q: string): Promise<Address[]> {
  const token = await client().auth.currentUser?.getIdToken();
  const response = await fetch(`/api/addresses/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
  const results = await response.json();
  if (!response.ok) throw new Error(results.message || "Address search failed.");
  return (results as Array<Record<string, unknown>>).map((r) => {
    const address = r.address as Record<string, string> || {};
    const street = `${address.house_number || ""} ${address.road || address.pedestrian || address.residential || address.neighbourhood || ""}`.trim();
    return { addressLine: street || String(r.name || ""), city: address.city || address.town || address.village || address.municipality || address.county || "",
      state: address.state || "", postcode: address.postcode || "", formatted: String(r.display_name || ""), latitude: Number(r.lat), longitude: Number(r.lon) };
  });
}
export async function saveAddress(address: Address): Promise<Address> {
  const { auth, db } = client();
  if (!auth.currentUser) throw new Error("Please sign in.");
  if (!address.addressLine.trim() || !address.city.trim() || !address.state.trim()) throw new Error("Add the street, city and state for delivery.");
  const existing = await savedAddresses();
  const ref = address.addressId ? doc(db, "UserInfo", auth.currentUser.uid, "addresses", address.addressId) : doc(collection(db, "UserInfo", auth.currentUser.uid, "addresses"));
  const batch = writeBatch(db);
  existing.forEach((a) => batch.set(doc(db, "UserInfo", auth.currentUser!.uid, "addresses", a.addressId!), { isPrimary: false }, { merge: true }));
  const formatted = [address.addressLine, address.city, address.state, address.postcode].filter(Boolean).join(", ");
  const value = { ...address, addressId: ref.id, formatted, isPrimary: true };
  batch.set(ref, { ...value, updatedAt: serverTimestamp(), ...(!address.addressId ? { createdAt: serverTimestamp() } : {}) }, { merge: true });
  await batch.commit(); void track("cta_tapped", { screenName: "checkout_address_confirmation", ctaLabel: "Save and use address" });
  return value;
}
export async function uploadEvidence(file: File, quote: Quote, carId: string, evidenceType: string): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024 || !file.size) throw new Error("Upload a JPEG, PNG or WebP image smaller than 8 MB.");
  const token = await client().auth.currentUser?.getIdToken();
  const backend = process.env.NEXT_PUBLIC_DELIVERY_API_BASE_URL || "https://autodrive-delivery-api.autodrive-ng-f0f.workers.dev";
  const response = await fetch(`${backend}/v1/uploads/poc`, { method: "POST", body: file,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": file.type, "X-Upload-Tx-Ref": quote.txRef, "X-Car-Id": carId, "X-Evidence-Type": evidenceType }, signal: AbortSignal.timeout(45000) });
  const result = await response.json(); if (!response.ok) throw new Error(result.message || "Document upload failed.");
  return result.objectKey;
}
