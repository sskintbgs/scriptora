import { SlashCommandBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { getConfig } from '../../utils/config.js';
import { successEmbed, errorEmbed, modEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their ID')
    .addStringOption(o => o.setName('user_id').setDescription('User ID to unban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'ban'))
      return interaction.reply({ embeds: [errorEmbed('You need **Head Moderator** or above to unban users.')], ephemeral: true });

    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const cfg = getConfig();

    try {
      const bannedUser = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!bannedUser) return interaction.reply({ embeds: [errorEmbed('User is not banned or ID is invalid.')], ephemeral: true });

      await interaction.guild.members.unban(userId, reason);

      const embed = modEmbed({
        action: 'Member Unbanned', emoji: '✅', color: 0x2ECC71,
        target: { user: bannedUser.user, id: userId },
        moderator: interaction.user, reason,
      });

      await interaction.reply({ embeds: [embed] });
      if (cfg.channels.logs) {
        const ch = interaction.guild.channels.cache.get(cfg.channels.logs);
        if (ch) await ch.send({ embeds: [embed] });
      }
    } catch (err) {
      return interaction.reply({ embeds: [errorEmbed(`Failed to unban: ${err.message}`)], ephemeral: true });
    }
  }
};
