import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/server/mockKv";
import type { CounterEntry, VoteType } from "@/data/counters";

function key(guild: string, comp: string) {
  return `counters:${guild}:${comp}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { guild, comp, counterId, voteType, userId } = body as {
    guild: string;
    comp: string;
    counterId: string;
    voteType: VoteType;
    userId: string;
  };
  if (!guild || !comp || !counterId || !userId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const entries = kvGet<CounterEntry[]>(key(guild, comp)) ?? [];
  const entry = entries.find((e) => e.id === counterId);
  if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });

  const prevVote = entry.votes[userId];
  // Clicking the same vote again clears it (toggle off).
  const nextVote: VoteType | null = prevVote === voteType ? null : voteType;

  if (prevVote === "like") entry.likes--;
  if (prevVote === "dislike") entry.dislikes--;
  if (nextVote === "like") entry.likes++;
  if (nextVote === "dislike") entry.dislikes++;

  if (nextVote) entry.votes[userId] = nextVote;
  else delete entry.votes[userId];

  kvSet(key(guild, comp), entries);
  return NextResponse.json({ likes: entry.likes, dislikes: entry.dislikes, myVote: nextVote });
}
