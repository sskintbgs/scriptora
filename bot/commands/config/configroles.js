import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { getConfig, updateConfig } from '../../utils/config.js';
import { infoEmbed, errorEmbed, PURPLE } from '../../utils/embeds.js';

const ALL_COMMANDS = ['kick', 'ban', 'unban', 'warn', 'mute', 'unmute', 'purge', 'slowmode', 'modlogs', 'manage_tickets', 'reaction_roles', 'config'];

export default {
  data: new SlashCommandBuilder()
    .setName('configroles')
    .setDescription('Configure which roles can use each command (Owner only)')
    .addSubcommand(sub => sub
      .setName('view')
      .setDescription('View current role permissions')
    )
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Set which roles can use a permission')
      .addStringOption(o => o.setName('permission').setDescription('Permission to configure').setRequired(true)
        .addChoices(
          { name: 'kick', value: 'kick' }, { name: 'ban', value: 'ban' },
          { name: 'unban', value: 'unban' }, { name: 'warn', value: 'warn' },
          { name: 'mute / unmute', value: 'mute' }, { name: 'purge', value: 'mute' },
          { name: 'slowmode', value: 'mute' }, { name: 'modlogs', value: 'warn' },
          { name: 'manage_tickets', value: 'manage_tickets' },
          { name: 'reaction_roles', value: 'reaction_roles' },
          { name: 'config (setup)', value: 'config' },
        )
      )
      .addStringOption(o => o.setName('roles').setDescription('Comma-separated role names that can use this (e.g. Moderator,Support)').setRequired(true))
    ),

  async execute(interaction) {
    const cfg = getConfig();
    if (interaction.user.id !== cfg.OWNER_ID && !interaction.member.permissions.has('Administrator'))
      return interaction.reply({ embeds: [errorEmbed('Only the server owner or administrators can configure role permissions.')], ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const lines = Object.entries(cfg.permissions).map(([perm, roles]) =>
        `**${perm}**: ${roles.length ? roles.join(', ') : '*Nobody*'}`
      ).join('\n');

      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('⚙️ Role Permission Configuration')
        .setDescription(lines || 'No permissions configured.')
        .setFooter({ text: 'Use /configroles set to change permissions' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'set') {
      const perm = interaction.options.getString('permission');
      const rolesInput = interaction.options.getString('roles');
      const roles = rolesInput.split(',').map(r => r.trim()).filter(Boolean);

      const updated = updateConfig({ permissions: { [perm]: roles } });

      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('✅ Permission Updated')
        .addFields(
          { name: 'Permission', value: `\`${perm}\``, inline: true },
          { name: 'Allowed Roles', value: roles.join(', ') || 'Nobody', inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
