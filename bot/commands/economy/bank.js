import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { depositToBank, withdrawFromBank, getBalance } from '../../utils/economy.js';
import { PURPLE, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Deposit or withdraw from your bank')
    .addSubcommand(s => s.setName('deposit').setDescription('Deposit money into the bank')
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('withdraw').setDescription('Withdraw money from the bank')
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const amount = interaction.options.getInteger('amount');

    if (sub === 'deposit') {
      const result = depositToBank(interaction.user.id, amount);
      if (!result) return interaction.reply({ embeds: [errorEmbed(`Not enough in wallet! You have ⏣ ${getBalance(interaction.user.id).balance.toLocaleString()}`)], ephemeral: true });
      const embed = new EmbedBuilder().setColor(PURPLE).setTitle('🏦 Deposited!')
        .setDescription(`Deposited **⏣ ${amount.toLocaleString()}** into your bank.\n\n💵 Wallet: **⏣ ${result.balance.toLocaleString()}**\n🏦 Bank: **⏣ ${result.bank.toLocaleString()}**`).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } else {
      const result = withdrawFromBank(interaction.user.id, amount);
      if (!result) return interaction.reply({ embeds: [errorEmbed(`Not enough in bank! You have ⏣ ${getBalance(interaction.user.id).bank.toLocaleString()}`)], ephemeral: true });
      const embed = new EmbedBuilder().setColor(PURPLE).setTitle('🏦 Withdrawn!')
        .setDescription(`Withdrew **⏣ ${amount.toLocaleString()}** from your bank.\n\n💵 Wallet: **⏣ ${result.balance.toLocaleString()}**\n🏦 Bank: **⏣ ${result.bank.toLocaleString()}**`).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};
