"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GUILDS, getGuildDailyCode, getLocalDevUser, isAdmin, type Guild } from "@/lib/auth";
import { useToast } from "@/components/Toast";

function visibleGuilds(user: ReturnType<typeof getLocalDevUser>): Guild[] {
  if (user.isSuperAdmin) return [...GUILDS];
  return user.guildAdminRoles;
}

function GuildCodeCard({ guild, onLineMessage }: { guild: Guild; onLineMessage: (msg: string) => void }) {
  const { show } = useToast();
  const days = [0, 1].map((i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const code = getGuildDailyCode(guild, i);
    return {
      label: i === 0 ? "วันนี้" : "พรุ่งนี้",
      date: d.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      code,
      isToday: i === 0,
    };
  });
  const today = days[0];

  function copyToday() {
    navigator.clipboard.writeText(today.code).then(() => show("คัดลอกรหัสแล้ว"));
  }

  function lineMessage() {
    const dateStr = new Date().toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    onLineMessage(
      `🛡️ TDERM Guild War Hub — กิลด์ ${guild}\n` +
        `📅 ${dateStr}\n` +
        `🔑 รหัสสมาชิก: ${today.code}\n\n` +
        `นำรหัสนี้ไปกรอกที่หน้าเว็บเพื่อเข้าดูทีมที่แนะนำ\n` +
        `⚠️ รหัสนี้ใช้ได้เฉพาะวันนี้เท่านั้น`
    );
  }

  return (
    <div className="tools-card">
      <div className="tools-card-title">🗓️ รหัสสมาชิกประจำวัน — {guild}</div>
      <div className="tools-today">
        <div className="tools-today-date">{today.date}</div>
        <div className="tools-today-code">{today.code}</div>
        <div className="tools-today-actions">
          <button className="btn btn-primary" type="button" onClick={copyToday}>
            📋 คัดลอกรหัส
          </button>
          <button className="btn" type="button" onClick={lineMessage}>
            💬 สร้างข้อความ LINE
          </button>
        </div>
      </div>
      <table className="tools-code-table">
        <thead>
          <tr>
            <th>วัน</th>
            <th>วันที่</th>
            <th>รหัส</th>
          </tr>
        </thead>
        <tbody>
          {days.map((r) => (
            <tr key={r.label} className={r.isToday ? "tools-row-today" : ""}>
              <td>{r.label}</td>
              <td>{r.date}</td>
              <td className="tools-code-cell">
                {r.isToday ? r.code : (
                  <>
                    {r.code.slice(0, -4)}
                    <span className="code-masked">XXXX</span>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ToolsPage() {
  const router = useRouter();
  const user = getLocalDevUser();
  const { toastEl, show } = useToast();
  const [ready, setReady] = useState(false);
  const [lineText, setLineText] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin(user)) {
      router.replace("/");
      return;
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;

  const guilds = visibleGuilds(user);

  return (
    <main className="tools-main">
      <div className="tools-page">
        <button className="detail-back-btn" type="button" onClick={() => router.push("/")}>
          ← กลับ
        </button>
        <h2 className="tools-title">🔧 Admin Tools</h2>

        {guilds.map((g) => (
          <GuildCodeCard key={g} guild={g} onLineMessage={setLineText} />
        ))}

        <div className="tools-card">
          <div className="tools-card-title">ℹ️ วิธีการใช้งาน</div>
          <p className="hint">
            รหัสประจำวันถูกสร้างจาก <b>วันที่ + ชื่อกิลด์ + Salt</b> ที่อยู่ในโค้ดเว็บ
            รหัสจะเปลี่ยนอัตโนมัติทุกเที่ยงคืน แยกรหัสตามกิลด์ ส่งรหัสวันนี้ให้สมาชิกกิลด์นั้นๆ ทุกวันผ่าน LINE
          </p>
          <p className="hint">สมาชิกนำรหัสไปกรอกที่ปุ่ม &quot;กรอกรหัสสมาชิก&quot; ในหน้าแรกของเว็บ จะเห็นได้แค่กิลด์ของตัวเอง แบบดูอย่างเดียว</p>
        </div>
      </div>

      <div className={`modal-overlay${lineText ? " open" : ""}`} onClick={() => setLineText(null)}>
        {lineText && (
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <b>ข้อความ LINE</b>
              <button className="dp-close-btn" type="button" onClick={() => setLineText(null)}>
                ×
              </button>
            </div>
            <p style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{lineText}</p>
            <div className="btn-group" style={{ justifyContent: "flex-end", marginTop: 18 }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => navigator.clipboard.writeText(lineText).then(() => show("คัดลอกข้อความแล้ว"))}
              >
                คัดลอก
              </button>
            </div>
          </div>
        )}
      </div>
      {toastEl}
    </main>
  );
}
