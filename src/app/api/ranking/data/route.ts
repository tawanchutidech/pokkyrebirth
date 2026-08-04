import { NextResponse } from "next/server";
import { kvGet } from "@/server/mockKv";
import type { RankingUser } from "@/data/ranking";

// The original's point-awarding logic (functions/ranking/data.js) lives
// server-side and isn't part of this mirror, so there's no real scoring
// system feeding this yet -- returns an empty leaderboard (genuine "nobody
// has scored" state) until that's wired up in a later phase.
export async function GET() {
  const list = kvGet<RankingUser[]>("ranking:list") ?? [];
  return NextResponse.json(list);
}
