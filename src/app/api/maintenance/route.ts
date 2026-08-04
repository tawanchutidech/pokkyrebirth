import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/server/mockKv";

export async function GET() {
  return NextResponse.json({ enabled: kvGet<boolean>("maintenance:enabled") ?? false });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { enabled } = body as { enabled: boolean };
  kvSet("maintenance:enabled", enabled);
  return NextResponse.json({ enabled });
}
