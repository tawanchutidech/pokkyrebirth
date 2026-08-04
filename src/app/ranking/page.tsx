"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getLocalDevUser, isGuildMember } from "@/lib/auth";
import { computeProgress, GUILD_BADGE_CLASS, TIER_FRAME, TIER_NAMES, type RankingLogEntry, type RankingUser } from "@/data/ranking";
import { useToast } from "@/components/Toast";

const LOG_PREVIEW_COUNT = 10;

function GuildBadge({ guild, isOwner }: { guild: string | null; isOwner: boolean }) {
  if (isOwner || !guild) return null;
  const cls = GUILD_BADGE_CLASS[guild as keyof typeof GUILD_BADGE_CLASS];
  if (!cls) return null;
  return <span className={`badge-guild-tag ${cls}`}>{guild}</span>;
}

function fmtLogTime(ts: number) {
  return new Date(ts).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function RankingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const user = getLocalDevUser();
  const { show, toastEl } = useToast();

  const [ready, setReady] = useState(false);
  const [list, setList] = useState<RankingUser[]>([]);
  const [log, setLog] = useState<RankingLogEntry[]>([]);
  const [logExpanded, setLogExpanded] = useState(false);

  useEffect(() => {
    if (!isGuildMember(user)) {
      show("ต้องเป็นสมาชิกกิลด์เท่านั้น");
      router.replace("/");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/ranking/data?userId=${encodeURIComponent(user.userId)}`);
        setList(res.ok ? await res.json() : []);
      } catch {
        setList([]);
      }
      try {
        const res = await fetch("/api/ranking/log");
        setLog(res.ok ? await res.json() : []);
      } catch {
        setLog([]);
      }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mine = list.find((u) => u.userId === user.userId);
  const isOwner = user.isAdminById;
  const myTier = isOwner ? 1 : mine ? mine.tier : 9;
  const myPoints = mine ? mine.points : 0;
  const myProgress = isOwner ? null : computeProgress(myPoints, myTier);
  const myFrame = TIER_FRAME[myTier] || TIER_FRAME[9];

  const shownLog = logExpanded ? log : log.slice(0, LOG_PREVIEW_COUNT);

  return (
    <main className="ranking-main">
      {!ready && <div className="home-status">กำลังโหลดข้อมูล...</div>}
      {ready && (
        <div id="rankingContent">
          <div className="castle-page-head">
            <button className="btn" type="button" onClick={() => router.push(from || "/")}>
              ← กลับ
            </button>
            <div className="castle-page-title">อันดับผู้ใช้งาน</div>
            <span className="castle-head-spacer btn" aria-hidden="true">
              ← กลับ
            </span>
          </div>

          <div
            className="my-progress-card"
            style={{ "--frame-color": myFrame.color, "--frame-glow": myFrame.glow } as React.CSSProperties}
          >
            <img className="my-progress-badge" src={`/public/ranking/ArenaElite_0${myTier}.webp`} alt={TIER_NAMES[myTier]} />
            <div className="my-progress-info">
              <div className="my-progress-title">
                ความคืบหน้าของคุณ — {TIER_NAMES[myTier]} <GuildBadge guild={mine?.guild ?? null} isOwner={isOwner} />
              </div>
              <div className="my-progress-points">{myPoints.toLocaleString("th-TH")} แต้ม</div>
              {myProgress ? (
                <>
                  <div className="my-progress-bar">
                    <div className="my-progress-bar-fill" style={{ width: `${myProgress.pct}%` }} />
                  </div>
                  <div className="my-progress-remaining">
                    อีก {myProgress.remaining.toLocaleString("th-TH")} แต้ม ถึง {TIER_NAMES[myProgress.nextTier]}
                  </div>
                </>
              ) : (
                <div className="my-progress-remaining">{isOwner ? "แรงค์สูงสุดตลอดกาล 👑" : "🏆 ถึงแรงค์สูงสุดแล้ว!"}</div>
              )}
            </div>
          </div>

          {log.length > 0 && (
            <div className="my-log-section">
              <div className="my-log-title">ประวัติแต้มของคุณ</div>
              <div className="my-log-list">
                {shownLog.map((entry, i) => (
                  <div className="my-log-row" key={i}>
                    <span className="my-log-delta">+{entry.delta}</span>
                    <span className="my-log-reason">{entry.reason}</span>
                    <span className="my-log-time">{fmtLogTime(entry.at)}</span>
                  </div>
                ))}
              </div>
              {log.length > LOG_PREVIEW_COUNT && (
                <button className="btn" type="button" onClick={() => setLogExpanded((v) => !v)}>
                  {logExpanded ? "ย่อ" : `ดูทั้งหมด (${log.length})`}
                </button>
              )}
            </div>
          )}

          <p className="ranking-explain hint">
            ได้แต้มจาก: เพิ่มทีมตอบโต้แล้วได้รับอนุมัติ (+10) · โหวตทีมตอบโต้ครั้งแรก (+1) ·
            มีคนกด 👍 ทีมที่สร้าง (+2 ต่อคน) — เฉพาะผู้ที่ Login ด้วย Discord เท่านั้นที่มีแรงค์
          </p>

          {list.length === 0 ? (
            <div className="empty-state">ยังไม่มีใครทำแต้มเลย</div>
          ) : (
            <div className="ranking-list">
              {list.map((u, i) => {
                const isMine = !u.isOwner && u.userId === user.userId;
                const frame = TIER_FRAME[u.tier] || TIER_FRAME[9];
                return (
                  <div
                    key={u.userId}
                    className={`ranking-row${u.isOwner ? " ranking-row--owner" : ""}${isMine ? " ranking-row--mine" : ""}`}
                    style={isMine ? ({ "--frame-color": frame.color, "--frame-glow": frame.glow } as React.CSSProperties) : undefined}
                  >
                    {u.selectedCharacter && (
                      <img className="ranking-row-side-char" src={`/public/ranking-collection/${u.selectedCharacter}.webp`} alt="" />
                    )}
                    <div className="ranking-place">#{i + 1}</div>
                    <img className="ranking-badge" src={`/public/ranking/ArenaElite_0${u.tier}.webp`} alt={TIER_NAMES[u.tier]} />
                    <div className="ranking-name">
                      {u.displayName}
                      {u.isOwner && <span className="badge-first-pick">เจ้าของเว็บ</span>}
                      <GuildBadge guild={u.guild} isOwner={u.isOwner} />
                    </div>
                    <div className="ranking-tier">{TIER_NAMES[u.tier]}</div>
                    <div className="ranking-points">{u.points.toLocaleString("th-TH")} แต้ม</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {toastEl}
    </main>
  );
}

export default function RankingPage() {
  return (
    <Suspense>
      <RankingPageInner />
    </Suspense>
  );
}
