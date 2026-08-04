import { NextRequest, NextResponse } from "next/server";
import { kvSet } from "@/server/mockKv";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { character, userId } = body as { character: string | null; userId: string };
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  kvSet(`ranking:selectedCharacter:${userId}`, character);
  return NextResponse.json({ character });
}
