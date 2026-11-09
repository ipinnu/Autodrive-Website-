import { NextRequest, NextResponse } from "next/server";
import { photonAddresses } from "@/lib/photon-address";
export const maxDuration = 30;
export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization") || "";
  if (!/^Bearer \S+$/.test(token)) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 3 || q.length > 180) return NextResponse.json({ message: "Enter a more specific delivery address." }, { status: 400 });
  try {
    // Validate the existing Firebase token at the same authenticated Worker before provider access.
    const backend = process.env.DELIVERY_API_BASE_URL || "https://autodrive-delivery-api.autodrive-ng-f0f.workers.dev";
    const guard = await fetch(`${backend.replace(/\/$/, "")}/v1/web/customer-session`, { headers: { Authorization: token }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
    if (!guard.ok) return NextResponse.json({ message: "Please sign in with a verified customer account." }, { status: guard.status });
    const url = new URL(process.env.ADDRESS_SEARCH_BASE_URL || "https://photon.komoot.io/api/");
    for (const [key, value] of Object.entries({ q, countrycode: "NG", limit: "8", lang: "en" })) url.searchParams.set(key, value);
    const response = await fetch(url, { headers: { "User-Agent": "AutoDrive/1.0 (https://www.autodrive.com.ng)", Accept: "application/json" }, cache: "no-store", redirect: "error", signal: AbortSignal.any([request.signal, AbortSignal.timeout(12000)]) });
    if (response.status === 429) return NextResponse.json({ message: "Address search is busy. Wait a moment and try again, or enter your address manually." }, { status: 429 });
    if (!response.ok) throw new Error();
    const results = photonAddresses(await response.json());
    return NextResponse.json(results, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ message: "Address search is temporarily unavailable. Please try again." }, { status: 503 }); }
}
