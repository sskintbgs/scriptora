import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove a role from a user')
    .addSubcommand(s => s.setName('add').setDescription('Add a role')
      .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role to add').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a role')
      .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role to remove').setRequired(true))),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'config'))
      return interaction.reply({ embeds: [errorEmbed('You need **Head Operator** or above.')], ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getMember('user');
    const role = interaction.options.getRole('role');

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found.')], ephemeral: true });
    if (role.position >= interaction.guild.members.me.roles.highest.position)
      return interaction.reply({ embeds: [errorEmbed('I cannot manage this role (it is higher than mine).')], ephemeral: true });

    if (sub === 'add') {
      await target.roles.add(role);
      const embed = new EmbedBuilder().setColor(0x2ECC71).setTitle('✅ Role Added')
        .setDescription(`Added **${role.name}** to ${target}`).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } else {
      await target.roles.remove(role);
      const embed = new EmbedBuilder().setColor(0xE74C3C).setTitle('✅ Role Removed')
        .setDescription(`Removed **${role.name}** from ${target}`).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};
