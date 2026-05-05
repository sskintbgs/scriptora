import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { PURPLE, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to unlock').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'mute'))
      return interaction.reply({ embeds: [errorEmbed('You need **Moderator** or above.')], ephemeral: true });

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });

    const embed = new EmbedBuilder().setColor(0x2ECC71).setTitle('🔓 Channel Unlocked')
      .setDescription(`${channel} has been **unlocked**.`)
      .setFooter({ text: `Unlocked by ${interaction.user.tag}` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
