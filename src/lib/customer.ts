import { addDoc, collection, doc, getDoc, getDocs, increment, runTransaction, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { getFirebaseClient } from "./firebase";

export type AccountType = "personal" | "organization";
export type BuyerProfile = { uid: string; firstName: string; lastName: string; fullName: string; email: string;
  phone: string; phoneNumber: string; role: string; agentId: string; buyerOnboardingCompleted: boolean; accountType?: AccountType };
export type VehicleDocument = { type: string; expiryDate: string };
export type LookupResult = { plateNumber: string; make: string; model: string; appVehicleType: "Jeep" | "Salon"; documents: VehicleDocument[] };
export type Vehicle = { carId: string; name: string; make: string; model: string; year: number; type: string;
  registration?: { plateNumber?: string; state?: string }; documents: Array<{ id: string; expiration: string; type: string }> };
export const DOCUMENTS = ["Vehicle License", "Road Worthiness", "Vehicle Insurance", "Drivers License"];
export const BRANDS = [
  ["Toyota", "toyota.png"], ["Lexus", "lexus.png"], ["Mercedes-Benz", "mercedes.png"], ["Honda", "honda.png"],
  ["Hyundai", "hyundai.png"], ["Kia", "kia.png"], ["Nissan", "nissan.png"], ["Ford", "ford.png"],
  ["Volkswagen", "volkswagen.png"], ["Peugeot", "peugeot.svg"], ["Range Rover", "range_rover.svg"],
  ["GAC Motor", "gac.png"], ["Changan", "changan.svg"], ["Geely", "geely.svg"], ["Jetour", "jetour.svg"],
  ["BYD", "byd.svg"], ["JAC", "jac.svg"], ["MG", "mg.svg"], ["BMW", "bmw.png"], ["Audi", "audi.png"],
  ["Mazda", "mazda.png"], ["Volvo", "volvo.png"],
];
export const STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];

export function client() {
  const value = getFirebaseClient();
  if (!value) throw new Error("Account services are temporarily unavailable. Please try again shortly.");
  return value;
}

let sessionId: string | undefined;
export async function track(event: string, properties: Record<string, unknown> = {}) {
  const configured = getFirebaseClient();
  const user = configured?.auth.currentUser;
  if (!user || !configured) return;
  sessionId ??= crypto.randomUUID();
  try {
    await addDoc(collection(configured.db, "analytics_events"), { userId: user.uid, sessionId, event, properties,
      platform: "web", appVersion: "1.0.0", ts: serverTimestamp() });
    await setDoc(doc(configured.db, "analytics_sessions", sessionId), { userId: user.uid, platform: "web",
      lastActiveTs: serverTimestamp(), eventCount: increment(1) }, { merge: true });
    await setDoc(doc(configured.db, "user_metrics", user.uid), { lastSeenTs: serverTimestamp(),
      ...(event === "renewal_payment_success" ? { totalRenewalsCompleted: increment(1), totalSpendNGN: increment(Number(properties.amountNGN || 0)), lastRenewalTs: serverTimestamp() } : {}),
      ...(event === "car_added" ? { carsAdded: increment(1), documentsTracked: increment(Number(properties.documentsTracked || 0)) } : {}) }, { merge: true });
  } catch { /* Analytics must not block account creation or vehicle saves. */ }
}

export function errorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || "";
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "An account already uses this email. Please sign in instead.",
    "auth/invalid-credential": "The email or password is incorrect.", "auth/invalid-email": "Enter a valid email address.",
    "auth/popup-closed-by-user": "Google sign-in was closed. Please try again.",
    "auth/popup-blocked": "Your browser blocked Google sign-in. Allow the popup and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a little before trying again.",
    "auth/unauthorized-domain": "Google sign-in is not configured for this website yet. Please use email and password.",
    "permission-denied": "Your account could not access this information. Please sign in again.",
  };
  return messages[code] || (error instanceof Error ? error.message : "Something went wrong. Please try again.");
}

