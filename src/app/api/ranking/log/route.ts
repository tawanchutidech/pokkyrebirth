import { NextResponse } from "next/server";
import type { RankingLogEntry } from "@/data/ranking";

// Same scope note as /api/ranking/data — no real point-awarding system
// wired up yet, so every viewer's log is empty for now.
export async function GET() {
  const log: RankingLogEntry[] = [];
  return NextResponse.json(log);
}
