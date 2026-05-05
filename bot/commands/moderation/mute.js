import { SlashCommandBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { getConfig } from '../../utils/config.js';
import { modEmbed, dmEmbed, errorEmbed } from '../../utils/embeds.js';

const DURATIONS = {
  '60s': { ms: 60000, label: '1 minute' },
  '5m':  { ms: 300000, label: '5 minutes' },
  '10m': { ms: 600000, label: '10 minutes' },
  '30m': { ms: 1800000, label: '30 minutes' },
  '1h':  { ms: 3600000, label: '1 hour' },
  '6h':  { ms: 21600000, label: '6 hours' },
  '12h': { ms: 43200000, label: '12 hours' },
  '1d':  { ms: 86400000, label: '1 day' },
  '7d':  { ms: 604800000, label: '7 days' },
};

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout (mute) a member')
    .addUserOption(o => o.setName('user').setDescription('Member to mute').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration of timeout').setRequired(true)
      .addChoices(
        { name: '1 Minute', value: '60s' }, { name: '5 Minutes', value: '5m' },
        { name: '10 Minutes', value: '10m' }, { name: '30 Minutes', value: '30m' },
        { name: '1 Hour', value: '1h' }, { name: '6 Hours', value: '6h' },
        { name: '12 Hours', value: '12h' }, { name: '1 Day', value: '1d' },
        { name: '7 Days', value: '7d' },
      ))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'mute'))
      return interaction.reply({ embeds: [errorEmbed('You need **Moderator** or above to mute members.')], ephemeral: true });

    const target = interaction.options.getMember('user');
    const durationKey = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const cfg = getConfig();
    const dur = DURATIONS[durationKey];

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found.')], ephemeral: true });
    if (!target.moderatable) return interaction.reply({ embeds: [errorEmbed('I cannot timeout this user.')], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('You cannot mute yourself.')], ephemeral: true });

    await target.send({
      embeds: [dmEmbed({
        title: `🔇 You were timed out in ${interaction.guild.name}`,
        description: `**Reason:** ${reason}\n**Duration:** ${dur.label}\n**Moderator:** ${interaction.user.tag}`,
        color: 0xF1C40F,
        guild: interaction.guild,
      })]
    }).catch(() => {});

    await target.timeout(dur.ms, reason);

    const embed = modEmbed({
      action: 'Member Muted (Timeout)', emoji: '🔇', color: 0xF1C40F,
      target, moderator: interaction.user, reason,
      extra: [{ name: '⏱️ Duration', value: dur.label, inline: true }],
    });

    await interaction.reply({ embeds: [embed] });
    if (cfg.channels.logs) {
      const ch = interaction.guild.channels.cache.get(cfg.channels.logs);
      if (ch) await ch.send({ embeds: [embed] });
    }
  }
};
