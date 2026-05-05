import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { errorEmbed, PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll in this channel')
    .addStringOption(o => o.setName('question').setDescription('The poll question').setRequired(true))
    .addStringOption(o => o.setName('option1').setDescription('Option 1').setRequired(true))
    .addStringOption(o => o.setName('option2').setDescription('Option 2').setRequired(true))
    .addStringOption(o => o.setName('option3').setDescription('Option 3').setRequired(false))
    .addStringOption(o => o.setName('option4').setDescription('Option 4').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'manage_tickets'))
      return interaction.reply({ embeds: [errorEmbed('You need **Support** or above to create polls.')], ephemeral: true });

    const question = interaction.options.getString('question');
    const options = [
      interaction.options.getString('option1'),
      interaction.options.getString('option2'),
      interaction.options.getString('option3'),
      interaction.options.getString('option4'),
    ].filter(Boolean);

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle(`📊 Poll — ${question}`)
      .setDescription(options.map((opt, i) => `${emojis[i]} **${opt}**`).join('\n\n'))
      .setFooter({ text: `Poll by ${interaction.user.tag} • React to vote!` })
      .setTimestamp();

    await interaction.reply({ content: '✅ Poll created!', ephemeral: true });
    const msg = await interaction.channel.send({ embeds: [embed] });

    for (let i = 0; i < options.length; i++) {
      await msg.react(emojis[i]);
    }
  }
};
