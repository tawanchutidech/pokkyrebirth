export type CastleGroup = "outer" | "inner" | "main";

export type Castle = { id: string; label: string; group: CastleGroup };

export const CASTLES: Castle[] = [
  { id: "outer1", label: "ปราสาทนอก 1", group: "outer" },
  { id: "outer2", label: "ปราสาทนอก 2", group: "outer" },
  { id: "outer3", label: "ปราสาทนอก 3", group: "outer" },
  { id: "outer4", label: "ปราสาทนอก 4", group: "outer" },
  { id: "outer5", label: "ปราสาทนอก 5", group: "outer" },
  { id: "inner1", label: "ปราสาทใน 1", group: "inner" },
  { id: "inner2", label: "ปราสาทใน 2", group: "inner" },
  { id: "inner3", label: "ปราสาทใน 3", group: "inner" },
  { id: "main", label: "ปราสาทหลัก", group: "main" },
];

export const GROUP_ICON: Record<CastleGroup, string> = { outer: "🏯", inner: "🏛️", main: "👑" };
// Team-slot count differs per castle type: outer castles run smaller than
// inner castles, and the main castle is the biggest of all.
export const GROUP_ROW_COUNT: Record<CastleGroup, number> = { outer: 10, inner: 15, main: 20 };
export const TEAM_SIZE = 3; // max heroes per row, no duplicates within a row

export function getCastle(id: string): Castle | null {
  return CASTLES.find((c) => c.id === id) || null;
}

export function getRowCount(castleId: string): number {
  const castle = getCastle(castleId);
  return castle ? GROUP_ROW_COUNT[castle.group] : 0;
}

export type CastleRow = { heroes: (string | null)[]; pet: string | null };
export type CastleData = Record<string, CastleRow[]>; // castleId -> rows

// Normalizes to exactly rowCount rows of { heroes: [TEAM_SIZE], pet }, in
// case of stale draft data from an earlier layout.
export function normalizeRows(existing: CastleRow[] | undefined, castleId: string): CastleRow[] {
  const rowCount = getRowCount(castleId);
  return Array.from({ length: rowCount }, (_, i) => {
    const row = existing?.[i];
    let heroes: (string | null)[] = Array.isArray(row?.heroes) ? row.heroes.slice(0, TEAM_SIZE) : [];
    const pet = row?.pet || null;
    while (heroes.length < TEAM_SIZE) heroes.push(null);
    return { heroes, pet };
  });
}

// A row counts as a formed team once it has at least 1 hero in it.
export function countTeams(rows: CastleRow[]): number {
  return rows.filter((row) => row.heroes.some(Boolean)).length;
}

// A row is "complete" only once all 3 hero slots are filled.
export function isRowComplete(row: CastleRow): boolean {
  return row.heroes.every(Boolean);
}

export function isCastleComplete(rows: CastleRow[]): boolean {
  return rows.every(isRowComplete);
}

export type PendingSlot = { rowIndex: number; slotIndex: number | null; kind: "hero" | "pet" };

// First not-yet-filled slot across a castle's rows, top to bottom.
export function findFirstEmptySlot(rows: CastleRow[]): PendingSlot | null {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const slotIndex = rows[rowIndex].heroes.findIndex((h) => !h);
    if (slotIndex !== -1) return { rowIndex, slotIndex, kind: "hero" };
    if (!rows[rowIndex].pet) return { rowIndex, slotIndex: null, kind: "pet" };
  }
  return null;
}
