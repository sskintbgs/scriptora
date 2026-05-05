import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBalance, addMoney, removeMoney } from '../../utils/economy.js';
import { PURPLE, RED, GREEN, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Gamble your coins for a chance to double up')
    .addIntegerOption(o => o.setName('amount').setDescription('Amount to gamble').setRequired(true).setMinValue(10)),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const eco = getBalance(interaction.user.id);

    if (eco.balance < amount)
      return interaction.reply({ embeds: [errorEmbed(`You don't have enough! You have **⏣ ${eco.balance.toLocaleString()}**.`)], ephemeral: true });

    const roll = Math.random();
    const win = roll > 0.55; // 45% chance to win (house edge)
    let multiplier = 1;

    if (win) {
      if (roll > 0.95) multiplier = 3;       // 5% chance 3x
      else if (roll > 0.85) multiplier = 2.5; // 10% chance 2.5x
      else multiplier = 2;                    // 30% chance 2x

      const winnings = Math.floor(amount * multiplier) - amount;
      addMoney(interaction.user.id, winnings);

      const embed = new EmbedBuilder()
        .setColor(GREEN)
        .setTitle('🎰 You Won!')
        .setDescription(
          `**Multiplier:** ${multiplier}x\n` +
          `**Bet:** ⏣ ${amount.toLocaleString()}\n` +
          `**Winnings:** ⏣ +${winnings.toLocaleString()}\n\n` +
          `💰 New balance: **⏣ ${(eco.balance + winnings).toLocaleString()}**`
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      removeMoney(interaction.user.id, amount);

      const embed = new EmbedBuilder()
        .setColor(RED)
        .setTitle('🎰 You Lost...')
        .setDescription(
          `**Bet:** ⏣ ${amount.toLocaleString()}\n` +
          `**Lost:** ⏣ -${amount.toLocaleString()}\n\n` +
          `💰 New balance: **⏣ ${Math.max(0, eco.balance - amount).toLocaleString()}**`
        )
        .setFooter({ text: 'Better luck next time!' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};
