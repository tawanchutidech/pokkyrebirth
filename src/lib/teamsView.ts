import { CASTLES, type Castle, type CastleData } from "@/data/castles";
import { getHero, heroMatchesQuery } from "@/data/heroes";

export type FlatTeam = {
  castleId: string;
  castleLabel: string;
  castleGroup: Castle["group"];
  rowNum: number;
  heroes: (string | null)[];
  pet: string | null;
};

export const GROUP_TABS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "outer", label: "ปราสาทนอก" },
  { id: "inner", label: "ปราสาทใน" },
  { id: "main", label: "ปราสาทหลัก" },
] as const;
export type GroupTabId = (typeof GROUP_TABS)[number]["id"];

export function flattenTeams(castlesData: CastleData | null | undefined): FlatTeam[] {
  const teams: FlatTeam[] = [];
  CASTLES.forEach((castle) => {
    const rows = castlesData?.[castle.id] || [];
    rows.forEach((row, i) => {
      const heroes = Array.isArray(row.heroes) ? row.heroes : [];
      if (!heroes.some(Boolean) && !row.pet) return; // skip fully-empty rows
      teams.push({
        castleId: castle.id,
        castleLabel: castle.label,
        castleGroup: castle.group,
        rowNum: i + 1,
        heroes,
        pet: row.pet || null,
      });
    });
  });
  return teams;
}

export function teamMatchesQuery(team: FlatTeam, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return team.heroes.some((id) => {
    if (!id) return false;
    const hero = getHero(id);
    return hero ? heroMatchesQuery(hero, q) : false;
  });
}

export type MergedTeam = FlatTeam & {
  count: number;
  pets: string[];
  castleBreakdown: { castleId: string; castleLabel: string; count: number }[];
  compKey: string;
};

// Teams with the same 3 heroes (regardless of slot order) collapse into one
// card with a count, plus a per-castle breakdown. Pet does NOT factor into
// what counts as a duplicate.
export function dedupTeamsByComposition(teams: FlatTeam[]): MergedTeam[] {
  const seen = new Map<string, MergedTeam>();
  const result: MergedTeam[] = [];
  teams.forEach((team) => {
    const key = team.heroes.slice().sort().join(",");
    let entry = seen.get(key);
    if (!entry) {
      entry = { ...team, count: 0, pets: [], castleBreakdown: [], compKey: key };
      seen.set(key, entry);
      result.push(entry);
    }
    entry.count++;
    if (team.pet && !entry.pets.includes(team.pet)) entry.pets.push(team.pet);

    let castleEntry = entry.castleBreakdown.find((c) => c.castleId === team.castleId);
    if (!castleEntry) {
      castleEntry = { castleId: team.castleId, castleLabel: team.castleLabel, count: 0 };
      entry.castleBreakdown.push(castleEntry);
    }
    castleEntry.count++;
  });
  return result.sort((a, b) => b.count - a.count);
}

export function castleColorClass(castleId: string): string {
  const idx = CASTLES.findIndex((c) => c.id === castleId);
  return `palette-tier-${(idx % 6) + 1}`;
}
