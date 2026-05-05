import { SlashCommandBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { getConfig } from '../../utils/config.js';
import { modEmbed, dmEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove a timeout from a member')
    .addUserOption(o => o.setName('user').setDescription('Member to unmute').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'mute'))
      return interaction.reply({ embeds: [errorEmbed('You need **Moderator** or above to unmute members.')], ephemeral: true });

    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const cfg = getConfig();

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found.')], ephemeral: true });
    if (!target.communicationDisabledUntil) return interaction.reply({ embeds: [errorEmbed('This user is not timed out.')], ephemeral: true });

    await target.timeout(null, reason);

    await target.send({
      embeds: [dmEmbed({
        title: `✅ Your timeout was lifted in ${interaction.guild.name}`,
        description: `**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}\n\nPlease follow the server rules.`,
        color: 0x2ECC71,
        guild: interaction.guild,
      })]
    }).catch(() => {});

    const embed = modEmbed({
      action: 'Member Unmuted', emoji: '🔊', color: 0x2ECC71,
      target, moderator: interaction.user, reason,
    });

    await interaction.reply({ embeds: [embed] });
    if (cfg.channels.logs) {
      const ch = interaction.guild.channels.cache.get(cfg.channels.logs);
      if (ch) await ch.send({ embeds: [embed] });
    }
  }
};
