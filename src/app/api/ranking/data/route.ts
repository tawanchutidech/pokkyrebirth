import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { kvGet } from "@/server/mockKv";
import { pointsToTier, type RankingUser } from "@/data/ranking";
import type { RankingRecord } from "@/server/ranking";

const STORE_PATH = path.join(process.cwd(), ".data", "mock-kv.json");

// The owner is whoever's session has isAdminById -- since real Discord auth
// isn't wired up yet (Phase 6), the only identity that can ever earn points
// right now is the local-dev bypass user, which always has isAdminById.
const OWNER_USER_ID = "local-dev";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  let store: Record<string, unknown> = {};
  try {
    store = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  } catch {
    /* no store yet */
  }

  const list: RankingUser[] = Object.entries(store)
    .filter(([k]) => k.startsWith("ranking:user:"))
    .map(([, v]) => {
      const rec = v as RankingRecord;
      const selectedCharacter = kvGet<string>(`ranking:selectedCharacter:${rec.userId}`) ?? null;
      return {
        userId: rec.userId,
        displayName: rec.displayName,
        tier: pointsToTier(rec.points),
        points: rec.points,
        guild: null,
        isOwner: rec.userId === OWNER_USER_ID,
        selectedCharacter,
      };
    })
    .sort((a, b) => b.points - a.points);

  // The requesting user may have picked a mascot character without ever
  // having earned points yet -- merge them in so the mascot/side-char still
  // reflects the pick even though they're not "on the board".
  if (userId && !list.some((u) => u.userId === userId)) {
    const selectedCharacter = kvGet<string>(`ranking:selectedCharacter:${userId}`) ?? null;
    if (selectedCharacter) {
      list.push({
        userId,
        displayName: "",
        tier: 9,
        points: 0,
        guild: null,
        isOwner: userId === OWNER_USER_ID,
        selectedCharacter,
      });
    }
  }

  return NextResponse.json(list);
}
