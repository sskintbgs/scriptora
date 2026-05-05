import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBalance, addMoney, removeMoney } from '../../utils/economy.js';
import { PURPLE, RED, GREEN, errorEmbed } from '../../utils/embeds.js';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🍀', '⭐'];

function spin() {
  return [
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
  ];
}

function getMultiplier(reels) {
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    if (reels[0] === '💎') return 10;
    if (reels[0] === '7️⃣') return 7;
    return 3;
  }
  if (reels[0] === reels[1] || reels[1] === reels[2]) return 1.5;
  return 0;
}

export default {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Play the slot machine')
    .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10).setMaxValue(50000)),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const eco = getBalance(interaction.user.id);
    if (eco.balance < bet) return interaction.reply({ embeds: [errorEmbed(`Not enough! You have ⏣ ${eco.balance.toLocaleString()}.`)], ephemeral: true });

    const reels = spin();
    const mult = getMultiplier(reels);
    const display = `\`[ ${reels.join(' | ')} ]\``;

    if (mult > 0) {
      const win = Math.floor(bet * mult) - bet;
      addMoney(interaction.user.id, win);
      const embed = new EmbedBuilder().setColor(mult >= 3 ? 0xFFD700 : GREEN)
        .setTitle(mult >= 3 ? '🎰 JACKPOT!' : '🎰 Winner!')
        .setDescription(`${display}\n\n**${mult}x** — Won **⏣ +${win.toLocaleString()}**\n💰 Balance: **⏣ ${(eco.balance + win).toLocaleString()}**`).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } else {
      removeMoney(interaction.user.id, bet);
      const embed = new EmbedBuilder().setColor(RED).setTitle('🎰 No Match...')
        .setDescription(`${display}\n\nLost **⏣ -${bet.toLocaleString()}**\n💰 Balance: **⏣ ${Math.max(0, eco.balance - bet).toLocaleString()}**`).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};
