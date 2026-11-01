import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization") || "";
  if (!/^Bearer \S+$/.test(token)) return NextResponse.json({ message: "Sign in before looking up your vehicle." }, { status: 401 });
  try {
    const { plateNumber } = await request.json();
    if (typeof plateNumber !== "string" || plateNumber.length > 24) return NextResponse.json({ message: "Enter a valid plate number." }, { status: 400 });
    const backend = process.env.DELIVERY_API_BASE_URL || "https://autodrive-delivery-api.autodrive-ng-f0f.workers.dev";
    const response = await fetch(`${backend.replace(/\/$/, "")}/v1/vehicles/lookup`, { method: "POST", cache: "no-store",
      headers: { "Authorization": token, "Content-Type": "application/json" }, body: JSON.stringify({ plateNumber }), signal: AbortSignal.timeout(30000) });
    return new NextResponse(response.body, { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "Vehicle lookup is temporarily unavailable. You can enter your vehicle manually." }, { status: 503 }); }
}
