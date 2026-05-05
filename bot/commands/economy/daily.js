import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { addMoney, canClaim, setClaimed, getTimeUntilClaim } from '../../utils/economy.js';
import { PURPLE, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),

  async execute(interaction) {
    if (!canClaim(interaction.user.id, 'daily')) {
      const ms = getTimeUntilClaim(interaction.user.id, 'daily');
      const hours = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      return interaction.reply({
        embeds: [errorEmbed(`You've already claimed your daily!\nCome back in **${hours}h ${mins}m**.`)],
        ephemeral: true
      });
    }

    const amount = Math.floor(Math.random() * 500) + 500; // 500-1000
    const streak = Math.floor(Math.random() * 3) + 1;
    const bonus = streak > 1 ? Math.floor(amount * 0.2) : 0;
    const total = amount + bonus;

    addMoney(interaction.user.id, total);
    setClaimed(interaction.user.id, 'daily');

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🎁 Daily Reward Claimed!')
      .setDescription(
        `You received **⏣ ${amount.toLocaleString()}**` +
        (bonus > 0 ? ` + **⏣ ${bonus.toLocaleString()}** streak bonus!` : '!') +
        `\n\n💰 **Total:** ⏣ ${total.toLocaleString()}`
      )
      .setFooter({ text: 'Come back tomorrow for more!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
