import { SlashCommandBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { getConfig } from '../../utils/config.js';
import { modEmbed, dmEmbed, errorEmbed } from '../../utils/embeds.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WARNS_PATH = path.join(__dirname, '..', '..', 'warns.json');

function getWarns() {
  if (!existsSync(WARNS_PATH)) return {};
  try { return JSON.parse(readFileSync(WARNS_PATH, 'utf8')); } catch { return {}; }
}
function saveWarns(data) { writeFileSync(WARNS_PATH, JSON.stringify(data, null, 2)); }

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a warning to a member')
    .addUserOption(o => o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'warn'))
      return interaction.reply({ embeds: [errorEmbed('You need **Support** or above to warn members.')], ephemeral: true });

    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');
    const cfg = getConfig();

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found in server.')], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('You cannot warn yourself.')], ephemeral: true });

    const warns = getWarns();
    if (!warns[target.id]) warns[target.id] = [];
    warns[target.id].push({
      id: Date.now().toString(),
      reason,
      moderator: interaction.user.tag,
      moderatorId: interaction.user.id,
      date: new Date().toISOString(),
    });
    saveWarns(warns);

    const warnCount = warns[target.id].length;

    // DM the target
    await target.send({
      embeds: [dmEmbed({
        title: `⚠️ You received a warning in ${interaction.guild.name}`,
        description: `**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}\n**Total Warnings:** ${warnCount}\n\n*Please review the server rules to avoid further action.*`,
        color: 0xF1C40F,
        guild: interaction.guild,
      })]
    }).catch(() => {});

    const embed = modEmbed({
      action: 'Member Warned', emoji: '⚠️', color: 0xF1C40F,
      target, moderator: interaction.user, reason,
      extra: [{ name: '📊 Total Warnings', value: `${warnCount}`, inline: true }],
    });

    await interaction.reply({ embeds: [embed] });

    if (cfg.channels.logs) {
      const ch = interaction.guild.channels.cache.get(cfg.channels.logs);
      if (ch) await ch.send({ embeds: [embed] });
    }
  }
};
