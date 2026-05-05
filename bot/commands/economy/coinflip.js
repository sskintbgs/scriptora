import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBalance, addMoney, removeMoney } from '../../utils/economy.js';
import { GREEN, RED, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin — heads or tails!')
    .addStringOption(o => o.setName('choice').setDescription('Your pick').setRequired(true)
      .addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' }))
    .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10)),

  async execute(interaction) {
    const choice = interaction.options.getString('choice');
    const bet = interaction.options.getInteger('bet');
    const eco = getBalance(interaction.user.id);
    if (eco.balance < bet) return interaction.reply({ embeds: [errorEmbed(`Not enough! Balance: ⏣ ${eco.balance.toLocaleString()}`)], ephemeral: true });

    const result = Math.random() > 0.5 ? 'heads' : 'tails';
    const won = choice === result;

    if (won) {
      addMoney(interaction.user.id, bet);
      const embed = new EmbedBuilder().setColor(GREEN).setTitle(`🪙 ${result.toUpperCase()} — You won!`)
        .setDescription(`You bet **${choice}** and it was **${result}**!\n\n**Won:** ⏣ +${bet.toLocaleString()}\n💰 Balance: **⏣ ${(eco.balance + bet).toLocaleString()}**`).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } else {
      removeMoney(interaction.user.id, bet);
      const embed = new EmbedBuilder().setColor(RED).setTitle(`🪙 ${result.toUpperCase()} — You lost!`)
        .setDescription(`You bet **${choice}** but it was **${result}**.\n\n**Lost:** ⏣ -${bet.toLocaleString()}\n💰 Balance: **⏣ ${Math.max(0, eco.balance - bet).toLocaleString()}**`).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};
