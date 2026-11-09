import { NextRequest, NextResponse } from "next/server";
import { readBoundedBody } from "@/lib/bounded-request";
export const maxDuration = 60;
const paths: Record<string, string> = { "checkout/quote": "/v1/web/checkout/quote", "checkout/start": "/v1/web/checkout/start",
  "whatsapp/claim": "/v1/web/whatsapp/claim", "documents/access": "/v1/documents/access", "delivery/actions": "/v1/delivery/actions" };
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const key = (await params).path.join("/");
  const path = Object.prototype.hasOwnProperty.call(paths, key) ? paths[key] : undefined;
  if (!path) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const token = request.headers.get("authorization") || "";
  if (!/^Bearer \S+$/.test(token)) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  try {
    const body = await readBoundedBody(request, 150000);
    if (body === null) return NextResponse.json({ message: "Request is too large." }, { status: 413 });
    const backend = process.env.DELIVERY_API_BASE_URL || "https://autodrive-delivery-api.autodrive-ng-f0f.workers.dev";
    const response = await fetch(backend.replace(/\/$/, "") + path, { method: "POST", cache: "no-store", redirect: "error",
      headers: { Authorization: token, "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(55000) });
    return new NextResponse(response.body, { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "The service could not be reached. Please check your renewal status before retrying a payment." }, { status: 503 }); }
}
