import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getBalance, transferMoney } from '../../utils/economy.js';
import { isOwnerDiscordId } from '../../utils/permissions.js';
import { errorEmbed, PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('duel')
    .setDescription('Challenge another member to a money duel')
    .addUserOption(o => o.setName('opponent').setDescription('User to duel with').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Bet amount').setRequired(true).setMinValue(10)),

  async execute(interaction, client) {
    const challenger = interaction.user;
    const opponent = interaction.options.getUser('opponent');
    const amount = interaction.options.getInteger('amount');

    if (opponent.id === challenger.id) return interaction.reply({ embeds: [errorEmbed("You cannot duel yourself.")], ephemeral: true });
    if (opponent.bot) return interaction.reply({ embeds: [errorEmbed("You cannot duel a bot.")], ephemeral: true });

    // 👑 Owner immunity
    if (isOwnerDiscordId(opponent.id))
      return interaction.reply({ embeds: [errorEmbed('🔒 That person is **protected** — you cannot duel them.')], ephemeral: true });

    const challengerBal = getBalance(challenger.id).balance;
    const opponentBal = getBalance(opponent.id).balance;
    if (challengerBal < amount) return interaction.reply({ embeds: [errorEmbed(`You don't have enough money (⏣ ${challengerBal.toLocaleString()})`)], ephemeral: true });
    if (opponentBal < amount) return interaction.reply({ embeds: [errorEmbed(`${opponent.username} doesn't have enough money to accept the duel.`)], ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('⚔️ Duel Challenge')
      .setDescription(`${challenger} challenges ${opponent} to a duel for **⏣ ${amount.toLocaleString()}** each!`)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`duel_accept_${challenger.id}_${opponent.id}_${amount}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`duel_decline_${challenger.id}_${opponent.id}_${amount}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({ embeds: [embed], components: [row] });

    const filter = i => i.user.id === opponent.id && (i.customId.startsWith('duel_accept') || i.customId.startsWith('duel_decline'));
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60_000, max: 1 });

    collector.on('collect', async i => {
      if (i.customId.startsWith('duel_decline')) {
        await i.update({ content: `${opponent} declined the duel.`, embeds: [], components: [] });
        return;
      }

      // ACCEPTED
      const winner = Math.random() < 0.5 ? challenger : opponent;
      const loser = winner.id === challenger.id ? opponent : challenger;

      // Transfer amount from loser to winner
      transferMoney(loser.id, winner.id, amount);

      const resultEmbed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('🏆 Duel Result')
        .setDescription(`**${winner}** wins the duel and takes **⏣ ${amount.toLocaleString()}** from **${loser}**!`)
        .addFields(
          { name: `${winner.username}'s New Balance`, value: `⏣ ${getBalance(winner.id).balance.toLocaleString()}`, inline: true },
          { name: `${loser.username}'s New Balance`, value: `⏣ ${getBalance(loser.id).balance.toLocaleString()}`, inline: true },
        )
        .setTimestamp();

      await i.update({ content: '', embeds: [resultEmbed], components: [] });
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        await interaction.editReply({ content: 'No response – duel expired.', embeds: [], components: [] });
      }
    });
  },
};
