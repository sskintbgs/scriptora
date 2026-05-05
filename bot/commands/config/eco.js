import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBalance, addMoney, removeMoney, setBalance } from '../../utils/economy.js';
import { getConfig } from '../../utils/config.js';
import { GREEN, RED, PURPLE, errorEmbed } from '../../utils/embeds.js';

function isOwner(userId) {
  const cfg = getConfig();
  return userId === cfg.OWNER_ID || (cfg.OWNER_DISCORD_IDS || []).includes(userId);
}

export default {
  data: new SlashCommandBuilder()
    .setName('eco')
    .setDescription('Owner economy management')
    .addSubcommand(s => s.setName('add')
      .setDescription('Add money to a user')
      .addUserOption(o => o.setName('user').setDescription('Target').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('remove')
      .setDescription('Remove money from a user')
      .addUserOption(o => o.setName('user').setDescription('Target').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('set')
      .setDescription('Set a user\'s wallet balance')
      .addUserOption(o => o.setName('user').setDescription('Target').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('New balance').setRequired(true).setMinValue(0)))
    .addSubcommand(s => s.setName('reset')
      .setDescription('Reset a user\'s entire economy')
      .addUserOption(o => o.setName('user').setDescription('Target').setRequired(true)))
    .addSubcommand(s => s.setName('view')
      .setDescription('View any user\'s full balance')
      .addUserOption(o => o.setName('user').setDescription('Target').setRequired(true))),

  async execute(interaction) {
    if (!isOwner(interaction.user.id))
      return interaction.reply({ embeds: [errorEmbed('🔒 This command is **owner only**.')], ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount') || 0;

    if (sub === 'add') {
      addMoney(target.id, amount);
      const bal = getBalance(target.id);
      const embed = new EmbedBuilder().setColor(GREEN).setTitle('💸 Money Added')
        .setDescription(`Added **⏣ ${amount.toLocaleString()}** to ${target}\n\n💰 New wallet: **⏣ ${bal.balance.toLocaleString()}**`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      removeMoney(target.id, amount);
      const bal = getBalance(target.id);
      const embed = new EmbedBuilder().setColor(RED).setTitle('💸 Money Removed')
        .setDescription(`Removed **⏣ ${amount.toLocaleString()}** from ${target}\n\n💰 New wallet: **⏣ ${bal.balance.toLocaleString()}**`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'set') {
      const bal = getBalance(target.id);
      setBalance(target.id, { ...bal, balance: amount });
      const embed = new EmbedBuilder().setColor(PURPLE).setTitle('💰 Balance Set')
        .setDescription(`Set ${target}'s wallet to **⏣ ${amount.toLocaleString()}**`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'reset') {
      setBalance(target.id, { balance: 0, bank: 0, lastDaily: null, lastWork: null, totalEarned: 0 });
      const embed = new EmbedBuilder().setColor(RED).setTitle('🔄 Economy Reset')
        .setDescription(`Reset **${target.tag}**'s entire economy to zero.`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'view') {
      const bal = getBalance(target.id);
      const embed = new EmbedBuilder().setColor(PURPLE).setTitle(`💰 ${target.tag}'s Economy`)
        .addFields(
          { name: '💵 Wallet', value: `⏣ ${bal.balance.toLocaleString()}`, inline: true },
          { name: '🏦 Bank',   value: `⏣ ${bal.bank.toLocaleString()}`,    inline: true },
          { name: '📊 Total',  value: `⏣ ${(bal.balance + bal.bank).toLocaleString()}`, inline: true },
          { name: '🏆 Total Earned', value: `⏣ ${(bal.totalEarned || 0).toLocaleString()}`, inline: true },
        ).setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
