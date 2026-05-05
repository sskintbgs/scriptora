import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { getConfig } from '../../utils/config.js';
import { modEmbed, dmEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(o => o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'kick'))
      return interaction.reply({ embeds: [errorEmbed('You need **Moderator** or above to kick members.')], ephemeral: true });

    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const cfg = getConfig();

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found.')], ephemeral: true });
    if (!target.kickable) return interaction.reply({ embeds: [errorEmbed('I cannot kick this user (higher role or missing permissions).')], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('You cannot kick yourself.')], ephemeral: true });

    // DM the target
    await target.send({
      embeds: [dmEmbed({
        title: `You were kicked from ${interaction.guild.name}`,
        description: `**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}\n\nYou may rejoin if you have an invite link.`,
        color: 0xE67E22,
        guild: interaction.guild,
      })]
    }).catch(() => {});

    await target.kick(reason);

    const embed = modEmbed({
      action: 'Member Kicked', emoji: '👢', color: 0xE67E22,
      target, moderator: interaction.user, reason,
    });

    await interaction.reply({ embeds: [embed] });

    if (cfg.channels.logs) {
      const ch = interaction.guild.channels.cache.get(cfg.channels.logs);
      if (ch) await ch.send({ embeds: [embed] });
    }
  }
};
