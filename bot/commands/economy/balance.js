import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBalance } from '../../utils/economy.js';
import { PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your or someone else\'s balance')
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const eco = getBalance(target.id);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle(`💰 ${target.username}'s Balance`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '💵 Wallet', value: `\`⏣ ${eco.balance.toLocaleString()}\``, inline: true },
        { name: '🏦 Bank', value: `\`⏣ ${eco.bank.toLocaleString()}\``, inline: true },
        { name: '💎 Net Worth', value: `\`⏣ ${(eco.balance + eco.bank).toLocaleString()}\``, inline: true },
        { name: '📈 Total Earned', value: `\`⏣ ${eco.totalEarned.toLocaleString()}\``, inline: true },
      )
      .setFooter({ text: 'Scriptora Economy' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
