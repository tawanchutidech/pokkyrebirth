import { NextRequest, NextResponse } from "next/server";
import { getRankingRecord } from "@/server/ranking";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json([]);
  const record = getRankingRecord(userId);
  return NextResponse.json(record?.log ?? []);
}
