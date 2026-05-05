import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { addMoney, canClaim, setClaimed, getTimeUntilClaim } from '../../utils/economy.js';
import { PURPLE, errorEmbed } from '../../utils/embeds.js';

const JOBS = [
  { job: '🖥️ Fixed a Roblox bug', min: 100, max: 400 },
  { job: '📝 Wrote a new script', min: 200, max: 600 },
  { job: '🔍 Reviewed 5 scripts', min: 150, max: 350 },
  { job: '🎨 Designed a UI', min: 250, max: 500 },
  { job: '🛠️ Debugged server code', min: 300, max: 700 },
  { job: '📦 Uploaded a script pack', min: 200, max: 450 },
  { job: '🧹 Cleaned up old scripts', min: 100, max: 300 },
  { job: '🎓 Taught a new developer', min: 350, max: 800 },
  { job: '🔧 Fixed API endpoints', min: 150, max: 500 },
  { job: '📊 Analyzed platform stats', min: 200, max: 400 },
];

export default {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work a job for some coins'),

  async execute(interaction) {
    if (!canClaim(interaction.user.id, 'work')) {
      const ms = getTimeUntilClaim(interaction.user.id, 'work');
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      return interaction.reply({
        embeds: [errorEmbed(`You're still tired from your last shift!\nTry again in **${mins}m ${secs}s**.`)],
        ephemeral: true
      });
    }

    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    const amount = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

    addMoney(interaction.user.id, amount);
    setClaimed(interaction.user.id, 'work');

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('💼 Work Complete!')
      .setDescription(`${job.job} and earned **⏣ ${amount.toLocaleString()}**!`)
      .setFooter({ text: 'You can work again in 1 hour' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
