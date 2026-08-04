export type VoteType = "like" | "dislike";

export type CounterEntry = {
  id: string;
  name: string;
  heroes: (string | null)[];
  pet: string | null;
  note: string;
  status: "pending" | "published";
  submittedBy: string;
  submittedByName: string;
  createdAt: number;
  likes: number;
  dislikes: number;
  votes: Record<string, VoteType>; // userId -> vote, server-side bookkeeping
};

// Client-safe view: strips the full votes map down to just this viewer's own vote.
export type CounterEntryView = Omit<CounterEntry, "votes"> & { myVote: VoteType | null };

export function toView(entry: CounterEntry, userId: string): CounterEntryView {
  const { votes, ...rest } = entry;
  return { ...rest, myVote: votes[userId] ?? null };
}
