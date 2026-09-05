"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getHero } from "@/data/heroes";
import { getPet } from "@/data/pets";
import { getRing, getEquipmentSet } from "@/data/gear";

type ImportedGear = {
  rings?: Record<string, string | null>;
  ringOverlays?: Record<string, string | null>;
  sets?: Record<string, string | null>;
  stats?: Record<string, string>;
  note?: string;
};

type ImportedCounter = {
  id: string;
  pattern: string;
  slots: Record<string, string>;
  guilds?: string[];
  name: string;
  pets?: Record<string, string>;
  gear?: Record<string, ImportedGear>;
  teamNote?: string;
  hidden?: boolean;
};

type ImportedTeam = {
  id: string;
  name: string;
  category: string;
  guild: string;
  enemy: { pattern: string; slots: Record<string, string> };
  counters: ImportedCounter[];
};

const CATEGORY_TABS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "tank", label: "แทงค์" },
  { id: "physical", label: "กายภาพ" },
  { id: "magic", label: "เวทมนตร์" },
  { id: "other", label: "อื่นๆ" },
] as const;

function HeroSlots5({ slots }: { slots: Record<string, string> }) {
  return (
    <div className="saved-team-heroes">
      {[1, 2, 3, 4, 5].map((n) => {
        const name = slots[String(n)];
        const hero = name ? getHero(name) : null;
        return (
          <div key={n} className={`saved-team-slot${name ? "" : " empty"}`} title={name || undefined}>
            {name && (hero ? <img src={hero.img} alt={name} loading="lazy" /> : <span className="imported-hero-fallback">{name}</span>)}
          </div>
        );
      })}
    </div>
  );
}

function PetSlots5({ pets }: { pets: Record<string, string> | undefined }) {
  const ids = [1, 2, 3, 4, 5].map((n) => pets?.[String(n)]).filter(Boolean) as string[];
  if (!ids.length) return <div className="saved-team-pet saved-team-slot empty" style={{ borderRadius: "50%" }} />;
  return (
    <>
      {ids.map((id, i) => {
        const pet = getPet(id);
        return pet ? (
          <img key={i} className="saved-team-pet" src={pet.img} alt={pet.name} loading="lazy" />
        ) : (
          <span key={i} className="saved-team-pet imported-hero-fallback" style={{ borderRadius: "50%" }}>
            {id}
          </span>
        );
      })}
    </>
  );
}

