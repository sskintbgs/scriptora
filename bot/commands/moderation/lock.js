import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { PURPLE, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel (prevent messages)')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to lock (default: current)').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'mute'))
      return interaction.reply({ embeds: [errorEmbed('You need **Moderator** or above.')], ephemeral: true });

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });

    const embed = new EmbedBuilder().setColor(0xE74C3C).setTitle('🔒 Channel Locked')
      .setDescription(`${channel} has been **locked**. Members can no longer send messages.`)
      .setFooter({ text: `Locked by ${interaction.user.tag}` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
