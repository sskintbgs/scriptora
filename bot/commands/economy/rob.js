import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBalance, addMoney, removeMoney } from '../../utils/economy.js';
import { isOwnerDiscordId } from '../../utils/permissions.js';
import { GREEN, RED, errorEmbed } from '../../utils/embeds.js';

export default {
  cooldown: 120,
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Attempt to rob another user')
    .addUserOption(o => o.setName('user').setDescription('User to rob').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id)
      return interaction.reply({ embeds: [errorEmbed("You can't rob yourself.")], ephemeral: true });
    if (target.bot)
      return interaction.reply({ embeds: [errorEmbed("You can't rob a bot.")], ephemeral: true });

    // 👑 Owner immunity
    if (isOwnerDiscordId(target.id))
      return interaction.reply({ embeds: [errorEmbed('🔒 That person is **protected** — you cannot rob them.')], ephemeral: true });

    const robber = getBalance(interaction.user.id);
    const victim = getBalance(target.id);

    if (robber.balance < 100)
      return interaction.reply({ embeds: [errorEmbed('You need at least **⏣ 100** to attempt a robbery.')], ephemeral: true });
    if (victim.balance < 50)
      return interaction.reply({ embeds: [errorEmbed(`${target.username} is too broke to rob.`)], ephemeral: true });

    const success = Math.random() > 0.6; // 40% chance

    if (success) {
      const stolen = Math.floor(Math.random() * Math.min(victim.balance, 500)) + 50;
      addMoney(interaction.user.id, stolen);
      removeMoney(target.id, stolen);
      const embed = new EmbedBuilder().setColor(GREEN).setTitle('🦹 Robbery Successful!')
        .setDescription(`You stole **⏣ ${stolen.toLocaleString()}** from ${target}!\n\n💰 Your new balance: **⏣ ${getBalance(interaction.user.id).balance.toLocaleString()}**`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    } else {
      const fine = Math.floor(Math.random() * 200) + 50;
      removeMoney(interaction.user.id, fine);
      const embed = new EmbedBuilder().setColor(RED).setTitle('🚔 Caught Red-Handed!')
        .setDescription(`You got caught trying to rob ${target}!\nFined **⏣ ${fine.toLocaleString()}**.`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  }
};
