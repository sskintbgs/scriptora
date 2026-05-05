import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getBalance, addMoney, removeMoney } from '../../utils/economy.js';
import { PURPLE, GREEN, RED, errorEmbed } from '../../utils/embeds.js';

export default {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('highlow')
    .setDescription('Guess if the next card is higher or lower')
    .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10)),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const eco = getBalance(interaction.user.id);
    if (eco.balance < bet)
      return interaction.reply({ embeds: [errorEmbed(`Not enough! Balance: ⏣ ${eco.balance.toLocaleString()}`)], ephemeral: true });

    const current = Math.floor(Math.random() * 13) + 1;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hl_higher').setLabel('Higher ⬆️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('hl_lower').setLabel('Lower ⬇️').setStyle(ButtonStyle.Danger),
    );

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🃏 High or Low')
      .setDescription(`The current card is: **${current}**\n\nWill the next card be **higher** or **lower**?`)
      .setFooter({ text: `Bet: ⏣ ${bet.toLocaleString()} | Win 2×` })
      .setTimestamp();

    removeMoney(interaction.user.id, bet);
    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 30_000,
      max: 1,
    });

    const disabledRow = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hl_higher').setLabel('Higher ⬆️').setStyle(ButtonStyle.Primary).setDisabled(true),
      new ButtonBuilder().setCustomId('hl_lower').setLabel('Lower ⬇️').setStyle(ButtonStyle.Danger).setDisabled(true),
    );

    collector.on('collect', async i => {
      const next = Math.floor(Math.random() * 13) + 1;
      const isHigher = next > current;
      const isLower  = next < current;
      const isTie    = next === current;

      const guessedHigher = i.customId === 'hl_higher';
      const won = !isTie && (guessedHigher ? isHigher : isLower);

      let color, title, desc;
      if (isTie) {
        addMoney(interaction.user.id, bet);
        color = 0xF1C40F; title = '🤝 Tie!';
        desc = `Next card was also **${next}**. Bet returned.`;
      } else if (won) {
        addMoney(interaction.user.id, bet * 2);
        color = GREEN; title = '✅ Correct!';
        desc = `Next card was **${next}** — you picked ${guessedHigher ? 'Higher ⬆️' : 'Lower ⬇️'}!\n**Won: ⏣ +${(bet * 2).toLocaleString()}**`;
      } else {
        color = RED; title = '❌ Wrong!';
        desc = `Next card was **${next}** — you picked ${guessedHigher ? 'Higher ⬆️' : 'Lower ⬇️'}.\n**Lost: ⏣ -${bet.toLocaleString()}**`;
      }

      const result = new EmbedBuilder().setColor(color).setTitle(`🃏 High or Low — ${title}`)
        .setDescription(`Previous card: **${current}** → Next card: **${next}**\n\n${desc}`).setTimestamp();

      await i.update({ embeds: [result], components: [disabledRow()] });
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        addMoney(interaction.user.id, bet); // refund on timeout
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor(RED).setTitle('⏰ Timed Out').setDescription('Bet refunded.')], components: [disabledRow()] }).catch(() => {});
      }
    });
  }
};