export function validateDetails(fullName: string, phone: string | undefined, password?: string, confirm?: string) {
  if (fullName.trim().length < 2) throw new Error("Enter your full name.");
  if (phone !== undefined) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) throw new Error("Enter a valid phone number.");
  }
  if (password !== undefined && (password.length < 8 || !/[0-9]/.test(password) || !/[^A-Za-z0-9\s]/.test(password))) {
    throw new Error("Use at least 8 characters, one number and one special character.");
  }
  if (password !== undefined && password !== confirm) throw new Error("Passwords do not match.");
}

export async function saveContact(fullName: string, phone: string) {
  const { auth, db } = client();
  if (!auth.currentUser) throw new Error("Sign in first.");
  validateDetails(fullName, phone.trim() || undefined);
  const names = fullName.trim().split(/\s+/);
  await setDoc(doc(db, "users", auth.currentUser.uid), {
    fullName: fullName.trim(), firstName: names[0], lastName: names.slice(1).join(" "),
    phone: phone.trim(), phoneNumber: phone.trim(), lastUpdated: serverTimestamp(),
  }, { merge: true });
  void track("cta_tapped", { screenName: "web_fleet", ctaLabel: "Save account contact" });
}

export async function registrationAgent(referral: string): Promise<string> {
  const { db } = client();
  if (referral.trim()) {
    const agent = await getDoc(doc(db, "Agents", referral.trim()));
    if (!agent.exists() || agent.data().isverified !== true) throw new Error("Invalid or unverified agent code.");
    return agent.id;
  }
  try {
    const routing = await getDoc(doc(db, "management", "agentRouting"));
    const configured = String(routing.data()?.defaultAgentId || "").trim();
    if (configured) return configured;
  } catch { /* Same default fallback as AgentRoutingService in the app. */ }
  return "SKY2zKmGw1R7CuB6ND2c9XZtD4E2";
}

export function registrationData(input: { uid: string; fullName: string; email: string; phone?: string; agentId: string; accountType: AccountType }) {
  const names = input.fullName.trim().split(/\s+/);
  return { firstName: names[0], lastName: names.slice(1).join(" "), fullName: input.fullName.trim(),
    email: input.email.trim(), ...(input.phone !== undefined ? { phone: input.phone.trim(), phoneNumber: input.phone.trim() } : {}), uid: input.uid,
    agentId: input.agentId, role: "buyer", accountType: input.accountType, buyerOnboardingCompleted: false,
    createdAt: serverTimestamp() };
}

export async function lookupVehicle(plateNumber: string): Promise<LookupResult> {
  const { auth } = client();
  if (!auth.currentUser?.emailVerified) throw new Error("Verify your email before looking up a vehicle.");
  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/vehicles/lookup", { method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ plateNumber }), signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Vehicle lookup is unavailable. You can enter the details manually.");
  return result.vehicle;
}

