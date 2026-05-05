import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBalance, addMoney, removeMoney } from '../../utils/economy.js';
import { PURPLE, GREEN, RED, errorEmbed } from '../../utils/embeds.js';

export default {
  cooldown: 30,
  data: new SlashCommandBuilder()
    .setName('bet')
    .setDescription('Place a bet and spin the multiplier wheel')
    .addIntegerOption(o => o.setName('amount').setDescription('Amount to bet').setRequired(true).setMinValue(10)),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const eco = getBalance(interaction.user.id);
    if (eco.balance < amount)
      return interaction.reply({ embeds: [errorEmbed(`Insufficient funds! Balance: ⏣ ${eco.balance.toLocaleString()}`)], ephemeral: true });

    // Weighted outcomes
    const roll = Math.random() * 100;
    let mult, label, color;
    if (roll < 40)      { mult = 0;    label = '💀 BUST — Lost everything!';        color = RED; }
    else if (roll < 60) { mult = 0.5;  label = '😬 Half back...';                   color = 0xE67E22; }
    else if (roll < 75) { mult = 1.5;  label = '✅ 1.5× Win!';                      color = GREEN; }
    else if (roll < 88) { mult = 2;    label = '🔥 2× Double!';                     color = GREEN; }
    else if (roll < 96) { mult = 3;    label = '💎 3× Triple!';                     color = 0xF1C40F; }
    else                { mult = 5;    label = '🌟 5× JACKPOT!';                    color = 0xFFD700; }

    const payout = Math.floor(amount * mult);
    removeMoney(interaction.user.id, amount);
    if (payout > 0) addMoney(interaction.user.id, payout);
    const newBal = getBalance(interaction.user.id).balance;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🎯 Bet Result — ${label}`)
      .addFields(
        { name: '💵 Bet',     value: `⏣ ${amount.toLocaleString()}`,                        inline: true },
        { name: '🎁 Payout',  value: `⏣ ${payout.toLocaleString()} (×${mult})`,             inline: true },
        { name: '💰 Balance', value: `⏣ ${newBal.toLocaleString()}`,                         inline: true },
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
