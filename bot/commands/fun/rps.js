import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PURPLE } from '../../utils/embeds.js';

const CHOICES = ['rock', 'paper', 'scissors'];
const EMOJIS = { rock: '🪨', paper: '📄', scissors: '✂️' };

export default {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock Paper Scissors')
    .addStringOption(o => o.setName('choice').setDescription('Your pick').setRequired(true)
      .addChoices(
        { name: 'Rock 🪨', value: 'rock' },
        { name: 'Paper 📄', value: 'paper' },
        { name: 'Scissors ✂️', value: 'scissors' },
      )),

  async execute(interaction) {
    const player = interaction.options.getString('choice');
    const bot = CHOICES[Math.floor(Math.random() * 3)];

    let result, color;
    if (player === bot) { result = "It's a **tie**!"; color = 0xF1C40F; }
    else if ((player === 'rock' && bot === 'scissors') || (player === 'paper' && bot === 'rock') || (player === 'scissors' && bot === 'paper')) {
      result = 'You **won**! 🎉'; color = 0x2ECC71;
    } else { result = 'You **lost**! 😔'; color = 0xE74C3C; }

    const embed = new EmbedBuilder().setColor(color).setTitle('✊ Rock Paper Scissors')
      .addFields(
        { name: 'You', value: `${EMOJIS[player]} ${player}`, inline: true },
        { name: 'Bot', value: `${EMOJIS[bot]} ${bot}`, inline: true },
        { name: 'Result', value: result },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
