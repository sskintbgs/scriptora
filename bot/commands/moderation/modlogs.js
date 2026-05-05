import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { errorEmbed, PURPLE } from '../../utils/embeds.js';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WARNS_PATH = path.join(__dirname, '..', '..', 'warns.json');

function getWarns() {
  if (!existsSync(WARNS_PATH)) return {};
  try { return JSON.parse(readFileSync(WARNS_PATH, 'utf8')); } catch { return {}; }
}

export default {
  data: new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('View a member\'s warning history')
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'warn'))
      return interaction.reply({ embeds: [errorEmbed('You need **Support** or above to view mod logs.')], ephemeral: true });

    const target = interaction.options.getMember('user') || interaction.options.getUser('user');
    const userId = target.id || target.user?.id;
    const tag = target.user?.tag || target.tag || 'Unknown';
    const warns = getWarns();
    const userWarns = warns[userId] || [];

    if (!userWarns.length) {
      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle(`📋 Mod Logs — ${tag}`)
        .setDescription(`✅ This user has **no warnings**.`)
        .setThumbnail(target.user?.displayAvatarURL({ dynamic: true }) || target.displayAvatarURL?.({ dynamic: true }) || null)
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const pages = [];
    const perPage = 5;
    for (let i = 0; i < userWarns.length; i += perPage) {
      const chunk = userWarns.slice(i, i + perPage);
      const embed = new EmbedBuilder()
        .setColor(0xF1C40F)
        .setTitle(`⚠️ Mod Logs — ${tag}`)
        .setThumbnail(target.user?.displayAvatarURL({ dynamic: true }) || target.displayAvatarURL?.({ dynamic: true }) || null)
        .setDescription(chunk.map((w, idx) => {
          const num = i + idx + 1;
          const ts = Math.floor(new Date(w.date).getTime() / 1000);
          return `**${num}.** ${w.reason}\n👮 ${w.moderator} • <t:${ts}:R>`;
        }).join('\n\n'))
        .setFooter({ text: `Page ${Math.floor(i / perPage) + 1}/${Math.ceil(userWarns.length / perPage)} • ${userWarns.length} total warning(s)` })
        .setTimestamp();
      pages.push(embed);
    }

    // If only 1 page, just send it
    if (pages.length === 1) {
      return interaction.reply({ embeds: [pages[0]], ephemeral: true });
    }

    // Multi-page with buttons
    let currentPage = 0;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ml_prev').setLabel('◀ Previous').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('ml_next').setLabel('Next ▶').setStyle(ButtonStyle.Primary),
    );

    const reply = await interaction.reply({ embeds: [pages[0]], components: [row], ephemeral: true, fetchReply: true });

    const collector = reply.createMessageComponentCollector({ time: 120000 });
    collector.on('collect', async (btn) => {
      if (btn.customId === 'ml_prev') currentPage--;
      if (btn.customId === 'ml_next') currentPage++;

      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ml_prev').setLabel('◀ Previous').setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0),
        new ButtonBuilder().setCustomId('ml_next').setLabel('Next ▶').setStyle(ButtonStyle.Primary).setDisabled(currentPage === pages.length - 1),
      );

      await btn.update({ embeds: [pages[currentPage]], components: [newRow] });
    });
  }
};
