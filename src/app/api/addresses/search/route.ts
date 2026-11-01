import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization") || "";
  if (!/^Bearer \S+$/.test(token)) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 3 || q.length > 180) return NextResponse.json({ message: "Enter a more specific delivery address." }, { status: 400 });
  try {
    // Validate the existing Firebase token at the same authenticated Worker before provider access.
    const backend = process.env.DELIVERY_API_BASE_URL || "https://autodrive-delivery-api.autodrive-ng-f0f.workers.dev";
    const guard = await fetch(`${backend}/v1/web/customer-session`, { headers: { Authorization: token }, cache: "no-store" });
    if (!guard.ok) return NextResponse.json({ message: "Please sign in with a verified customer account." }, { status: guard.status });
    const url = new URL("https://nominatim.openstreetmap.org/search");
    for (const [key, value] of Object.entries({ q, format: "jsonv2", addressdetails: "1", countrycodes: "ng", limit: "8", "accept-language": "en" })) url.searchParams.set(key, value);
    const response = await fetch(url, { headers: { "User-Agent": "AutoDrive/1.0 (https://www.autodrive.com.ng)", Accept: "application/json" }, next: { revalidate: 1800 }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error();
    return NextResponse.json(await response.json(), { headers: { "Cache-Control": "private, max-age=1800" } });
  } catch { return NextResponse.json({ message: "Address search is temporarily unavailable. Please try again." }, { status: 503 }); }
}
