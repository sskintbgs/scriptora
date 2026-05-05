import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Roll some dice')
    .addIntegerOption(o => o.setName('sides').setDescription('Number of sides (default 6)').setRequired(false).setMinValue(2).setMaxValue(100))
    .addIntegerOption(o => o.setName('count').setDescription('Number of dice (default 1)').setRequired(false).setMinValue(1).setMaxValue(10)),

  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') || 6;
    const count = interaction.options.getInteger('count') || 1;
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);

    const embed = new EmbedBuilder().setColor(PURPLE).setTitle('🎲 Dice Roll')
      .setDescription(`**Rolled ${count}d${sides}:**\n${rolls.map(r => `\`${r}\``).join(' + ')}${count > 1 ? `\n\n**Total:** \`${total}\`` : ''}`)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
