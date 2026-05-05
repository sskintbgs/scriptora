import { getConfig } from './config.js';

/**
 * Check if a Discord user ID is a bot owner (immune to rob/duel etc.)
 */
export function isOwnerDiscordId(userId) {
  const cfg = getConfig();
  const ids = cfg.OWNER_DISCORD_IDS || [];
  // Also check legacy single OWNER_ID field
  if (cfg.OWNER_DISCORD_ID) ids.push(cfg.OWNER_DISCORD_ID);
  return ids.includes(String(userId));
}

/**
 * Check if a member has a required permission level
 */
export function hasPermission(member, permission) {
  if (!member) return false;
  const cfg = getConfig();
  const allowedRoles = cfg.permissions?.[permission] || [];
  return member.roles.cache.some(r => allowedRoles.includes(r.name));
}
