"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

export function MaintenanceToggle() {
  const { show, toastEl } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/maintenance", { cache: "no-store" });
    if (res.ok) setEnabled((await res.json()).enabled);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (!res.ok) throw new Error();
      show(!enabled ? "ปิดเว็บแล้ว (โหมดปรับปรุง)" : "เปิดเว็บกลับมาใช้งานปกติแล้ว");
      await refresh();
    } catch {
      show("เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="maintenance-toggle">
      <span className="maintenance-toggle-label">โหมดปรับปรุงเว็บ</span>
      <span className="maintenance-toggle-status">{enabled ? "ตอนนี้: ปิดเว็บอยู่ (บล็อกทุกคนยกเว้นคุณ)" : "ตอนนี้: เว็บเปิดใช้งานปกติ"}</span>
      <button className={`btn btn-primary${enabled ? "" : " btn-danger"}`} type="button" disabled={busy} onClick={toggle}>
        {enabled ? "ปิดโหมดปรับปรุง" : "เปิดโหมดปรับปรุง"}
      </button>
      {toastEl}
    </div>
  );
}

export function AnnouncementToggle() {
  const { show, toastEl } = useToast();
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/announcement", { cache: "no-store" });
    if (res.ok) setUpdatedAt((await res.json()).updatedAt);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function bump() {
    setBusy(true);
    try {
      const res = await fetch("/api/announcement", { method: "POST" });
      if (!res.ok) throw new Error();
      show("ประกาศอัปเดตใหม่แล้ว — ไอคอนที่มาสคอตจะขึ้นจุดแดงให้ทุกคนเห็น");
      await refresh();
    } catch {
      show("ประกาศไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="maintenance-toggle">
      <span className="maintenance-toggle-label">ประกาศอัปเดตเว็บ</span>
      <span className="maintenance-toggle-status">{updatedAt ? `ประกาศล่าสุด: ${new Date(updatedAt).toLocaleString("th-TH")}` : "ยังไม่เคยประกาศ"}</span>
      <button className="btn btn-primary" type="button" disabled={busy} onClick={bump}>
        📢 ประกาศอัปเดตใหม่
      </button>
      {toastEl}
    </div>
  );
}