function GearRow({ label, ids, itemLookup }: { label: string; ids: (string | null | undefined)[]; itemLookup: (id: string) => { img: string; name: string } | null }) {
  const filled = ids.filter(Boolean) as string[];
  if (!filled.length) return null;
  return (
    <div className="gear-type-row">
      <span className="gear-type-label">{label}</span>
      <div className="gear-slots-grid">
        {filled.map((id, i) => {
          const item = itemLookup(id);
          return (
            <div key={i} className="gear-slot filled" title={item?.name || id}>
              {item ? <img src={item.img} alt={item.name} loading="lazy" /> : <span className="imported-hero-fallback">{id}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CounterGearBlock({ heroName, gear }: { heroName: string; gear: ImportedGear }) {
  const hero = getHero(heroName);
  const ringIds = ["1", "2", "3"].flatMap((n) => [gear.rings?.[n], gear.ringOverlays?.[n]]);
  const setIds = ["1", "2", "3"].map((n) => gear.sets?.[n]);
  return (
    <div className="hero-gear-block">
      <div className="hero-gear-row">
        <div className="hero-gear-left">
          <div className="hero-gear-portrait">{hero ? <img src={hero.img} alt={heroName} loading="lazy" /> : <span className="imported-hero-fallback">{heroName}</span>}</div>
          <div className="hero-gear-slots">
            <GearRow label="แหวน" ids={ringIds} itemLookup={getRing} />
            <GearRow label="เซ็ต" ids={setIds} itemLookup={getEquipmentSet} />
          </div>
        </div>
      </div>
      {gear.note && <div className="counter-card-note" style={{ whiteSpace: "pre-line" }}>{gear.note}</div>}
    </div>
  );
}

function CounterCard({ counter }: { counter: ImportedCounter }) {
  const [expanded, setExpanded] = useState(false);
  const heroNames = [1, 2, 3, 4, 5].map((n) => counter.slots[String(n)]).filter(Boolean) as string[];
  const hasGear = Object.keys(counter.gear || {}).length > 0;
  return (
    <div className="team-card">
      <div className="saved-team-card-top">
        <span className="counter-card-name">{counter.name}</span>
        {(counter.guilds || []).map((g) => (
          <span key={g} className="badge-guild-tag" style={{ background: "linear-gradient(135deg, #475569, #64748b)" }}>
            {g}
          </span>
        ))}
      </div>
      <div className="saved-team-body">
        <HeroSlots5 slots={counter.slots} />
        <div className="saved-team-divider" />
        <div className="saved-team-pets">
          <PetSlots5 pets={counter.pets} />
        </div>
      </div>
      {counter.teamNote && <div className="counter-card-note">{counter.teamNote}</div>}
      {hasGear && (
        <button className="view-more-btn" type="button" style={{ padding: "0 14px 10px" }} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "ซ่อนอุปกรณ์" : "ดูอุปกรณ์ ›"}
        </button>
      )}
      {expanded && (
        <div className="hero-gear-section">
          {heroNames.map((name) => (
            <CounterGearBlock key={name} heroName={name} gear={counter.gear?.[name] || {}} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ team, onOpen }: { team: ImportedTeam; onOpen: () => void }) {
  return (
    <div className="team-card">
      <div className="saved-team-card-top">
        <span className="saved-team-castle">{team.name}</span>
        <span className="saved-team-num">{team.counters.length} ทีมตอบโต้</span>
      </div>
      <div className="saved-team-body">
        <HeroSlots5 slots={team.enemy.slots} />
      </div>
      <div className="card-footer">
        <button className="view-more-btn" type="button" onClick={onOpen}>
          ดูทีมตอบโต้ ›
        </button>
      </div>
    </div>
  );
}

export default function ImportedTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<ImportedTeam[]>([]);
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORY_TABS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/data/pokky-teams-import.json");
        const data: { teams: ImportedTeam[] } = await res.json();
        setTeams(data.teams || []);
      } catch {
        setTeams([]);
      }
      setReady(true);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      teams.filter((t) => {
        if (category !== "all" && t.category !== category) return false;
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return Object.values(t.enemy.slots).some((name) => name.toLowerCase().includes(q));
      }),
    [teams, category, query]
  );

  const openTeam = teams.find((t) => t.id === openTeamId) || null;

  return (
    <main className="teams-main">
      <div className="castle-page-head">
        <button className="btn" type="button" onClick={() => router.push("/")}>
          ← กลับหน้าหลัก
        </button>
        <div className="castle-page-title">
          ทีมที่นำเข้า — <span className="castle-guild-name">{teams[0]?.guild || "PokkyRebirth"}</span>
        </div>
        <span className="castle-head-spacer btn" aria-hidden="true">
          ← กลับหน้าหลัก
        </span>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input placeholder="ค้นหาทีม... เช่น ชื่อตัวละครในทีมศัตรู" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="palette-tabs">
        {CATEGORY_TABS.map((t) => (
          <button key={t.id} className={`palette-tab${category === t.id ? " active" : ""}`} type="button" onClick={() => setCategory(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <span className="filter-count">ทั้งหมด {filtered.length} รายการ</span>
      </div>

      {!ready ? (
        <div className="home-status">กำลังโหลดข้อมูล...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">ไม่พบทีมที่ตรงกับเงื่อนไข</div>
      ) : (
        <div className="team-grid saved-team-grid">
          {filtered.map((t) => (
            <TeamCard key={t.id} team={t} onOpen={() => setOpenTeamId(t.id)} />
          ))}
        </div>
      )}

      <div className={`modal-overlay${openTeam ? " open" : ""}`} onClick={() => setOpenTeamId(null)}>
        {openTeam && (
          <div className="modal-box team-detail-box imported-team-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <b>{openTeam.name}</b>
              <button className="dp-close-btn" type="button" onClick={() => setOpenTeamId(null)}>
                ×
              </button>
            </div>
            <div className="detail-enemy-box">
              <div className="detail-enemy-header">
                <span className="detail-enemy-title">ทีมศัตรู</span>
              </div>
              <div className="detail-enemy-body">
                <HeroSlots5 slots={openTeam.enemy.slots} />
              </div>
            </div>
            {openTeam.counters.length === 0 ? (
              <div className="empty-state">ยังไม่มีทีมตอบโต้ที่แนะนำสำหรับทีมนี้</div>
            ) : (
              <div className="detail-counters-grid">
                {openTeam.counters.map((c) => (
                  <CounterCard key={c.id} counter={c} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
