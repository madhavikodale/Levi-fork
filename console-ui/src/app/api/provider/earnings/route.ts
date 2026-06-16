import { NextRequest, NextResponse } from "next/server";

const DEFAULT_COORD = process.env.NEXT_PUBLIC_COORDINATOR_URL || "https://api.darkbloom.dev";

export async function GET(req: NextRequest) {
  const coordUrl = DEFAULT_COORD;
  const limit = req.nextUrl.searchParams.get("limit") || "100";

  let authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey?.startsWith("dev-key-local-")) {
      authHeader = `Bearer ${apiKey}`;
    }
  }
  if (!authHeader) {
    return NextResponse.json({ error: "missing credentials" }, { status: 401 });
  }

  const res = await fetch(`${coordUrl}/v1/provider/account-earnings?limit=${limit}`, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text || `Upstream ${res.status}` }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}
