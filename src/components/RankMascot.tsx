"use client";

import { useEffect, useState } from "react";
import { getLocalDevUser } from "@/lib/auth";
import {
  ANNOUNCEMENT_SEEN_KEY,
  ANNOUNCEMENT_URL,
  DEFAULT_CHARACTER,
  TIER_FRAME,
  TIER_NAMES,
  unlockedCharacters,
} from "@/data/ranking";

// Site-wide floating rank mascot (bottom-right). Ported from js/mascot.js;
// the original's 30s "who just earned points" poll + speech-bubble
// notifications are dropped here since there's no real point-awarding
// system yet (see the /api/ranking scope note) — nothing would ever fire.
export default function RankMascot() {
  const user = getLocalDevUser();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState(9);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [announcementUpdatedAt, setAnnouncementUpdatedAt] = useState<number | null>(null);
  const [announcementRead, setAnnouncementRead] = useState(false);

  // Same "can this identity actually earn points" rule as the rest of the
  // app — a plain guild-member code login has no personal rank to show.
  // Checked inside the effects (not as an early return before them) so
  // hook call order stays identical across renders.
  const eligible = !user.isCodeLogin || user.isSuperAdmin;

  useEffect(() => {
    if (!eligible) return;
    (async () => {
      try {
        const res = await fetch(`/api/ranking/data?userId=${encodeURIComponent(user.userId)}`);
        if (!res.ok) return;
        const list: { userId: string; tier: number; selectedCharacter: string | null }[] = await res.json();
        const mine = list.find((u) => u.userId === user.userId);
        setTier(user.isAdminById ? 1 : mine ? mine.tier : 9);
        setSelectedCharacter(mine?.selectedCharacter ?? null);
      } catch {
        /* ignore */
      } finally {
        setReady(true);
      }
    })();

    (async () => {
      try {
        const res = await fetch("/api/announcement");
        if (!res.ok) return;
        const { updatedAt } = await res.json();
        if (!updatedAt) return;
        setAnnouncementUpdatedAt(updatedAt);
        const seen = Number(localStorage.getItem(ANNOUNCEMENT_SEEN_KEY) || 0);
        setAnnouncementRead(updatedAt <= seen);
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(".rank-mascot")) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  async function selectCharacter(name: string, isAlreadySelected: boolean) {
    const character = isAlreadySelected ? null : name;
    try {
      const res = await fetch("/api/ranking/select-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character, userId: user.userId }),
      });
      if (!res.ok) return;
      setSelectedCharacter(character);
    } catch {
      /* ignore */
    }
  }

  function openAnnouncement() {
    if (!announcementUpdatedAt) return;
    localStorage.setItem(ANNOUNCEMENT_SEEN_KEY, String(announcementUpdatedAt));
    setAnnouncementRead(true);
    window.open(ANNOUNCEMENT_URL, "_blank", "noopener");
  }

  if (!eligible) return null;

  const frame = TIER_FRAME[tier] || TIER_FRAME[9];
  const auraT = (9 - tier) / 8; // 0 at tier 9, 1 at tier 1
  const character = selectedCharacter || DEFAULT_CHARACTER;

  return (
    <div
      className={`rank-mascot${ready ? " ready" : ""}${open ? " open" : ""}`}
      style={
        {
          "--frame-color": frame.color,
          "--frame-glow": frame.glow,
          "--aura-opacity": (0.22 + auraT * 0.5).toFixed(2),
          "--aura-scale": (1 + auraT * 0.7).toFixed(2),
        } as React.CSSProperties
      }
    >
      <div className="rank-mascot-speech" />
      <div className="rank-mascot-popover">
        <div className="rank-mascot-popover-title">เลือกตัวโปรด</div>
        <div className="my-collection-grid">
          {unlockedCharacters(tier).map((n) => (
            <button
              key={n}
              type="button"
              className={`my-collection-item${n === selectedCharacter ? " my-collection-item--selected" : ""}`}
              onClick={() => selectCharacter(n, n === selectedCharacter)}
            >
              <img src={`/public/ranking-collection/${n}.webp`} alt={n} />
            </button>
          ))}
        </div>
      </div>
      {announcementUpdatedAt && (
        <button className={`rank-announcement-btn${announcementRead ? " read" : ""}`} type="button" title="ประกาศอัปเดตเว็บ" onClick={openAnnouncement}>
          <span className="rank-announcement-icon">📢</span>
          <span className="rank-announcement-text">มีอัปเดตใหม่ของเว็บ กดตรงนี้เพื่ออ่าน!</span>
        </button>
      )}
      <button
        className="rank-mascot-btn"
        type="button"
        aria-label="เลือกตัวละครที่แสดง"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <img className="rank-mascot-bg" src={`/public/ranking/ArenaElite_0${tier}.webp`} alt="" />
        <img className="rank-mascot-char" src={`/public/ranking-collection/${character}.webp`} alt={TIER_NAMES[tier]} />
      </button>
    </div>
  );
}
