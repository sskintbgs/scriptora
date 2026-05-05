import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getBalance, addMoney, removeMoney } from '../../utils/economy.js';
import { PURPLE, GREEN, RED, errorEmbed } from '../../utils/embeds.js';

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function makeDeck() {
  return SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r }))).sort(() => Math.random() - 0.5);
}

function cardVal(card, total) {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return total + 11 > 21 ? 1 : 11;
  return parseInt(card.rank);
}

function handTotal(hand) {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.rank === 'A') aces++;
    else total += cardVal(c, total);
  }
  for (let i = 0; i < aces; i++) total += (total + 11 <= 21) ? 11 : 1;
  return total;
}

function renderHand(hand, hideSecond = false) {
  return hand.map((c, i) => (hideSecond && i === 1) ? '🂠' : `${c.suit}${c.rank}`).join(' ');
}

export default {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play blackjack against the dealer')
    .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10)),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const eco = getBalance(interaction.user.id);
    if (eco.balance < bet)
      return interaction.reply({ embeds: [errorEmbed(`Not enough money! Balance: ⏣ ${eco.balance.toLocaleString()}`)], ephemeral: true });

    removeMoney(interaction.user.id, bet);

    const deck = makeDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    const buildEmbed = (finished = false, result = null) => {
      const pTotal = handTotal(playerHand);
      const dTotal = finished ? handTotal(dealerHand) : '?';
      let color = PURPLE;
      if (result === 'win') color = GREEN;
      if (result === 'lose') color = RED;
      if (result === 'push') color = 0xF1C40F;

      return new EmbedBuilder()
        .setColor(color)
        .setTitle('🃏 Blackjack')
        .addFields(
          { name: `🧑 Your Hand (${pTotal})`, value: renderHand(playerHand), inline: true },
          { name: `🤖 Dealer (${dTotal})`, value: renderHand(dealerHand, !finished), inline: true },
        )
        .setFooter({ text: `Bet: ⏣ ${bet.toLocaleString()}` })
        .setTimestamp();
    };

    const row = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary).setEmoji('➕'),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Secondary).setEmoji('✋'),
    );

    const disabledRow = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary).setEmoji('➕').setDisabled(true),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Secondary).setEmoji('✋').setDisabled(true),
    );

    const msg = await interaction.reply({ embeds: [buildEmbed()], components: [row()], fetchReply: true });

    // Natural blackjack check
    if (handTotal(playerHand) === 21) {
      const prize = Math.floor(bet * 2.5);
      addMoney(interaction.user.id, prize);
      return interaction.editReply({ embeds: [buildEmbed(true, 'win').setDescription(`🎉 **BLACKJACK!** You win ⏣ ${prize.toLocaleString()}!`)], components: [disabledRow()] });
    }

    const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 60_000 });

    collector.on('collect', async i => {
      await i.deferUpdate();

      if (i.customId === 'bj_hit') {
        playerHand.push(deck.pop());
        const pTotal = handTotal(playerHand);
        if (pTotal > 21) {
          collector.stop('bust');
          const embed = buildEmbed(true, 'lose').setDescription(`💥 **Bust!** You went over 21. Lost ⏣ ${bet.toLocaleString()}.`);
          return interaction.editReply({ embeds: [embed], components: [disabledRow()] });
        }
        if (pTotal === 21) { collector.stop('stand'); return; }
        await interaction.editReply({ embeds: [buildEmbed()], components: [row()] });
      }

      if (i.customId === 'bj_stand') collector.stop('stand');
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'bust') return;

      // Dealer plays
      while (handTotal(dealerHand) < 17) dealerHand.push(deck.pop());
      const pTotal = handTotal(playerHand);
      const dTotal = handTotal(dealerHand);

      let result, desc;
      if (dTotal > 21 || pTotal > dTotal) {
        result = 'win';
        addMoney(interaction.user.id, bet * 2);
        desc = `🏆 You win! Dealer: ${dTotal}. +⏣ ${(bet * 2).toLocaleString()}`;
      } else if (pTotal === dTotal) {
        result = 'push';
        addMoney(interaction.user.id, bet);
        desc = `🤝 Push! Bet returned. ⏣ ${bet.toLocaleString()}`;
      } else {
        result = 'lose';
        desc = `😔 Dealer wins with ${dTotal}. -⏣ ${bet.toLocaleString()}`;
      }

      await interaction.editReply({ embeds: [buildEmbed(true, result).setDescription(desc)], components: [disabledRow()] });
    });
  }
};