export function scheduleId(path: string, kind: string) {
  const bytes = new TextEncoder().encode(path);
  const encoded = btoa(String.fromCharCode(...Array.from(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `reminder_${encoded}_${kind}`;
}

export async function saveVehicle(input: { make: string; model: string; year: number; type: string; plate: string; state: string;
  documents: string[]; expiries: Record<string, string>; lookup?: LookupResult | null; onboarding: boolean }) {
  const { auth, db } = client();
  const user = auth.currentUser;
  if (!user?.emailVerified) throw new Error("Verify your email before saving your vehicle.");
  if (!input.make.trim() || !input.model.trim() || input.year < 1950 || input.year > new Date().getFullYear() + 1 || !Number.isInteger(input.year)) throw new Error("Check your vehicle make, model and year.");
  if (!["Jeep", "Salon"].includes(input.type)) throw new Error("Select your vehicle type.");
  if (input.documents.length === 0) throw new Error("Choose at least one document to track.");
  const ref = doc(collection(db, "cars", user.uid, "carDetails"));
  const batch = writeBatch(db);
  const plate = input.plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const now = new Date();
  batch.set(ref, { carId: ref.id, userId: user.uid, name: `${input.make.trim()} ${input.model.trim()}`,
    make: input.make.trim(), model: input.model.trim(), year: input.year, type: input.type,
    lastUpdated: now, onboardingCreated: input.onboarding, isCustomBrand: !BRANDS.some(([make]) => make === input.make),
    registration: { plateNumber: plate || null, state: input.state || null,
      profileCompletedAt: plate && input.state ? now : null },
    ...(input.lookup ? { vehicleLookupConfirmed: true, vehicleLookupConfirmedAt: now } : {}),
  });
  for (const type of input.documents) {
    if (!DOCUMENTS.includes(type)) throw new Error("Unknown document type.");
    const documentRef = doc(ref, "documents", type);
    const expiration = input.expiries[type] || "Not Set";
    const parsed = expiration === "Not Set" ? null : new Date(`${expiration}T00:00:00Z`);
    if (parsed && (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== expiration)) throw new Error("Check the expiry date for " + type);
    batch.set(documentRef, { type, expiration, expirationDate: expiration, isExpiringSoon: false, isExpired: false,
      createdFromOnboarding: input.onboarding, ...(input.lookup?.documents.some((item) => item.type === type && item.expiryDate === expiration) ? { source: "vehicle_lookup" } : {}) });
    for (const kind of ["before", "after"]) batch.set(doc(db, "notification_history", scheduleId(documentRef.path, kind)), {
      scheduleType: "renewal_reminder", documentPath: documentRef.path, kind, scheduleState: "dirty", dueAt: 0,
    }, { merge: true });
  }
  if (input.onboarding) batch.update(doc(db, "users", user.uid), { buyerOnboardingCompleted: true, lastUpdated: now });
  await batch.commit();
  void track("car_added", { carType: input.type, make: input.make, model: input.model, year: input.year, documentsTracked: input.documents.length });
  return ref.id;
}

export async function loadVehicles(uid: string): Promise<Vehicle[]> {
  if (client().auth.currentUser?.uid !== uid) throw new Error("Sign in to view your vehicles.");
  const snapshot = await getDocs(collection(client().db, "cars", uid, "carDetails"));
  return Promise.all(snapshot.docs.map(async (car) => {
    const documents = await getDocs(collection(car.ref, "documents"));
    return { ...car.data(), carId: car.id, documents: documents.docs.map((d) => ({ id: d.id,
      type: String(d.data().type || d.id), expiration: normalizeExpiry(d.data().expiration ?? d.data().expirationDate) })) } as Vehicle;
  }));
}

export async function addVehicleDocument(carId: string, type: string, date: string) {
  const { auth, db } = client();
  const user = auth.currentUser;
  if (!user?.emailVerified) throw new Error("Sign in with a verified account first.");
  if (!DOCUMENTS.includes(type)) throw new Error("Choose a document type.");
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || normalizeExpiry(date) !== date)) {
    throw new Error("Enter a valid expiry date.");
  }
  const expiration = date || "Not Set";
  const carRef = doc(db, "cars", user.uid, "carDetails", carId);
  const ref = doc(carRef, "documents", type);
  await runTransaction(db, async (transaction) => {
    const car = await transaction.get(carRef);
    const existing = await transaction.get(ref);
    if (!car.exists()) throw new Error("This vehicle is no longer available.");
    if (existing.exists()) throw new Error("This document already exists. Edit its expiry date instead.");
    transaction.set(ref, { type, expiration, expirationDate: expiration, isExpiringSoon: false, isExpired: false });
    for (const kind of ["before", "after"]) {
      transaction.set(doc(db, "notification_history", scheduleId(ref.path, kind)), {
        scheduleType: "renewal_reminder", documentPath: ref.path, kind, scheduleState: "dirty", dueAt: 0,
      }, { merge: true });
    }
  });
  void track("cta_tapped", { screenName: "web_fleet", ctaLabel: "Add document", carId, documentType: type });
}

export async function saveExpiry(carId: string, documentId: string, expiration: string) {
  const { auth, db } = client();
  if (!auth.currentUser?.emailVerified) throw new Error("Sign in with a verified account first.");
  const value = expiration || "Not Set";
  if (value !== "Not Set" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(value + "T00:00:00Z").toISOString().slice(0, 10) !== value)) throw new Error("Enter a valid expiry date.");
  const ref = doc(db, "cars", auth.currentUser.uid, "carDetails", carId, "documents", documentId);
  const batch = writeBatch(db);
  batch.set(ref, { expiration: value, expirationDate: value }, { merge: true });
  for (const kind of ["before", "after"]) batch.set(doc(db, "notification_history", scheduleId(ref.path, kind)), {
    scheduleType: "renewal_reminder", documentPath: ref.path, kind, scheduleState: "dirty", dueAt: 0,
  }, { merge: true });
  await batch.commit();
  void track("cta_tapped", { screenName: "web_fleet", ctaLabel: "Save document expiry", carId, documentId });
}

