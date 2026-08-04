import { NextResponse } from "next/server";
import { kvGet, kvSet } from "@/server/mockKv";

export async function GET() {
  return NextResponse.json({ updatedAt: kvGet<number>("announcement:updatedAt") ?? null });
}

export async function POST() {
  const updatedAt = Date.now();
  kvSet("announcement:updatedAt", updatedAt);
  return NextResponse.json({ updatedAt });
}
