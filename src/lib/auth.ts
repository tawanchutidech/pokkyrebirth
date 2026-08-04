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
