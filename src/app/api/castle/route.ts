import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/server/mockKv";
import type { CastleData } from "@/data/castles";

type StoredCastle = { castles: CastleData; updatedAt: number };

function key(guild: string) {
  return `castle:${guild}`;
}

export async function GET(request: NextRequest) {
  const guild = request.nextUrl.searchParams.get("guild");
  if (!guild) return NextResponse.json({ error: "missing guild" }, { status: 400 });

  const stored = kvGet<StoredCastle>(key(guild));
  if (!stored) return NextResponse.json({ castles: {}, updatedAt: null });
  return NextResponse.json(stored);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { guild, castles, baseUpdatedAt } = body as {
    guild: string;
    castles: CastleData;
    baseUpdatedAt: number | null;
  };
  if (!guild || !castles) {
    return NextResponse.json({ error: "missing guild/castles" }, { status: 400 });
  }

  const existing = kvGet<StoredCastle>(key(guild));
  // Optimistic-lock: refuse to overwrite if someone else saved since this
  // client last loaded (baseUpdatedAt won't match the current updatedAt).
  if (existing && existing.updatedAt !== baseUpdatedAt) {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  const updatedAt = Date.now();
  kvSet(key(guild), { castles, updatedAt });
  return NextResponse.json({ updatedAt });
}
