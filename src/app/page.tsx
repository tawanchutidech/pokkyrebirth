"use client";

import { useRouter } from "next/navigation";
import { GUILDS, canEditGuild, canViewGuild, getLocalDevUser, type Guild } from "@/lib/auth";
import { AnnouncementToggle, MaintenanceToggle } from "@/components/OwnerToggles";

export default function HomePage() {
  const router = useRouter();
  const user = getLocalDevUser();

  const goToGuild = (guild: Guild) => {
    const dest = canEditGuild(user, guild) ? "/hero-tier-list" : "/teams";
    router.push(`${dest}?guild=${encodeURIComponent(guild)}`);
  };

  return (
    <main className="home-main">
      {user.isAdminById && (
        <>
          <MaintenanceToggle />
          <AnnouncementToggle />
        </>
      )}
      <section className="guild-picker">
        <p className="guild-picker-sub">
          สวัสดี, <span>{user.displayName}</span>
        </p>
        <div className="guild-picker-title">เลือกกิลด์ที่ต้องการจัดการ</div>
        <div className="guild-grid">
          {GUILDS.filter((g) => canViewGuild(user, g)).map((guild) => (
            <button
              key={guild}
              className="guild-card"
              type="button"
              onClick={() => goToGuild(guild)}
            >
              <span className="guild-card-name">{guild}</span>
            </button>
          ))}
        </div>
        <button className="btn" type="button" style={{ marginTop: 16 }} onClick={() => router.push("/imported-teams")}>
          ทีมที่นำเข้า (PokkyRebirth) ›
        </button>
      </section>
    </main>
  );
}
