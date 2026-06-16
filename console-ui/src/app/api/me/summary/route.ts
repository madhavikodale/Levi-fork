import { NextRequest, NextResponse } from "next/server";

const DEFAULT_COORD = process.env.NEXT_PUBLIC_COORDINATOR_URL || "https://api.darkbloom.dev";

export async function GET(req: NextRequest) {
  const coordUrl = DEFAULT_COORD;

  let authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    const privyToken = req.cookies.get("privy-token")?.value;
    if (privyToken) {
      authHeader = `Bearer ${privyToken}`;
    }
  }
  // Dev mode: accept dev key from x-api-key header
  if (!authHeader) {
    const devKey = req.headers.get("x-api-key");
    if (devKey?.startsWith("dev-key-local-")) {
      authHeader = `Bearer ${devKey}`;
    }
  }
  if (!authHeader) {
    return NextResponse.json({ error: "missing privy token" }, { status: 401 });
  }

  const res = await fetch(`${coordUrl}/v1/me/summary`, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text || `Upstream ${res.status}` }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}
