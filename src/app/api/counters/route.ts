import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/server/mockKv";
import { toView, type CounterEntry } from "@/data/counters";

function key(guild: string, comp: string) {
  return `counters:${guild}:${comp}`;
}

// NOTE: simplified vs. the original's baseline-diff/replay merge model —
// this is a straightforward "append one counter" endpoint. Fine for a
// single-admin local dev/test workflow; a real concurrent-edit merge
// strategy is deferred (see Phase 6 notes).
export async function GET(request: NextRequest) {
  const guild = request.nextUrl.searchParams.get("guild");
  const comp = request.nextUrl.searchParams.get("comp");
  const userId = request.nextUrl.searchParams.get("userId") || "";
  if (!guild || !comp) return NextResponse.json({ error: "missing guild/comp" }, { status: 400 });

  const entries = kvGet<CounterEntry[]>(key(guild, comp)) ?? [];
  return NextResponse.json({ counters: entries.map((e) => toView(e, userId)) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { guild, comp, counter, userId, userName, isAdmin } = body as {
    guild: string;
    comp: string;
    counter: { name: string; heroes: (string | null)[]; pet: string | null; note: string };
    userId: string;
    userName: string;
    isAdmin: boolean;
  };
  if (!guild || !comp || !counter) {
    return NextResponse.json({ error: "missing guild/comp/counter" }, { status: 400 });
  }

  const entries = kvGet<CounterEntry[]>(key(guild, comp)) ?? [];
  const entry: CounterEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: counter.name || "ทีมตอบโต้",
    heroes: counter.heroes,
    pet: counter.pet,
    note: counter.note || "",
    status: isAdmin ? "published" : "pending",
    submittedBy: userId,
    submittedByName: userName,
    createdAt: Date.now(),
    likes: 0,
    dislikes: 0,
    votes: {},
  };
  entries.push(entry);
  kvSet(key(guild, comp), entries);
  return NextResponse.json({ counters: entries.map((e) => toView(e, userId)) });
}
