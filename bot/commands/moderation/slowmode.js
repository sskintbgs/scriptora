import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { getConfig } from '../../utils/config.js';
import { errorEmbed, PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set the slowmode for this channel')
    .addIntegerOption(o => o.setName('seconds').setDescription('Seconds (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'mute'))
      return interaction.reply({ embeds: [errorEmbed('You need **Moderator** or above to change slowmode.')], ephemeral: true });

    const seconds = interaction.options.getInteger('seconds');
    await interaction.channel.setRateLimitPerUser(seconds, `Set by ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle(seconds === 0 ? '🐇 Slowmode Disabled' : '🐢 Slowmode Enabled')
      .setDescription(seconds === 0
        ? `Slowmode has been **disabled** in ${interaction.channel}.`
        : `Slowmode set to **${seconds} second(s)** in ${interaction.channel}.`
      )
      .setFooter({ text: `Set by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
