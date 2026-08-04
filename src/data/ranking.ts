import type { Guild } from "@/lib/auth";

export const TIER_NAMES: Record<number, string> = {
  1: "แชมเปี้ยน", 2: "เลเจนด์", 3: "ชาเลนเจอร์", 4: "มาสเตอร์", 5: "ไดมอนด์",
  6: "แพลตินัม", 7: "โกลด์", 8: "ซิลเวอร์", 9: "บรอนซ์",
};

export const TIER_FRAME: Record<number, { color: string; glow: string }> = {
  9: { color: "#a56a3a", glow: "rgba(165,106,58,0.35)" },
  8: { color: "#94a3b8", glow: "rgba(148,163,184,0.35)" },
  7: { color: "#d4af37", glow: "rgba(212,175,55,0.35)" },
  6: { color: "#2dd4bf", glow: "rgba(45,212,191,0.35)" },
  5: { color: "#38bdf8", glow: "rgba(56,189,248,0.35)" },
  4: { color: "#a855f7", glow: "rgba(168,85,247,0.35)" },
  3: { color: "#f43f5e", glow: "rgba(244,63,94,0.35)" },
  2: { color: "#fb923c", glow: "rgba(251,146,60,0.35)" },
  1: { color: "#fbbf24", glow: "rgba(251,191,36,0.4)" },
};

const RANK_THRESHOLDS = [
  { tier: 1, points: 3600 }, { tier: 2, points: 2050 }, { tier: 3, points: 1500 },
  { tier: 4, points: 1000 }, { tier: 5, points: 700 }, { tier: 6, points: 450 },
  { tier: 7, points: 250 }, { tier: 8, points: 100 }, { tier: 9, points: 0 },
];

export function computeProgress(points: number, tier: number) {
  if (tier <= 1) return null; // already maxed out
  const current = RANK_THRESHOLDS.find((t) => t.tier === tier)!;
  const next = RANK_THRESHOLDS.find((t) => t.tier === tier - 1)!;
  const span = next.points - current.points;
  const into = Math.max(0, points - current.points);
  const pct = Math.min(100, Math.round((into / span) * 100));
  return { pct, remaining: Math.max(0, next.points - points), nextTier: next.tier };
}

export const GUILD_BADGE_CLASS: Partial<Record<Guild, string>> = {
  LEGENDS: "badge-guild-legends",
  หนิกเสือ: "badge-guild-nik-suea",
  เสือหนิก: "badge-guild-suea-nik",
};

export type RankingUser = {
  userId: string;
  displayName: string;
  tier: number;
  points: number;
  guild: Guild | null;
  isOwner: boolean;
  selectedCharacter: string | null;
};

export type RankingLogEntry = { delta: number; reason: string; at: number };

// Character art dropped into public/ranking-collection/ — cumulative:
// reaching a tier keeps every lower tier's unlock and adds this tier's
// character(s). Tier 8 has no dedicated art, so it carries tier 9's roster
// forward unchanged.
export const TIER_COLLECTION: Record<number, string[]> = {
  9: ["evan", "karin"],
  8: [],
  7: ["yuri"],
  6: ["ryan"],
  5: ["velika"],
  4: ["spike", "jave"],
  3: ["eileene", "rachel"],
  2: ["kris"],
  1: ["dellons", "rudy"],
};

export function unlockedCharacters(tier: number): string[] {
  const names: string[] = [];
  for (let t = 9; t >= tier; t--) names.push(...TIER_COLLECTION[t]);
  return names;
}

// evan is unlocked from tier 9 (everyone has it), so this never shows a
// character the viewer hasn't actually earned.
export const DEFAULT_CHARACTER = "evan";

export const ANNOUNCEMENT_URL =
  "https://docs.google.com/document/d/1ya16_qESCE7ll3b7kxtYlmGlJfgyL7NMqWVbpZC8rSI/edit?usp=sharing";
export const ANNOUNCEMENT_SEEN_KEY = "announcement_seen_v1";
