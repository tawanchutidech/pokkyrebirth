import { kvGet, kvSet } from "@/server/mockKv";
import type { RankingLogEntry } from "@/data/ranking";

export type RankingRecord = {
  userId: string;
  displayName: string;
  points: number;
  log: RankingLogEntry[];
};

function key(userId: string) {
  return `ranking:user:${userId}`;
}

// Point sources, matching the original's documented rules (ranking.html's
// hint text) — reconstructed here since we don't have the real
// functions/ranking/*.js source, not ported from it:
//   +10  a submitted counter team gets approved
//   +1   voting on a given counter team, first time only (per counter, not
//        a one-time account bonus — re-voting on OTHER counters still pays)
//   +2   per unique person who 👍-likes a counter team you submitted
export function awardPoints(userId: string, displayName: string, delta: number, reason: string) {
  const record = kvGet<RankingRecord>(key(userId)) ?? { userId, displayName, points: 0, log: [] };
  record.displayName = displayName || record.displayName;
  record.points += delta;
  record.log.unshift({ delta, reason, at: Date.now() });
  record.log = record.log.slice(0, 100); // server-capped, matches original's ranking/log
  kvSet(key(userId), record);
}

export function getRankingRecord(userId: string): RankingRecord | undefined {
  return kvGet<RankingRecord>(key(userId));
}
