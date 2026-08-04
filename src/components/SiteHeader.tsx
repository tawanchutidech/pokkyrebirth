"use client";

import { getLocalDevUser, isGuildMember, isAdmin } from "@/lib/auth";

export default function SiteHeader() {
  const user = getLocalDevUser();
  const member = isGuildMember(user);
  const admin = isAdmin(user);

  return (
    <header className="site-header">
      <div className="brand">
        <img src="/public/images/Logo.webp" alt="logo" />
        <span className="brand-title">TDERM Guild War Hub</span>
      </div>
      <div className="header-actions">
        {member && (
          <span className="user-display-label">{user.displayName}</span>
        )}
        {member && (
          <a className="icon-btn" href="/ranking" title="อันดับผู้ใช้งาน">
            🏆
          </a>
        )}
        {admin && (
          <a className="icon-btn" href="/tools" title="Admin Tools">
            🔧
          </a>
        )}
      </div>
    </header>
  );
}
