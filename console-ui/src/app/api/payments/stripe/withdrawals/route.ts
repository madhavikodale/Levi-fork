import { NextRequest, NextResponse } from "next/server";

// Proxy for GET /v1/billing/stripe/withdrawals — recent payout history for
// the Billing page.

const DEFAULT_COORD = process.env.NEXT_PUBLIC_COORDINATOR_URL || "https://api.darkbloom.dev";

export async function GET(req: NextRequest) {
  const coordUrl = req.headers.get("x-coordinator-url") || DEFAULT_COORD;

  let authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    const privyToken = req.cookies.get("privy-token")?.value;
    if (privyToken) authHeader = `Bearer ${privyToken}`;
  }
  // Dev mode: accept dev key from x-api-key header
  if (!authHeader) {
    const devKey = req.headers.get("x-api-key");
    if (devKey?.startsWith("dev-key-local-")) {
      authHeader = `Bearer ${devKey}`;
    }
  }

  const url = new URL(req.url);
  const limit = url.searchParams.get("limit");
  const upstream = `${coordUrl}/v1/billing/stripe/withdrawals${limit ? `?limit=${limit}` : ""}`;

  const res = await fetch(upstream, {
    headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }
  return NextResponse.json(await res.json().catch(() => ({})));
}
