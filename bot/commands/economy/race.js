import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getBalance, addMoney, removeMoney, transferMoney } from '../../utils/economy.js';
import { PURPLE, errorEmbed } from '../../utils/embeds.js';

const ANIMALS = ['🐢', '🐇', '🦊', '🐎', '🦁'];
const NAMES   = ['Slowpoke', 'Bunny', 'Firefox', 'Thunder', 'Simba'];

export default {
  data: new SlashCommandBuilder()
    .setName('race')
    .setDescription('Bet on an animal race and watch it live')
    .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10))
    .addIntegerOption(o => o.setName('animal').setDescription('Pick 1‑5').setRequired(true).setMinValue(1).setMaxValue(5)),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const pick = interaction.options.getInteger('animal') - 1;
    const eco = getBalance(interaction.user.id);
    if (eco.balance < bet)
      return interaction.reply({ embeds: [errorEmbed(`Insufficient funds! ⏣ ${eco.balance.toLocaleString()}`)], ephemeral: true });

    removeMoney(interaction.user.id, bet);

    const positions = [0, 0, 0, 0, 0];
    const FINISH = 20;

    function renderRace() {
      return ANIMALS.map((a, i) => {
        const track = '─'.repeat(positions[i]) + a + '─'.repeat(Math.max(0, FINISH - positions[i])) + '🏁';
        return `**${NAMES[i]}**: ${track}`;
      }).join('\n');
    }

    const embed = () => new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🏁 Animal Race')
      .setDescription(renderRace())
      .setFooter({ text: `You picked ${ANIMALS[pick]} ${NAMES[pick]} — Bet: ⏣ ${bet.toLocaleString()}` });

    const msg = await interaction.reply({ embeds: [embed()], fetchReply: true });

    // Simulate race with 8 update ticks
    for (let tick = 0; tick < 8; tick++) {
      await new Promise(r => setTimeout(r, 1200));
      for (let i = 0; i < 5; i++) {
        positions[i] = Math.min(FINISH, positions[i] + Math.floor(Math.random() * 4));
      }
      if (positions.some(p => p >= FINISH)) break;
      await msg.edit({ embeds: [embed()] }).catch(() => {});
    }

    // Determine winner (closest to/at finish)
    const winner = positions.indexOf(Math.max(...positions));
    const won = winner === pick;

    if (won) {
      addMoney(interaction.user.id, bet * 3);
    }

    const resultEmbed = new EmbedBuilder()
      .setColor(won ? 0x2ECC71 : 0xE74C3C)
      .setTitle(`🏁 Race Finished — ${ANIMALS[winner]} ${NAMES[winner]} Wins!`)
      .setDescription(renderRace())
      .addFields({ name: won ? '🏆 You Won!' : '😔 You Lost', value: won ? `+⏣ ${(bet * 3).toLocaleString()} (3× payout)` : `-⏣ ${bet.toLocaleString()}` })
      .setTimestamp();

    await msg.edit({ embeds: [resultEmbed] }).catch(() => {});
  }
};
