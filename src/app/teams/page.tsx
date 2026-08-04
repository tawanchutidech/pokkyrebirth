"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CASTLES, type CastleData } from "@/data/castles";
import { getHero } from "@/data/heroes";
import { getPet } from "@/data/pets";
import { canEditGuild, canViewGuild, getLocalDevUser, type Guild } from "@/lib/auth";
import {
  GROUP_TABS,
  castleColorClass,
  dedupTeamsByComposition,
  flattenTeams,
  teamMatchesQuery,
  type FlatTeam,
  type GroupTabId,
  type MergedTeam,
} from "@/lib/teamsView";
import { useToast } from "@/components/Toast";

const MAX_VISIBLE_PETS = 3;

function heroSlots(heroes: (string | null)[]) {
  return heroes.map((id, i) => {
    const hero = id ? getHero(id) : null;
    return (
      <div key={i} className={`saved-team-slot${hero ? "" : " empty"}`}>
        {hero && <img src={hero.img} alt={hero.name} loading="lazy" />}
      </div>
    );
  });
}

function petsRow(pets: string[]) {
  if (!pets.length) return <div className="saved-team-pet saved-team-slot empty" style={{ borderRadius: "50%" }} />;
  const visible = pets.slice(0, MAX_VISIBLE_PETS);
  const extra = pets.length - visible.length;
  return (
    <>
      {visible.map((id) => {
        const pet = getPet(id);
        return pet ? <img key={id} className="saved-team-pet" src={pet.img} alt={pet.name} loading="lazy" /> : null;
      })}
      {extra > 0 && (
        <span className="saved-team-pet-more" title={`อีก ${extra} ตัว`}>
          +{extra}
        </span>
      )}
    </>
  );
}

function TeamsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guild = searchParams.get("guild") as Guild | null;
  const user = getLocalDevUser();
  const { show, toastEl } = useToast();

  const [ready, setReady] = useState(false);
  const [allTeams, setAllTeams] = useState<FlatTeam[]>([]);
  const [counterSummary, setCounterSummary] = useState<Record<string, { published: number; pending: number }>>({});
  const [hiddenCastles, setHiddenCastles] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupTabId>("all");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [detailTeam, setDetailTeam] = useState<MergedTeam | null>(null);

  const canEditThisGuild = !!guild && canEditGuild(user, guild);

  useEffect(() => {
    if (!guild) {
      router.replace("/");
      return;
    }
    if (!canViewGuild(user, guild)) {
      show("คุณไม่มีสิทธิ์ดูกิลด์นี้");
      router.replace("/");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/castle?guild=${encodeURIComponent(guild)}`);
        const stored: { castles: CastleData } | null = res.ok ? await res.json() : null;
        setAllTeams(flattenTeams(stored?.castles ?? null));
      } catch {
        setAllTeams([]);
      }

      try {
        const res = await fetch(`/api/counters/summary?guild=${encodeURIComponent(guild)}`);
        setCounterSummary(res.ok ? await res.json() : {});
      } catch {
        setCounterSummary({});
      }

      try {
        const res = await fetch(`/api/castle/hidden?guild=${encodeURIComponent(guild)}`);
        setHiddenCastles(new Set(res.ok ? await res.json() : []));
      } catch {
        setHiddenCastles(new Set());
      }

      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guild]);

  const filteredTeams = useMemo(
    () => allTeams.filter((t) => (group === "all" || t.castleGroup === group) && teamMatchesQuery(t, query)),
    [allTeams, group, query]
  );

  const visibleForMerge = useMemo(
    () => (includeHidden ? filteredTeams : filteredTeams.filter((t) => !hiddenCastles.has(t.castleId))),
    [filteredTeams, includeHidden, hiddenCastles]
  );

  async function toggleCastleHidden(castleId: string) {
    if (!guild) return;
    const next = new Set(hiddenCastles);
    if (next.has(castleId)) next.delete(castleId);
    else next.add(castleId);
    try {
      const res = await fetch("/api/castle/hidden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guild, hiddenCastles: [...next] }),
      });
      if (!res.ok) throw new Error();
      setHiddenCastles(next);
    } catch {
      show("บันทึกไม่สำเร็จ");
    }
  }

  if (!guild) return null;

  function TeamCard({ team, showCastle, dimmed }: { team: MergedTeam; showCastle: boolean; dimmed?: boolean }) {
    const summary = counterSummary[team.compKey];
    return (
      <div className={`team-card${dimmed ? " team-card--dimmed" : ""}`}>
        <div className="saved-team-card-top">
          <span className="saved-team-castle">{showCastle ? team.castleLabel : ""}</span>
          <span className="saved-team-num">จำนวน {team.count} ทีม</span>
        </div>
        <div className="saved-team-body">
          <div className="saved-team-heroes">{heroSlots(team.heroes)}</div>
          <div className="saved-team-divider" />
          <div className="saved-team-pets">{petsRow(team.pets)}</div>
        </div>
        <div className="card-footer">
          <div className="card-footer-badges">
            {!!summary?.published && <span className="team-card-counter-badge">🛡 {summary.published} ทีมตอบโต้</span>}
            {!!summary?.pending && <span className="team-card-pending-badge">⏳ {summary.pending} รออนุมัติ</span>}
          </div>
          {showCastle ? (
            <a
              className="counter-link-btn"
              href={`/counter?guild=${encodeURIComponent(guild!)}&comp=${encodeURIComponent(team.compKey)}&group=${group}`}
            >
              ทีมตอบโต้ที่แนะนำ ›
            </a>
          ) : (
            <button className="view-more-btn" type="button" onClick={() => setDetailTeam(team)}>
              ดูเพิ่ม ›
            </button>
          )}
        </div>
      </div>
    );
  }

  let content: React.ReactNode;
  let totalCount = 0;
  let showIncludeHiddenToggle = false;

  if (group === "all") {
    const merged = dedupTeamsByComposition(visibleForMerge);
    totalCount = merged.length;
    showIncludeHiddenToggle = hiddenCastles.size > 0;
    content = merged.map((t) => <TeamCard key={t.compKey} team={t} showCastle={false} />);
  } else {
    const groupCastles = CASTLES.filter((c) => c.group === group);
    const merged = groupCastles.length > 1 ? dedupTeamsByComposition(visibleForMerge) : [];
    showIncludeHiddenToggle = filteredTeams.some((t) => hiddenCastles.has(t.castleId));
    const groupLabel = GROUP_TABS.find((t) => t.id === group)?.label || "";

    const sections = groupCastles
      .map((castle) => {
        const castleTeams = dedupTeamsByComposition(filteredTeams.filter((t) => t.castleId === castle.id));
        return { castle, castleTeams };
      })
      .filter((s) => s.castleTeams.length > 0);

    totalCount = merged.length + sections.reduce((n, s) => n + s.castleTeams.length, 0);

    content = (
      <>
        {merged.length > 0 && (
          <div className="saved-team-merged-box">
            <div className="saved-team-merged-box-title">รวมทีมทั้งหมดของ{groupLabel}</div>
            <div className="saved-team-merged-box-grid">
              {merged.map((t) => (
                <TeamCard key={t.compKey} team={t} showCastle={false} />
              ))}
            </div>
          </div>
        )}
        {sections.map(({ castle, castleTeams }) => {
          const isHidden = hiddenCastles.has(castle.id);
          return (
            <div key={castle.id}>
              <div className={`palette-tier-header saved-team-section-header ${castleColorClass(castle.id)}${isHidden ? " saved-team-section-header--castle-hidden" : ""}`}>
                <span className="saved-team-section-header-label">
                  {castle.label}
                  {isHidden && <span className="castle-hidden-tag">ไม่เน้นตี</span>}
                </span>
                {canEditThisGuild && castle.id !== "main" && (
                  <button
                    className={`castle-hide-toggle${isHidden ? " active" : ""}`}
                    type="button"
                    title={isHidden ? "ไม่เน้นตีปราสาทนี้ — กดเพื่อยกเลิก" : "กดเพื่อทำเครื่องหมายว่าไม่เน้นตีปราสาทนี้"}
                    onClick={() => toggleCastleHidden(castle.id)}
                  >
                    {isHidden ? "🚫" : "👁️"}
                  </button>
                )}
              </div>
              {castleTeams.map((t) => (
                <TeamCard key={castle.id + t.compKey} team={t} showCastle dimmed={isHidden} />
              ))}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <main className="teams-main">
      {!ready && <div className="home-status">กำลังโหลดข้อมูล...</div>}
      {ready && (
        <div id="teamsContent">
          <div className="castle-page-head">
            <button className="btn" type="button" onClick={() => router.push(canEditThisGuild ? `/castle?guild=${encodeURIComponent(guild)}` : "/")}>
              {canEditThisGuild ? "← กลับไปเลือกปราสาท" : "← กลับหน้าหลัก"}
            </button>
            <div className="castle-page-title">
              ทีมที่บันทึกแล้ว — <span className="castle-guild-name">{guild}</span>
            </div>
            <span className="castle-head-spacer btn" aria-hidden="true">
              {canEditThisGuild ? "← กลับไปเลือกปราสาท" : "← กลับหน้าหลัก"}
            </span>
          </div>

          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input placeholder="ค้นหาทีม... เช่น ชื่อตัวละครในทีม" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="palette-tabs">
            {GROUP_TABS.map((t) => (
              <button key={t.id} className={`palette-tab${group === t.id ? " active" : ""}`} type="button" onClick={() => setGroup(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="filter-row">
            <span className="filter-count">ทั้งหมด {totalCount} รายการ</span>
            {showIncludeHiddenToggle && (
              <label className="include-hidden-toggle">
                <span className="toggle-switch">
                  <input type="checkbox" checked={includeHidden} onChange={(e) => setIncludeHidden(e.target.checked)} />
                  <span className="toggle-switch-track" />
                </span>
                แสดงปราสาทที่ไม่เน้นตีด้วย
              </label>
            )}
          </div>

          {totalCount === 0 ? (
            <div className="empty-state">ไม่พบทีมที่ตรงกับเงื่อนไข</div>
          ) : (
            <div className="team-grid saved-team-grid">{content}</div>
          )}
        </div>
      )}

      <div className={`modal-overlay${detailTeam ? " open" : ""}`} onClick={() => setDetailTeam(null)}>
        {detailTeam && (
          <div className="modal-box team-detail-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <b>ทีมนี้อยู่ปราสาทไหนบ้าง</b>
              <button className="dp-close-btn" type="button" onClick={() => setDetailTeam(null)}>
                ×
              </button>
            </div>
            <div className="saved-team-body team-detail-preview">
              <div className="saved-team-heroes">{heroSlots(detailTeam.heroes)}</div>
              <div className="saved-team-divider" />
              <div className="saved-team-pets">{petsRow(detailTeam.pets)}</div>
            </div>
            <div>
              {detailTeam.castleBreakdown
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((c) => (
                  <div className="team-detail-row" key={c.castleId}>
                    <span>{c.castleLabel}</span>
                    <span className="team-detail-count">{c.count} ทีม</span>
                  </div>
                ))}
            </div>
            <a
              className="btn btn-primary team-detail-counter-link"
              href={`/counter?guild=${encodeURIComponent(guild)}&comp=${encodeURIComponent(detailTeam.compKey)}&group=${group}`}
            >
              ทีมตอบโต้ที่แนะนำ ›
            </a>
          </div>
        )}
      </div>

      {toastEl}
    </main>
  );
}

export default function TeamsPage() {
  return (
    <Suspense>
      <TeamsPageInner />
    </Suspense>
  );
}
