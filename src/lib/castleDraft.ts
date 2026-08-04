import { CASTLES, isCastleComplete, normalizeRows, type CastleData, type CastleRow } from "@/data/castles";

const STORAGE_KEY = "castle_draft_v1";
// data shape: { [guild]: { [castleId]: CastleRow[] } }
type DraftStore = Record<string, CastleData>;

export function loadDraft(): DraftStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

export function saveDraft(data: DraftStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getRows(data: DraftStore, guild: string, castleId: string): CastleRow[] {
  if (!data[guild]) data[guild] = {};
  const rows = normalizeRows(data[guild][castleId], castleId);
  data[guild][castleId] = rows;
  return rows;
}

export function isGuildComplete(data: DraftStore, guild: string): boolean {
  return CASTLES.every((c) => isCastleComplete(getRows(data, guild, c.id)));
}
