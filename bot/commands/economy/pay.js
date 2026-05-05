import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { transferMoney, getBalance } from '../../utils/economy.js';
import { PURPLE, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Send money to another user')
    .addUserOption(o => o.setName('user').setDescription('Who to pay').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed("You can't pay yourself.")], ephemeral: true });
    if (target.bot) return interaction.reply({ embeds: [errorEmbed("You can't pay a bot.")], ephemeral: true });

    const result = transferMoney(interaction.user.id, target.id, amount);
    if (!result) return interaction.reply({ embeds: [errorEmbed(`Not enough funds! Balance: ⏣ ${getBalance(interaction.user.id).balance.toLocaleString()}`)], ephemeral: true });

    const embed = new EmbedBuilder().setColor(PURPLE).setTitle('💸 Payment Sent!')
      .setDescription(`${interaction.user} sent **⏣ ${amount.toLocaleString()}** to ${target}`)
      .addFields(
        { name: `${interaction.user.username}'s Balance`, value: `⏣ ${result.from.balance.toLocaleString()}`, inline: true },
        { name: `${target.username}'s Balance`, value: `⏣ ${result.to.balance.toLocaleString()}`, inline: true },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
