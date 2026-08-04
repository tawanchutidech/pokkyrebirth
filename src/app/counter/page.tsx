"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HEROES, HERO_TIERS, getHero, heroEffectiveTier, heroMatchesQuery, type ElementId } from "@/data/heroes";
import { PETS, getPet } from "@/data/pets";
import { RINGS, EQUIPMENT_SETS, getRing, getEquipmentSet, ringMatchesQuery } from "@/data/gear";
import { canViewGuild, getLocalDevUser, type Guild } from "@/lib/auth";
import type { CounterEntryView, HeroGear, VoteType } from "@/data/counters";
import { ElementFilterRow } from "@/components/HeroChip";
import { useToast } from "@/components/Toast";

const EMPTY_GEAR: HeroGear = { rings: {}, sets: {} };

function GearSlotRow({
  label,
  slots,
  itemLookup,
  onPick,
  onRemove,
}: {
  label: string;
  slots: [string, string | null][];
  itemLookup: (id: string) => { img: string; name: string } | null;
  onPick: (slotNum: string) => void;
  onRemove: (slotNum: string) => void;
}) {
  return (
    <div className="gear-type-row">
      <span className="gear-type-label">{label}</span>
      <div className="gear-slots-grid">
        {slots.map(([slotNum, itemId]) => {
          const item = itemId ? itemLookup(itemId) : null;
          return (
            <div key={slotNum} className={`gear-slot${item ? " filled" : " empty"}`} onClick={() => (item ? undefined : onPick(slotNum))}>
              {item ? (
                <>
                  <img src={item.img} alt={item.name} loading="lazy" />
                  <button
                    className="gear-slot-remove"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(slotNum);
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
    </div>
  );
}

function HeroGearBlock({
  heroId,
  gear,
  onChange,
}: {
  heroId: string;
  gear: HeroGear;
  onChange: (next: HeroGear) => void;
}) {
  const hero = getHero(heroId)!;
  const [picker, setPicker] = useState<{ kind: "ring" | "set"; slotNum: string } | null>(null);
  const [query, setQuery] = useState("");

  function pickItem(id: string) {
    if (!picker) return;
    const key = picker.kind === "ring" ? "rings" : "sets";
    onChange({ ...gear, [key]: { ...gear[key], [picker.slotNum]: id } });
    setPicker(null);
    setQuery("");
  }

  function removeItem(kind: "ring" | "set", slotNum: string) {
    const key = kind === "ring" ? "rings" : "sets";
    onChange({ ...gear, [key]: { ...gear[key], [slotNum]: null } });
  }

  const ringSlots: [string, string | null][] = ["1", "2", "3"].map((n) => [n, gear.rings[n] ?? null]);
  const setSlots: [string, string | null][] = ["1", "2", "3"].map((n) => [n, gear.sets[n] ?? null]);

  return (
    <div className="hero-gear-block">
      <div className="hero-gear-row">
        <div className="hero-gear-left">
          <div className="hero-gear-portrait">
            <img src={hero.img} alt={hero.name} loading="lazy" />
          </div>
          <div className="hero-gear-slots">
            <GearSlotRow label="แหวน" slots={ringSlots} itemLookup={getRing} onPick={(n) => setPicker({ kind: "ring", slotNum: n })} onRemove={(n) => removeItem("ring", n)} />
            <GearSlotRow label="เซ็ต" slots={setSlots} itemLookup={getEquipmentSet} onPick={(n) => setPicker({ kind: "set", slotNum: n })} onRemove={(n) => removeItem("set", n)} />
          </div>
        </div>
      </div>
      {picker && (
        <div className="gear-picker-inline">
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="ค้นหา..." value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
            <button className="dp-close-btn" type="button" onClick={() => setPicker(null)}>
              ×
            </button>
          </div>
          <div className="hero-grid" style={{ maxHeight: 180 }}>
            {(picker.kind === "ring" ? RINGS.filter((r) => ringMatchesQuery(r, query)) : EQUIPMENT_SETS.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))).map((item) => (
              <button key={item.id} type="button" className="hero-chip" onClick={() => pickItem(item.id)}>
                <img src={item.img} alt={item.name} loading="lazy" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ELEMENT_ICON: Record<ElementId, string> = {
  light: "/public/element/Light.webp",
  fire: "/public/element/Fire.webp",
  dark: "/public/element/Dark.webp",
  water: "/public/element/Water.webp",
  ground: "/public/element/Ground.webp",
};

function HeroSlots({ heroes }: { heroes: (string | null)[] }) {
  return (
    <div className="saved-team-heroes">
      {heroes.map((id, i) => {
        const hero = id ? getHero(id) : null;
        return (
          <div key={i} className={`saved-team-slot${hero ? "" : " empty"}`}>
            {hero && <img src={hero.img} alt={hero.name} loading="lazy" />}
          </div>
        );
      })}
    </div>
  );
}

function CounterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guild = searchParams.get("guild") as Guild | null;
  const comp = searchParams.get("comp");
  const group = searchParams.get("group") || "all";
  const user = getLocalDevUser();
  const { show, toastEl } = useToast();

  const [ready, setReady] = useState(false);
  const [counters, setCounters] = useState<CounterEntryView[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [heroes, setHeroes] = useState<(string | null)[]>([null, null, null]);
  const [pet, setPet] = useState<string | null>(null);
  const [gear, setGear] = useState<Record<string, HeroGear>>({});
  const [expandedGearId, setExpandedGearId] = useState<string | null>(null);
  const [pendingSlot, setPendingSlot] = useState<{ index: number; kind: "hero" | "pet" } | null>({ index: 0, kind: "hero" });
  const [query, setQuery] = useState("");
  const [elementFilter, setElementFilter] = useState<ElementId | null>(null);

  const enemyHeroIds = useMemo(() => (comp ? comp.split(",") : []), [comp]);

  useEffect(() => {
    if (!guild || !comp) {
      router.replace("/");
      return;
    }
    if (!canViewGuild(user, guild)) {
      show("คุณไม่มีสิทธิ์ดูกิลด์นี้");
      router.replace("/");
      return;
    }
    (async () => {
      const res = await fetch(`/api/counters?guild=${encodeURIComponent(guild)}&comp=${encodeURIComponent(comp)}&userId=${encodeURIComponent(user.userId)}`);
      if (res.ok) {
        const data: { counters: CounterEntryView[] } = await res.json();
        setCounters(data.counters);
      }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guild, comp]);

  if (!guild || !comp) return null;

  async function vote(counterId: string, voteType: VoteType) {
    const res = await fetch("/api/counters/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guild, comp, counterId, voteType, userId: user.userId }),
    });
    if (!res.ok) {
      show("โหวตไม่สำเร็จ");
      return;
    }
    const result: { likes: number; dislikes: number; myVote: VoteType | null } = await res.json();
    setCounters((prev) => prev.map((c) => (c.id === counterId ? { ...c, likes: result.likes, dislikes: result.dislikes, myVote: result.myVote } : c)));
  }

  async function approve(counterId: string) {
    const res = await fetch("/api/counters/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guild, comp, counterId, userId: user.userId }),
    });
    if (!res.ok) {
      show("อนุมัติไม่สำเร็จ");
      return;
    }
    const data: { counters: CounterEntryView[] } = await res.json();
    setCounters(data.counters);
    show("อนุมัติทีมตอบโต้แล้ว");
  }

  function openEditor() {
    setName("");
    setNote("");
    setHeroes([null, null, null]);
    setPet(null);
    setGear({});
    setPendingSlot({ index: 0, kind: "hero" });
    setShowEditor(true);
  }

  function selectPickerItem(id: string) {
    if (!pendingSlot) return;
    if (pendingSlot.kind === "pet") {
      setPet(id);
      setPendingSlot(null);
      return;
    }
    const nextHeroes = heroes.map((h, i) => (i === pendingSlot.index ? id : h));
    setHeroes(nextHeroes);
    const nextEmpty = nextHeroes.findIndex((h) => !h);
    setPendingSlot(nextEmpty !== -1 ? { index: nextEmpty, kind: "hero" } : { index: 0, kind: "pet" });
  }

  async function saveCounter() {
    if (!heroes.every(Boolean)) {
      show("กรอกตัวละครให้ครบ 3 ตัวก่อน");
      return;
    }
    const res = await fetch("/api/counters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guild,
        comp,
        counter: { name: name || "ทีมตอบโต้", heroes, pet, gear, note },
        userId: user.userId,
        userName: user.displayName,
        isAdmin: !user.isCodeLogin,
      }),
    });
    if (!res.ok) {
      show("บันทึกไม่สำเร็จ");
      return;
    }
    const data: { counters: CounterEntryView[] } = await res.json();
    setCounters(data.counters);
    setShowEditor(false);
    show("บันทึกทีมตอบโต้แล้ว");
  }

  const excludedHeroIds = new Set(pendingSlot?.kind === "hero" ? (heroes.filter((h, i) => i !== pendingSlot.index && h) as string[]) : []);

  return (
    <main className="counter-main">
      {!ready && <div className="home-status">กำลังโหลดข้อมูล...</div>}
      {ready && (
        <div id="counterContent">
          <div className="castle-page-head">
            <button className="btn" type="button" onClick={() => router.push(`/teams?guild=${encodeURIComponent(guild)}&group=${group}`)}>
              ← กลับ
            </button>
            <div className="castle-page-title">ทีมตอบโต้ที่แนะนำ</div>
            <span className="castle-head-spacer btn" aria-hidden="true">
              ← กลับ
            </span>
          </div>

          <div className="detail-enemy-box">
            <div className="detail-enemy-header">
              <span className="detail-enemy-title">ทีมศัตรู</span>
            </div>
            <div className="detail-enemy-body">
              <HeroSlots heroes={enemyHeroIds} />
            </div>
          </div>

          <div className="counter-list-head">
            <span className="filter-count">{counters.length} รายการ</span>
            <button className="btn btn-primary" type="button" onClick={openEditor}>
              + เพิ่มทีมตอบโต้
            </button>
          </div>

          {counters.length === 0 ? (
            <div className="empty-state" id="counterEmptyState">
              ยังไม่มีทีมตอบโต้ที่แนะนำสำหรับทีมนี้
            </div>
          ) : (
            <div className="detail-counters-grid">
              {counters.map((c) => (
                <div className="team-card" key={c.id}>
                  <div className="saved-team-card-top">
                    <span className="counter-card-name">{c.name}</span>
                    <span className={`counter-status-pill ${c.status}`}>{c.status === "pending" ? "รออนุมัติ" : "ใช้งานได้"}</span>
                  </div>
                  <div className="saved-team-body">
                    <HeroSlots heroes={c.heroes} />
                    <div className="saved-team-divider" />
                    {c.pet && <img className="saved-team-pet" src={getPet(c.pet)?.img} alt="" loading="lazy" />}
                  </div>
                  {c.note && <div className="counter-card-note">{c.note}</div>}
                  {Object.keys(c.gear || {}).length > 0 && (
                    <button className="view-more-btn" type="button" style={{ padding: "0 14px 10px" }} onClick={() => setExpandedGearId((cur) => (cur === c.id ? null : c.id))}>
                      {expandedGearId === c.id ? "ซ่อนอุปกรณ์" : "ดูอุปกรณ์ ›"}
                    </button>
                  )}
                  {expandedGearId === c.id && (
                    <div className="hero-gear-section">
                      {c.heroes.filter(Boolean).map((heroId) => {
                        const g = c.gear?.[heroId as string] || EMPTY_GEAR;
                        const hero = getHero(heroId as string);
                        if (!hero) return null;
                        return (
                          <div className="hero-gear-block" key={heroId}>
                            <div className="hero-gear-row">
                              <div className="hero-gear-left">
                                <div className="hero-gear-portrait">
                                  <img src={hero.img} alt={hero.name} loading="lazy" />
                                </div>
                                <div className="hero-gear-slots">
                                  <GearSlotRow label="แหวน" slots={["1", "2", "3"].map((n) => [n, g.rings[n] ?? null])} itemLookup={getRing} onPick={() => {}} onRemove={() => {}} />
                                  <GearSlotRow label="เซ็ต" slots={["1", "2", "3"].map((n) => [n, g.sets[n] ?? null])} itemLookup={getEquipmentSet} onPick={() => {}} onRemove={() => {}} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="card-footer">
                    <div className="counter-vote-row" style={{ marginRight: "auto" }}>
                      <button className={`vote-btn${c.myVote === "like" ? " voted" : ""}`} type="button" onClick={() => vote(c.id, "like")}>
                        👍 {c.likes}
                      </button>
                      <button className={`vote-btn${c.myVote === "dislike" ? " voted" : ""}`} type="button" onClick={() => vote(c.id, "dislike")}>
                        👎 {c.dislikes}
                      </button>
                    </div>
                    {c.status === "pending" && !user.isCodeLogin && (
                      <button className="btn btn-primary" type="button" onClick={() => approve(c.id)}>
                        อนุมัติ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showEditor && (
            <div className="counter-editor">
              <div className="counter-editor-form">
                <div className="counter-editor-section-title">ชื่อทีม</div>
                <input className="counter-name-input" placeholder="เช่น ทีมตอบโต้ที่ 1" value={name} onChange={(e) => setName(e.target.value)} />

                <div className="counter-editor-section-title">ตัวละคร &amp; สัตว์เลี้ยง</div>
                <div className="counter-formation-area">
                  <div>
                    <HeroSlots heroes={heroes} />
                    <div style={{ marginTop: 8 }}>
                      {pet ? <img className="saved-team-pet" src={getPet(pet)?.img} alt="" /> : <span style={{ fontSize: 12, color: "var(--muted)" }}>ยังไม่ได้เลือกสัตว์เลี้ยง</span>}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div className="search-bar">
                      <span>🔍</span>
                      <input placeholder="ค้นหา..." value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    {pendingSlot?.kind === "hero" && (
                      <ElementFilterRow
                        elements={Object.entries(ELEMENT_ICON).map(([id, icon]) => ({ id, label: id, icon }))}
                        active={elementFilter}
                        onToggle={(id) => setElementFilter((cur) => (cur === id ? null : (id as ElementId)))}
                      />
                    )}
                    <div className="hero-grid" style={{ maxHeight: 260 }}>
                      {pendingSlot?.kind === "pet"
                        ? PETS.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).map((p) => (
                            <button key={p.id} type="button" className="hero-chip" onClick={() => selectPickerItem(p.id)}>
                              <img src={p.img} alt={p.name} loading="lazy" />
                              <span>{p.name}</span>
                            </button>
                          ))
                        : HERO_TIERS.map((t) => {
                            const tierHeroes = HEROES.filter(
                              (h) => heroEffectiveTier(h, {}) === t.tier && heroMatchesQuery(h, query) && !excludedHeroIds.has(h.id) && (!elementFilter || h.element === elementFilter)
                            );
                            if (!tierHeroes.length) return null;
                            return (
                              <div key={t.tier} style={{ display: "contents" }}>
                                <div className={`palette-tier-header palette-tier-${t.tier}`}>{t.label}</div>
                                {tierHeroes.map((h) => (
                                  <button key={h.id} type="button" className="hero-chip" onClick={() => selectPickerItem(h.id)}>
                                    <img src={h.img} alt={h.name} loading="lazy" />
                                    <span>{h.name}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })}
                    </div>
                  </div>
                </div>

                {heroes.every(Boolean) && (
                  <>
                    <div className="counter-editor-section-title">อุปกรณ์ &amp; รายละเอียด</div>
                    <div className="hero-gear-section">
                      {heroes.map((heroId) => (
                        <HeroGearBlock
                          key={heroId}
                          heroId={heroId as string}
                          gear={gear[heroId as string] || EMPTY_GEAR}
                          onChange={(next) => setGear((g) => ({ ...g, [heroId as string]: next }))}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="counter-team-note-section">
                  <label className="counter-team-note-label">สรุปรายละเอียดทีม</label>
                  <textarea className="counter-team-note-input" placeholder="เช่น ลำดับการใช้สกิล / ข้อควรระวัง / หมายเหตุพิเศษ..." value={note} onChange={(e) => setNote(e.target.value)} />
                </div>

                <div className="counter-editor-actions">
                  <button className="btn" type="button" onClick={() => setShowEditor(false)}>
                    ยกเลิก
                  </button>
                  <button className="btn btn-primary" type="button" onClick={saveCounter}>
                    บันทึกทีมตอบโต้
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {toastEl}
    </main>
  );
}

export default function CounterPage() {
  return (
    <Suspense>
      <CounterPageInner />
    </Suspense>
  );
}