export async function saveRegistration(carId: string, plateNumber: string, state: string) {
  const { auth, db } = client();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in first.");
  const plate = plateNumber.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (plate.length < 5 || plate.length > 12 || !STATES.includes(state)) throw new Error("Check your plate number and registration state.");
  await setDoc(doc(db, "cars", uid, "carDetails", carId), { registration: { plateNumber: plate, state,
    profileCompletedAt: serverTimestamp() }, lastUpdated: serverTimestamp() }, { merge: true });
  void track("cta_tapped", { screenName: "vehicle_registration", ctaLabel: "Save registration details", carId });
}

export async function skipOnboarding() {
  const { auth, db } = client();
  if (!auth.currentUser?.emailVerified) throw new Error("Verify your email first.");
  await setDoc(doc(db, "users", auth.currentUser.uid), { buyerOnboardingCompleted: true, lastUpdated: serverTimestamp() }, { merge: true });
  void track("empty_state_seen", { screenName: "buyer_dashboard", emptyStateType: "garage_skipped_onboarding" });
}

export function normalizeExpiry(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") value = value.toDate();
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? new Date(value.getTime() + 3600000).toISOString().slice(0, 10) : "Not Set";
  const text = String(value ?? "").trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  const numeric = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const words = text.match(/^([A-Za-z]{3}) (\d{1,2}), (\d{4})$/);
  const dayFirst = text.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/);
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  let parts: string[] | undefined;
  if (iso) parts = [iso[1], iso[2], iso[3]];
  else if (numeric) parts = [numeric[3], numeric[2], numeric[1]];
  else if (words) parts = [words[3], String(months.indexOf(words[1].toLowerCase()) + 1), words[2]];
  else if (dayFirst) parts = [dayFirst[3], String(months.indexOf(dayFirst[2].toLowerCase()) + 1), dayFirst[1]];
  if (!parts) return "Not Set";
  const normalized = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  const time = Date.parse(normalized + "T00:00:00Z");
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === normalized ? normalized : "Not Set";
}

export function expiryStatus(expiration: string): "expired" | "soon" | "active" | "missing" {
  const normalized = normalizeExpiry(expiration);
  if (normalized === "Not Set") return "missing";
  const date = Date.parse(normalized + "T00:00:00+01:00");
  if (!Number.isFinite(date)) return "missing";
  const day = Math.floor((Date.now() + 3600000) / 86400000) * 86400000 - 3600000;
  const days = Math.round((date - day) / 86400000);
  return days < 0 ? "expired" : days <= 30 ? "soon" : "active";
}
