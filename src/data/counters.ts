export type VoteType = "like" | "dislike";

// Per-hero gear loadout: up to 3 ring slots and 3 equipment-set slots, keyed
// "1"|"2"|"3". Simplified vs. the original -- no secondary "overlay" ring
// stacked on a primary ring, and no per-hero skill-priority dots.
export type HeroGear = {
  rings: Record<string, string | null>;
  sets: Record<string, string | null>;
};

export type CounterEntry = {
  id: string;
  name: string;
  heroes: (string | null)[];
  pet: string | null;
  gear: Record<string, HeroGear>; // heroId -> gear
  note: string;
  status: "pending" | "published";
  submittedBy: string;
  submittedByName: string;
  createdAt: number;
  likes: number;
  dislikes: number;
  votes: Record<string, VoteType>; // userId -> vote, server-side bookkeeping
  // Idempotency guards for point-awarding (see src/server/ranking.ts) --
  // separate from `votes` because toggling a vote off and back on must not
  // re-trigger the one-time "voted on this counter" bonus.
  voteBonusGiven: string[]; // userIds already paid their +1 for voting here
  likeBonusGiven: string[]; // userIds already paid the submitter's +2 for liking
};

// Client-safe view: strips server-only bookkeeping (the full votes map,
// bonus-idempotency guards) down to just this viewer's own vote.
export type CounterEntryView = Omit<CounterEntry, "votes" | "voteBonusGiven" | "likeBonusGiven"> & {
  myVote: VoteType | null;
};

export function toView(entry: CounterEntry, userId: string): CounterEntryView {
  const { votes, voteBonusGiven, likeBonusGiven, ...rest } = entry;
  return { ...rest, myVote: votes[userId] ?? null };
}
