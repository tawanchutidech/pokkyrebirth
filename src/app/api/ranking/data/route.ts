import { NextRequest, NextResponse } from "next/server";
import { kvGet } from "@/server/mockKv";
import type { RankingUser } from "@/data/ranking";

// The original's point-awarding logic (functions/ranking/data.js) lives
// server-side and isn't part of this mirror, so there's no real scoring
// system feeding this yet -- the leaderboard itself stays empty (genuine
// "nobody has scored" state). The requesting user's own selected mascot
// character is merged in from local storage so the mascot widget/ranking
// page can reflect it, since that part doesn't depend on real scoring.
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const list = kvGet<RankingUser[]>("ranking:list") ?? [];

  if (userId) {
    const selectedCharacter = kvGet<string>(`ranking:selectedCharacter:${userId}`) ?? null;
    if (selectedCharacter && !list.some((u) => u.userId === userId)) {
      list.push({
        userId,
        displayName: "",
        tier: 9,
        points: 0,
        guild: null,
        isOwner: false,
        selectedCharacter,
      });
    }
  }

  return NextResponse.json(list);
}
