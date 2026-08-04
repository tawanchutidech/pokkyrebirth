import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/server/mockKv";

function key(guild: string) {
  return `castle-hidden:${guild}`;
}

export async function GET(request: NextRequest) {
  const guild = request.nextUrl.searchParams.get("guild");
  if (!guild) return NextResponse.json({ error: "missing guild" }, { status: 400 });
  return NextResponse.json(kvGet<string[]>(key(guild)) ?? []);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { guild, hiddenCastles } = body as { guild: string; hiddenCastles: string[] };
  if (!guild || !Array.isArray(hiddenCastles)) {
    return NextResponse.json({ error: "missing guild/hiddenCastles" }, { status: 400 });
  }
  kvSet(key(guild), hiddenCastles);
  return NextResponse.json({ ok: true });
}
