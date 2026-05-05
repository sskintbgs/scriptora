import { SlashCommandBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { getConfig } from '../../utils/config.js';
import { modEmbed, dmEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(o => o.setName('user').setDescription('Member to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
    .addIntegerOption(o => o.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'ban'))
      return interaction.reply({ embeds: [errorEmbed('You need **Head Moderator** or above to ban members.')], ephemeral: true });

    const target = interaction.options.getMember('user');
    const user = target?.user || interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 1;
    const cfg = getConfig();

    if (!user) return interaction.reply({ embeds: [errorEmbed('User not found.')], ephemeral: true });
    if (target && !target.bannable) return interaction.reply({ embeds: [errorEmbed('I cannot ban this user.')], ephemeral: true });
    if (user.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('You cannot ban yourself.')], ephemeral: true });

    // DM the target before ban
    if (target) {
      await target.send({
        embeds: [dmEmbed({
          title: `🔨 You were banned from ${interaction.guild.name}`,
          description: `**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}\n\nIf you believe this is a mistake, contact staff.`,
          color: 0xE74C3C,
          guild: interaction.guild,
        })]
      }).catch(() => {});
    }

    await interaction.guild.members.ban(user.id, { reason, deleteMessageDays: deleteDays });

    const embed = modEmbed({
      action: 'Member Banned', emoji: '🔨', color: 0xE74C3C,
      target: target || { user, id: user.id },
      moderator: interaction.user, reason,
      extra: [{ name: '🗑️ Messages Deleted', value: `${deleteDays} day(s)`, inline: true }],
    });

    await interaction.reply({ embeds: [embed] });

    if (cfg.channels.logs) {
      const ch = interaction.guild.channels.cache.get(cfg.channels.logs);
      if (ch) await ch.send({ embeds: [embed] });
    }
  }
};
