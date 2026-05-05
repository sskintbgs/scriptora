import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getLeaderboard } from '../../utils/economy.js';
import { PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the richest members'),

  async execute(interaction) {
    const lb = getLeaderboard(10);
    if (!lb.length) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(PURPLE).setDescription('No economy data yet. Use `/daily` or `/work` to start!')], ephemeral: true });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = lb.map((entry, i) => {
      const medal = medals[i] || `\`${i + 1}.\``;
      return `${medal} <@${entry.id}> — **⏣ ${entry.total.toLocaleString()}**`;
    });

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🏆 Economy Leaderboard')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `${lb.length} users tracked` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
