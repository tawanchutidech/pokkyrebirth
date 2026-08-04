import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/server/mockKv";
import { toView, type CounterEntry } from "@/data/counters";
import { awardPoints } from "@/server/ranking";

function key(guild: string, comp: string) {
  return `counters:${guild}:${comp}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { guild, comp, counterId, userId } = body as {
    guild: string;
    comp: string;
    counterId: string;
    userId: string;
  };
  if (!guild || !comp || !counterId) {
    return NextResponse.json({ error: "missing guild/comp/counterId" }, { status: 400 });
  }

  const entries = kvGet<CounterEntry[]>(key(guild, comp)) ?? [];
  const entry = entries.find((e) => e.id === counterId);
  if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });

  const wasPending = entry.status === "pending";
  entry.status = "published";
  kvSet(key(guild, comp), entries);

  if (wasPending) {
    awardPoints(entry.submittedBy, entry.submittedByName, 10, `ทีมตอบโต้ "${entry.name}" ได้รับอนุมัติ`);
  }

  return NextResponse.json({ counters: entries.map((e) => toView(e, userId)) });
}
