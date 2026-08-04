import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/server/mockKv";

type HotState = { hot: string[] };

function key(guild: string) {
  return `hero-tier-list:${guild}`;
}

export async function GET(request: NextRequest) {
  const guild = request.nextUrl.searchParams.get("guild");
  if (!guild) return NextResponse.json({ error: "missing guild" }, { status: 400 });

  const state = kvGet<HotState>(key(guild)) ?? { hot: [] };
  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { guild, heroId, hot } = body as { guild: string; heroId: string; hot: boolean };
  if (!guild || !heroId) {
    return NextResponse.json({ error: "missing guild/heroId" }, { status: 400 });
  }

  const state = kvGet<HotState>(key(guild)) ?? { hot: [] };
  const nextHot = hot
    ? Array.from(new Set([...state.hot, heroId]))
    : state.hot.filter((id) => id !== heroId);

  kvSet(key(guild), { hot: nextHot });
  return NextResponse.json({ hot: nextHot });
}
