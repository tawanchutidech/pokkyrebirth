export const GUILDS = ["LEGENDS", "เสือหนิก", "หนิกเสือ"] as const;
export type Guild = (typeof GUILDS)[number];

export type SessionUser = {
  loggedIn: true;
  userId: string;
  displayName: string;
  isSuperAdmin: boolean;
  isAdminById: boolean; // the one true owner (site-wide maintenance/announcement toggles)
  guildAdminRoles: Guild[]; // guilds this user can edit
  guildMemberRoles: Guild[]; // guilds this user can view
  isCodeLogin: boolean; // shared guild code, no personal identity -> can't vote/save under own name
};

// DEV-ONLY BYPASS: this project has no real Discord OAuth wired up yet
// (see Phase 6 of the rewrite plan — needs real secrets only the site owner
// has). Every page reads the "logged-in user" through this one function so
// swapping in real auth later is a one-file change.
export function getLocalDevUser(): SessionUser {
  return {
    loggedIn: true,
    userId: "local-dev",
    displayName: "Local Admin",
    isSuperAdmin: true,
    isAdminById: true,
    guildAdminRoles: [...GUILDS],
    guildMemberRoles: [...GUILDS],
    isCodeLogin: false,
  };
}

export function isAdmin(user: SessionUser | null): boolean {
  return !!user && (user.isSuperAdmin || user.guildAdminRoles.length > 0);
}

export function isGuildMember(user: SessionUser | null): boolean {
  return !!user && (isAdmin(user) || user.guildMemberRoles.length > 0);
}

export function canEditGuild(user: SessionUser | null, guild: Guild): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.guildAdminRoles.includes(guild);
}

export function canViewGuild(user: SessionUser | null, guild: Guild): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.guildAdminRoles.includes(guild) || user.guildMemberRoles.includes(guild);
}

// Salt used to derive the daily rotating guild code. In production this
// must stay byte-identical to the server-side copy (functions/auth/code-
// login.js) or logins silently break — not applicable yet since there's no
// real backend wired up (see Phase 6).
const GUILD_SALT = "7k_IcOnYx_LgNd";

export function getGuildDailyCode(guild: string, offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  const input = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}|${guild}|${GUILD_SALT}`;
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return String((h % 900000) + 100000);
}
