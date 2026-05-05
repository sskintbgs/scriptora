import { EmbedBuilder } from 'discord.js';

const PURPLE = 0x9B59B6;
const RED    = 0xE74C3C;
const GREEN  = 0x2ECC71;
const YELLOW = 0xF1C40F;
const ORANGE = 0xE67E22;

export function successEmbed(title, description) {
  return new EmbedBuilder().setColor(GREEN).setTitle(`✅ ${title}`).setDescription(description).setTimestamp();
}

export function errorEmbed(description) {
  return new EmbedBuilder().setColor(RED).setDescription(`❌ ${description}`).setTimestamp();
}

export function infoEmbed(title, description) {
  return new EmbedBuilder().setColor(PURPLE).setTitle(title).setDescription(description).setTimestamp();
}

export function warnEmbed(title, description) {
  return new EmbedBuilder().setColor(YELLOW).setTitle(`⚠️ ${title}`).setDescription(description).setTimestamp();
}

export function modEmbed({ action, emoji, color, target, moderator, reason, extra = [] }) {
  const embed = new EmbedBuilder()
    .setColor(color || PURPLE)
    .setTitle(`${emoji} ${action}`)
    .setThumbnail(target?.user?.displayAvatarURL({ dynamic: true }) || null)
    .addFields(
      { name: '👤 User', value: `${target?.user?.tag || target?.tag || 'Unknown'}\n\`${target?.id || target?.user?.id || '?'}\``, inline: true },
      { name: '🛡️ Moderator', value: `${moderator?.tag || moderator || 'System'}`, inline: true },
      { name: '📋 Reason', value: reason || 'No reason provided' },
      ...extra
    )
    .setFooter({ text: 'Scriptora Moderation' })
    .setTimestamp();
  return embed;
}

export function dmEmbed({ title, description, color, guild }) {
  return new EmbedBuilder()
    .setColor(color || PURPLE)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: `${guild?.name || 'Scriptora'} • Moderation System` })
    .setTimestamp();
}

export { PURPLE, RED, GREEN, YELLOW, ORANGE };
