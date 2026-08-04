"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HEROES,
  HERO_TIERS,
  ELEMENTS,
  heroMatchesQuery,
  type ElementId,
  type Hero,
} from "@/data/heroes";
import { canEditGuild, getLocalDevUser, type Guild } from "@/lib/auth";
import { HeroChip, ElementFilterRow } from "@/components/HeroChip";
import { useToast } from "@/components/Toast";

const ELEMENT_ICON: Record<ElementId, string> = {
  light: "/public/element/Light.webp",
  fire: "/public/element/Fire.webp",
  dark: "/public/element/Dark.webp",
  water: "/public/element/Water.webp",
  ground: "/public/element/Ground.webp",
};

function HeroTierListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guild = searchParams.get("guild") as Guild | null;
  const user = getLocalDevUser();
  const { show, toastEl } = useToast();

  const [hotState, setHotState] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [elementFilter, setElementFilter] = useState<ElementId | null>(null);
  const [loading, setLoading] = useState(true);

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
      try {
        const res = await fetch(`/api/hero-tier-list?guild=${encodeURIComponent(guild)}`);
        if (res.ok) {
          const data: { hot: string[] } = await res.json();
          const next: Record<string, boolean> = {};
          data.hot.forEach((id) => (next[id] = true));
          setHotState(next);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guild]);

  const hotHeroes = useMemo(
    () => Object.keys(hotState).map((id) => HEROES.find((h) => h.id === id)).filter(Boolean) as Hero[],
    [hotState]
  );

  const libraryByTier = useMemo(() => {
    const available = HEROES.filter(
      (h) => !hotState[h.id] && heroMatchesQuery(h, query) && (!elementFilter || h.element === elementFilter)
    );
    return HERO_TIERS.map((t) => ({
      tier: t,
      heroes: available.filter((h) => h.tier === t.tier),
    })).filter((g) => g.heroes.length > 0);
  }, [hotState, query, elementFilter]);

  async function setHot(heroId: string, hot: boolean) {
    const prev = hotState;
    setHotState((s) => {
      const next = { ...s };
      if (hot) next[heroId] = true;
      else delete next[heroId];
      return next;
    });

    try {
      const res = await fetch("/api/hero-tier-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guild, heroId, hot }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setHotState(prev);
      show("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  }

  if (!guild) return null;

  return (
    <main className="hero-tier-main">
      <div id="tierListContent" style={{ display: loading ? "none" : "block" }}>
        <div className="page-topbar">
          <button type="button" className="btn" onClick={() => router.push("/")}>
            ← เปลี่ยนกิลด์
          </button>
          <div className="page-topbar-title">กิลด์ {guild} — จัดอันดับตัวละคร Hot</div>
          <a className="btn btn-primary" href={`/castle?guild=${encodeURIComponent(guild)}`}>
            ต่อไปที่หน้าปราสาท →
          </a>
        </div>

        <p className="hero-tier-hint">
          ลากหรือกดตัวละครจากคลังด้านล่าง เพื่อใส่ช่อง HOT — ตัวละครที่ใส่ไว้จะขึ้นเป็นเกรด HOT
          อยู่บนสุดในหน้าจัดทีมปราสาท/ทีมตอบโต้ (มีผลทั้งกิลด์) กดที่ตัวละครในช่องเพื่อเอาออก
        </p>

        <div className="hero-tier-hot-label">HOT</div>
        <div className="hero-tier-grid">
          {hotHeroes.map((h) => (
            <HeroChip key={h.id} hero={h} placed className="hero-chip hero-tier-chip" onClick={() => setHot(h.id, false)} />
          ))}
        </div>

        <div className="hero-tier-library-title">คลังตัวละคร — กดเพื่อใส่ช่อง HOT</div>
        <div className="search-bar">
          <span>🔍</span>
          <input
            placeholder="ค้นหาตัวละคร..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ElementFilterRow
          elements={ELEMENTS.map((e) => ({ id: e.id, label: e.label, icon: ELEMENT_ICON[e.id] }))}
          active={elementFilter}
          onToggle={(id) => setElementFilter((cur) => (cur === id ? null : (id as ElementId)))}
        />
        <div className="hero-grid hero-tier-library-grid">
          {libraryByTier.map(({ tier, heroes }) => (
            <div key={tier.tier} style={{ display: "contents" }}>
              <div className={`palette-tier-header palette-tier-${tier.tier}`}>{tier.label}</div>
              {heroes.map((h) => (
                <HeroChip key={h.id} hero={h} placed={false} onClick={() => setHot(h.id, true)} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {toastEl}
    </main>
  );
}

export default function HeroTierListPage() {
  return (
    <Suspense>
      <HeroTierListInner />
    </Suspense>
  );
}
