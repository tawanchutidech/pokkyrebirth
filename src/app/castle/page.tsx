"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CASTLES,
  GROUP_ICON,
  TEAM_SIZE,
  countTeams,
  findFirstEmptySlot,
  getCastle,
  getRowCount,
  isCastleComplete,
  isRowComplete,
  type CastleData,
  type CastleGroup,
  type CastleRow,
  type PendingSlot,
} from "@/data/castles";
import { getRows, isGuildComplete, loadDraft, saveDraft } from "@/lib/castleDraft";
import { HEROES, HERO_TIERS, heroEffectiveTier, heroMatchesQuery, getHero, type ElementId } from "@/data/heroes";
import { PETS, getPet } from "@/data/pets";
import { canEditGuild, getLocalDevUser, type Guild } from "@/lib/auth";
import { ElementFilterRow } from "@/components/HeroChip";
import { useToast } from "@/components/Toast";

const ELEMENT_ICON: Record<ElementId, string> = {
  light: "/public/element/Light.webp",
  fire: "/public/element/Fire.webp",
  dark: "/public/element/Dark.webp",
  water: "/public/element/Water.webp",
  ground: "/public/element/Ground.webp",
};

function pickRandomDistinct<T>(arr: T[], n: number): T[] {
  const pool = arr.slice();
  const picked: T[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

function CastlePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guild = searchParams.get("guild") as Guild | null;
  const user = getLocalDevUser();
  const { show, toastEl } = useToast();

  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Record<string, CastleData>>({});
  const [view, setView] = useState<"list" | "grid">("list");
  const [activeCastleId, setActiveCastleId] = useState<string | null>(null);
  const [pendingSlot, setPendingSlotState] = useState<PendingSlot | null>(null);
  const [query, setQuery] = useState("");
  const [elementFilter, setElementFilter] = useState<ElementId | null>(null);
  const [hotRanks, setHotRanks] = useState<Record<string, boolean>>({});
  const [serverUpdatedAt, setServerUpdatedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Local dev bypass grants a full session same as real Discord admin
  // (isCodeLogin: false), matching what unlocks "save all" in production.
  const isRealAdmin = !user.isCodeLogin && !!guild && canEditGuild(user, guild);

  const mutate = useCallback((fn: (d: Record<string, CastleData>) => void) => {
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      saveDraft(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!guild) {
      router.replace("/");
      return;
    }
    if (!canEditGuild(user, guild)) {
      show("คุณไม่มีสิทธิ์จัดการกิลด์นี้");
      router.replace("/");
      return;
    }

    (async () => {
      const draft = loadDraft();

      try {
        const res = await fetch(`/api/castle?guild=${encodeURIComponent(guild)}`);
        if (res.ok) {
          const stored: { castles: CastleData; updatedAt: number | null } = await res.json();
          setServerUpdatedAt(stored.updatedAt);
          if (stored.castles && Object.keys(stored.castles).length) {
            draft[guild] = stored.castles;
            saveDraft(draft);
          }
        }
      } catch {
        /* best-effort — fall back to local draft */
      }

      try {
        const res = await fetch(`/api/hero-tier-list?guild=${encodeURIComponent(guild)}`);
        if (res.ok) {
          const stored: { hot: string[] } = await res.json();
          const next: Record<string, boolean> = {};
          stored.hot.forEach((id) => (next[id] = true));
          setHotRanks(next);
        }
      } catch {
        /* ignore */
      }

      setData(draft);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guild]);

  if (!guild) return null;

  function openCastle(castleId: string) {
    setActiveCastleId(castleId);
    setView("grid");
    const rows = getRows(data, guild!, castleId);
    const firstEmpty = findFirstEmptySlot(rows);
    setPendingSlotState(firstEmpty);
    setElementFilter(null);
    setQuery("");
  }

  function backToList() {
    setActiveCastleId(null);
    setView("list");
  }

  function setPendingSlot(rowIndex: number, slotIndex: number | null, kind: "hero" | "pet") {
    setPendingSlotState({ rowIndex, slotIndex, kind });
  }

  function selectItem(id: string) {
    if (!pendingSlot || !activeCastleId) return;
    const { rowIndex, kind, slotIndex } = pendingSlot;

    // Computed synchronously from the current `data` (fresh in this render's
    // closure) rather than inside a setState updater — a functional updater
    // only runs during React's next reconciliation pass, not inline, so a
    // value read out of one right after calling setState is still stale.
    const next = structuredClone(data);
    const rows = getRows(next, guild!, activeCastleId);
    let nextPending: PendingSlot | null;

    if (kind === "pet") {
      rows[rowIndex].pet = id;
      const nextRowIndex = rowIndex + 1;
      nextPending = nextRowIndex < rows.length ? { rowIndex: nextRowIndex, slotIndex: 0, kind: "hero" } : null;
    } else {
      rows[rowIndex].heroes[slotIndex as number] = id;
      const nextEmpty = rows[rowIndex].heroes.findIndex((h) => !h);
      nextPending = nextEmpty !== -1 ? { rowIndex, slotIndex: nextEmpty, kind: "hero" } : { rowIndex, slotIndex: null, kind: "pet" };
    }

    saveDraft(next);
    setData(next);
    setPendingSlotState(nextPending);
  }

  function removeHero(rowIndex: number, slotIndex: number) {
    if (!activeCastleId) return;
    mutate((d) => {
      const rows = getRows(d, guild!, activeCastleId);
      rows[rowIndex].heroes[slotIndex] = null;
    });
  }

  function removePet(rowIndex: number) {
    if (!activeCastleId) return;
    mutate((d) => {
      const rows = getRows(d, guild!, activeCastleId);
      rows[rowIndex].pet = null;
    });
  }

  function clearCastle() {
    if (!activeCastleId) return;
    const castle = getCastle(activeCastleId)!;
    if (!confirm(`ล้างทีมทั้งหมดใน "${castle.label}" ทันที (ข้อมูลเดิมในเครื่องนี้จะถูกลบ) ยืนยันไหม?`)) return;
    const rowCount = getRowCount(activeCastleId);
    mutate((d) => {
      if (!d[guild!]) d[guild!] = {};
      d[guild!][activeCastleId] = Array.from({ length: rowCount }, () => ({
        heroes: [null, null, null] as (string | null)[],
        pet: null,
      }));
    });
    setPendingSlot(0, 0, "hero");
    show(`ล้างทีมใน "${castle.label}" แล้ว`);
  }

  function mockFillAll() {
    if (!confirm('Mockup: จะกรอกตัวละครสุ่มทับทุกทีมในทุกปราสาทของกิลด์นี้ (ข้อมูลเดิมในเครื่องนี้จะถูกทับ) ยืนยันไหม?')) return;
    mutate((d) => {
      CASTLES.forEach((castle) => {
        const rows = getRows(d, guild!, castle.id);
        rows.forEach((row) => {
          row.heroes = pickRandomDistinct(HEROES, TEAM_SIZE).map((h) => h.id);
          row.pet = PETS[Math.floor(Math.random() * PETS.length)].id;
        });
      });
    });
    show('กรอก Mockup ให้ทุกทีมแล้ว (ยังไม่ได้บันทึกขึ้นระบบ กด "บันทึกทั้งหมดขึ้นระบบ" ต่อได้เลย)');
  }

  async function saveAllToServer() {
    setSaving(true);
    try {
      const castles = data[guild!] || {};
      const res = await fetch("/api/castle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guild, castles, baseUpdatedAt: serverUpdatedAt }),
      });
      if (res.status === 409) {
        show("มีคนอื่นบันทึกไปแล้วหลังจากที่คุณเปิดหน้านี้ กรุณารีเฟรชแล้วแก้ไขใหม่");
        return;
      }
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ (status " + res.status + ")");
      const result: { updatedAt: number } = await res.json();
      setServerUpdatedAt(result.updatedAt);
      show("บันทึกขึ้นระบบสำเร็จ");
      router.push(`/teams?guild=${encodeURIComponent(guild!)}`);
    } catch (err) {
      show("บันทึกไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  const guildComplete = ready && isGuildComplete(data, guild);

  return (
    <main className="castle-main">
      {!ready && <div className="home-status">กำลังตรวจสอบสิทธิ์...</div>}

      {ready && view === "list" && (
        <CastleListView
          guild={guild}
          data={data}
          isRealAdmin={isRealAdmin}
          guildComplete={guildComplete}
          saving={saving}
          onOpen={openCastle}
          onBack={() => router.push("/")}
          onSaveAll={saveAllToServer}
          showMockFill={user.isAdminById}
          onMockFill={mockFillAll}
        />
      )}

      {ready && view === "grid" && activeCastleId && (
        <CastleGridView
          guild={guild}
          activeCastleId={activeCastleId}
          data={data}
          pendingSlot={pendingSlot}
          hotRanks={hotRanks}
          query={query}
          elementFilter={elementFilter}
          onQueryChange={setQuery}
          onElementFilterChange={setElementFilter}
          onSlotClick={setPendingSlot}
          onClearPendingSlot={() => setPendingSlotState(null)}
          onSelectItem={selectItem}
          onRemoveHero={removeHero}
          onRemovePet={removePet}
          onClearCastle={clearCastle}
          onBack={backToList}
        />
      )}

      {toastEl}
    </main>
  );
}

function CastleListView({
  guild,
  data,
  isRealAdmin,
  guildComplete,
  saving,
  onOpen,
  onBack,
  onSaveAll,
  showMockFill,
  onMockFill,
}: {
  guild: string;
  data: Record<string, CastleData>;
  isRealAdmin: boolean;
  guildComplete: boolean;
  saving: boolean;
  onOpen: (castleId: string) => void;
  onBack: () => void;
  onSaveAll: () => void;
  showMockFill: boolean;
  onMockFill: () => void;
}) {
  const groups: { group: CastleGroup; label: string }[] = [
    { group: "outer", label: "ปราสาทนอก" },
    { group: "inner", label: "ปราสาทใน" },
    { group: "main", label: "ปราสาทหลัก" },
  ];

  let saveDisabled = true;
  let saveTitle = "";
  let statusText = "";
  if (!isRealAdmin) {
    saveTitle = "ต้อง Login ด้วย Discord (แอดมินจริง) ถึงจะบันทึกขึ้นระบบได้";
    statusText = "ตอนนี้ล็อกอินด้วยรหัสผู้ดูแล แก้ไขได้แค่ในเครื่องนี้ — ต้อง Login ด้วย Discord ถึงจะบันทึกขึ้นระบบได้";
  } else if (!guildComplete) {
    saveTitle = "ต้องกรอกครบทุกทีมในทุกปราสาทก่อนถึงจะบันทึกได้";
    statusText = "กรอกข้อมูลยังไม่ครบทุกทีม/ทุกปราสาท — บันทึกได้เมื่อกรอกครบหมดแล้ว";
  } else {
    saveDisabled = false;
  }

  return (
    <section id="castleListView">
      <div className="castle-page-head">
        <button className="btn" type="button" onClick={onBack}>
          ← เปลี่ยนกิลด์
        </button>
        <div className="castle-page-title">
          กิลด์ <span className="castle-guild-name">{guild}</span> — เลือกปราสาท
        </div>
        <span className="castle-head-spacer btn" aria-hidden="true">
          ← เปลี่ยนกิลด์
        </span>
      </div>

      {groups.map(({ group, label }) => (
        <div className="castle-pick-group" key={group}>
          <div className="castle-pick-group-label">{label}</div>
          <div className="castle-pick-row">
            {CASTLES.filter((c) => c.group === group).map((castle) => {
              const rows = getRows(data, guild, castle.id);
              const teams = countTeams(rows);
              const complete = isCastleComplete(rows);
              return (
                <button
                  key={castle.id}
                  type="button"
                  className={`castle-pick-btn${complete ? "" : " incomplete"}`}
                  title={complete ? "" : "ยังกรอกทีมไม่ครบ"}
                  onClick={() => onOpen(castle.id)}
                >
                  <span className="castle-pick-icon">{GROUP_ICON[castle.group]}</span>
                  {castle.label}
                  <span className="castle-pick-count">
                    {teams}/{getRowCount(castle.id)} ทีม
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="castle-save-bar">
        <button className="btn btn-primary" type="button" disabled={saveDisabled || saving} title={saveTitle} onClick={onSaveAll}>
          {saving ? "กำลังบันทึก..." : "บันทึกทั้งหมดขึ้นระบบ"}
        </button>
        <span className="castle-save-status">{statusText}</span>
        {showMockFill && (
          <button className="btn castle-mock-btn" type="button" onClick={onMockFill}>
            🧪 Mockup: กรอกตัวละครสุ่มทุกทีมทุกปราสาท
          </button>
        )}
      </div>
    </section>
  );
}

function CastleGridView({
  guild,
  activeCastleId,
  data,
  pendingSlot,
  hotRanks,
  query,
  elementFilter,
  onQueryChange,
  onElementFilterChange,
  onSlotClick,
  onClearPendingSlot,
  onSelectItem,
  onRemoveHero,
  onRemovePet,
  onClearCastle,
  onBack,
}: {
  guild: string;
  activeCastleId: string;
  data: Record<string, CastleData>;
  pendingSlot: PendingSlot | null;
  hotRanks: Record<string, boolean>;
  query: string;
  elementFilter: ElementId | null;
  onQueryChange: (q: string) => void;
  onElementFilterChange: (el: ElementId | null) => void;
  onSlotClick: (rowIndex: number, slotIndex: number | null, kind: "hero" | "pet") => void;
  onClearPendingSlot: () => void;
  onSelectItem: (id: string) => void;
  onRemoveHero: (rowIndex: number, slotIndex: number) => void;
  onRemovePet: (rowIndex: number) => void;
  onClearCastle: () => void;
  onBack: () => void;
}) {
  const castle = getCastle(activeCastleId)!;
  const rows = getRows(data, guild, activeCastleId);
  const pickerKind = pendingSlot?.kind ?? "hero";

  const excludedHeroIds = useMemo(() => {
    if (!pendingSlot || pendingSlot.kind !== "hero") return new Set<string>();
    const row = rows[pendingSlot.rowIndex];
    return new Set(row.heroes.filter((id, i) => i !== pendingSlot.slotIndex && id) as string[]);
  }, [pendingSlot, rows]);

  return (
    <section id="castleGridView">
      <div className="castle-page-head">
        <button className="btn" type="button" onClick={onBack}>
          ← กลับ
        </button>
        <div className="castle-page-title">
          {guild} — {castle.label}
        </div>
        <span className="castle-head-spacer btn" aria-hidden="true">
          ← กลับ
        </span>
      </div>
      <div className="castle-clear-bar">
        <button className="btn btn-danger-outline" type="button" onClick={onClearCastle}>
          🗑️ ล้างทีมในปราสาทนี้
        </button>
      </div>

      <div className="castle-grid-layout">
        <aside className="castle-picker-panel">
          <b>{pickerKind === "pet" ? "เลือกสัตว์เลี้ยง" : "เลือกตัวละคร"}</b>
          <div className="search-bar hero-picker-search">
            <span className="search-icon">🔍</span>
            <input placeholder="ค้นหา..." value={query} onChange={(e) => onQueryChange(e.target.value)} />
          </div>
          {pickerKind === "hero" && (
            <ElementFilterRow
              elements={Object.entries(ELEMENT_ICON).map(([id, icon]) => ({
                id,
                label: id,
                icon,
              }))}
              active={elementFilter}
              onToggle={(id) => onElementFilterChange(elementFilter === id ? null : (id as ElementId))}
            />
          )}
          <div className="hero-grid castle-picker-grid">
            {pickerKind === "pet"
              ? PETS.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).map((p) => (
                  <button key={p.id} type="button" className="hero-chip" onClick={() => onSelectItem(p.id)}>
                    <img src={p.img} alt={p.name} loading="lazy" />
                    <span>{p.name}</span>
                  </button>
                ))
              : HERO_TIERS.map((t) => {
                  const tierHeroes = HEROES.filter(
                    (h) =>
                      heroEffectiveTier(h, hotRanks) === t.tier &&
                      heroMatchesQuery(h, query) &&
                      !excludedHeroIds.has(h.id) &&
                      (!elementFilter || h.element === elementFilter)
                  );
                  if (!tierHeroes.length) return null;
                  return (
                    <div key={t.tier} style={{ display: "contents" }}>
                      <div className={`palette-tier-header palette-tier-${t.tier}`}>{t.label}</div>
                      {tierHeroes.map((h) => (
                        <button key={h.id} type="button" className="hero-chip" onClick={() => onSelectItem(h.id)}>
                          <img src={h.img} alt={h.name} loading="lazy" />
                          <span>{h.name}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
          </div>
        </aside>

        <div className="castle-rows">
          {rows.map((row, rowIndex) => (
            <div className="castle-row" key={rowIndex}>
              <div className={`castle-row-label${isRowComplete(row) ? "" : " incomplete"}`} title={isRowComplete(row) ? "" : "ทีมนี้ยังกรอกไม่ครบ 3 ตัว"}>
                {rowIndex + 1}
              </div>
              <div className="castle-row-slots">
                {row.heroes.map((heroId, slotIndex) => {
                  const hero = heroId ? getHero(heroId) : null;
                  const waiting = pendingSlot?.kind === "hero" && pendingSlot.rowIndex === rowIndex && pendingSlot.slotIndex === slotIndex;
                  return (
                    <div
                      key={slotIndex}
                      className={`castle-slot${hero ? " filled" : " castle-add-slot"}${waiting ? " waiting" : ""}`}
                      onClick={() => (waiting ? onClearPendingSlot() : onSlotClick(rowIndex, slotIndex, "hero"))}
                    >
                      {hero ? (
                        <>
                          <img src={hero.img} alt={hero.name} loading="lazy" />
                          <button
                            className="slot-remove"
                            type="button"
                            title="ลบ"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveHero(rowIndex, slotIndex);
                            }}
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <span className="slot-plus">+</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="castle-row-divider" />
              {(() => {
                const pet = row.pet ? getPet(row.pet) : null;
                const waiting = pendingSlot?.kind === "pet" && pendingSlot.rowIndex === rowIndex;
                return (
                  <div
                    className={`castle-slot castle-pet-slot${pet ? " filled" : " castle-add-slot"}${waiting ? " waiting" : ""}`}
                    onClick={() => (waiting ? onClearPendingSlot() : onSlotClick(rowIndex, null, "pet"))}
                  >
                    {pet ? (
                      <>
                        <img src={pet.img} alt={pet.name} loading="lazy" />
                        <button
                          className="slot-remove"
                          type="button"
                          title="ลบ"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePet(rowIndex);
                          }}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="slot-plus">+</span>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CastlePage() {
  return (
    <Suspense>
      <CastlePageInner />
    </Suspense>
  );
}
