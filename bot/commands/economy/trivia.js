import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getBalance, addMoney, removeMoney } from '../../utils/economy.js';
import { PURPLE, GREEN, RED, errorEmbed } from '../../utils/embeds.js';

const QUESTIONS = [
  { q: 'What is 7 × 8?',                        a: '56',           opts: ['54', '56', '58', '62'] },
  { q: 'What language runs in browsers?',        a: 'JavaScript',   opts: ['Python', 'Java', 'JavaScript', 'Ruby'] },
  { q: 'What planet is closest to the sun?',    a: 'Mercury',      opts: ['Venus', 'Earth', 'Mars', 'Mercury'] },
  { q: 'How many sides does a hexagon have?',   a: '6',            opts: ['5', '6', '7', '8'] },
  { q: 'Who wrote Romeo and Juliet?',           a: 'Shakespeare',  opts: ['Dickens', 'Hemingway', 'Shakespeare', 'Poe'] },
  { q: 'What is the speed of light (km/s)?',    a: '299,792',      opts: ['150,000', '299,792', '400,000', '1,000,000'] },
  { q: 'How many bones in the human body?',     a: '206',          opts: ['196', '206', '216', '226'] },
  { q: 'What is the capital of Japan?',         a: 'Tokyo',        opts: ['Beijing', 'Seoul', 'Tokyo', 'Bangkok'] },
  { q: 'Which element has symbol "O"?',         a: 'Oxygen',       opts: ['Gold', 'Osmium', 'Oxygen', 'Oganesson'] },
  { q: 'What year did WWII end?',               a: '1945',         opts: ['1943', '1944', '1945', '1946'] },
];

export default {
  cooldown: 15,
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Answer a trivia question to win money')
    .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10)),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const eco = getBalance(interaction.user.id);
    if (eco.balance < bet)
      return interaction.reply({ embeds: [errorEmbed(`Not enough! Balance: ⏣ ${eco.balance.toLocaleString()}`)], ephemeral: true });

    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const shuffled = [...q.opts].sort(() => Math.random() - 0.5);

    const row = new ActionRowBuilder().addComponents(
      shuffled.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`trivia_${i}_${opt === q.a ? 'correct' : 'wrong'}`)
          .setLabel(opt)
          .setStyle(ButtonStyle.Primary)
      )
    );

    removeMoney(interaction.user.id, bet);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🧠 Trivia Question')
      .setDescription(`**${q.q}**\n\nPick the correct answer! You have **15 seconds**.`)
      .setFooter({ text: `Bet: ⏣ ${bet.toLocaleString()} — Win 2×!` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 15_000,
      max: 1,
    });

    const disabledRow = (correct) => new ActionRowBuilder().addComponents(
      shuffled.map((opt, i) => {
        const isCorrect = opt === q.a;
        return new ButtonBuilder()
          .setCustomId(`trivia_done_${i}`)
          .setLabel(opt)
          .setStyle(isCorrect ? ButtonStyle.Success : ButtonStyle.Danger)
          .setDisabled(true);
      })
    );

    collector.on('collect', async i => {
      const won = i.customId.endsWith('correct');
      if (won) {
        addMoney(interaction.user.id, bet * 2);
        const e = new EmbedBuilder().setColor(GREEN).setTitle('✅ Correct!')
          .setDescription(`**${q.q}**\n\n✅ The answer was **${q.a}**!\n\n**Won:** ⏣ +${(bet * 2).toLocaleString()}`)
          .setTimestamp();
        await i.update({ embeds: [e], components: [disabledRow()] });
      } else {
        const e = new EmbedBuilder().setColor(RED).setTitle('❌ Wrong!')
          .setDescription(`**${q.q}**\n\n✅ The correct answer was **${q.a}**.\n\n**Lost:** ⏣ -${bet.toLocaleString()}`)
          .setTimestamp();
        await i.update({ embeds: [e], components: [disabledRow()] });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        const e = new EmbedBuilder().setColor(RED).setTitle('⏰ Time\'s up!')
          .setDescription(`The correct answer was **${q.a}**.\n\n**Lost:** ⏣ -${bet.toLocaleString()}`)
          .setTimestamp();
        await interaction.editReply({ embeds: [e], components: [disabledRow()] }).catch(() => {});
      }
    });
  }
};
