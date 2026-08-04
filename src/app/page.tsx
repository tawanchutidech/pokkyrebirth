"use client";

import { useRouter } from "next/navigation";
import { GUILDS, canEditGuild, canViewGuild, getLocalDevUser, type Guild } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const user = getLocalDevUser();

  const goToGuild = (guild: Guild) => {
    const dest = canEditGuild(user, guild) ? "/hero-tier-list" : "/teams";
    router.push(`${dest}?guild=${encodeURIComponent(guild)}`);
  };

  return (
    <main className="home-main">
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
      </section>
    </main>
  );
}
