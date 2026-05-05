import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { getConfig } from '../../utils/config.js';
import { PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for scripts on Scriptora')
    .addStringOption(o =>
      o.setName('query').setDescription('Script name, game, or keyword').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const cfg = getConfig();
    const query = interaction.options.getString('query').toLowerCase();

    try {
      const res = await fetch(`${cfg.API_URL}/api/db/scripts`);
      const scripts = await res.json();

      const results = scripts.filter(s =>
        s.verified && (
          s.title?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.author?.toLowerCase().includes(query) ||
          s.game?.toLowerCase().includes(query)
        )
      ).slice(0, 5);

      if (!results.length) {
        const embed = new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('🔍 No scripts found')
          .setDescription(`No public scripts matched **"${query}"**.\nTry a broader term or search directly on Scriptora.`)
          .setFooter({ text: 'Scriptora | script-search' })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel('Search on Scriptora').setURL(cfg.WEBSITE_URL).setStyle(ButtonStyle.Link).setEmoji('🔗')
        );

        return interaction.editReply({ embeds: [embed], components: [row] });
      }

      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle(`🔍 Search results for "${query}"`)
        .setDescription(
          results.map((s, i) => {
            const desc = (s.description || 'No description').substring(0, 60);
            return `**${i + 1}. ${s.title || 'Untitled'}** — *${s.game || 'Unknown game'}*\n` +
              `   👤 ${s.author || '?'} • ⭐ ${s.likes || 0} • 👁️ ${s.views || 0}\n` +
              `   ${desc}${desc.length >= 60 ? '...' : ''}`;
          }).join('\n\n')
        )
        .setFooter({ text: `Scriptora | ${results.length} result(s) found` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('View All on Scriptora').setURL(cfg.WEBSITE_URL).setStyle(ButtonStyle.Link).setEmoji('🔗'),
        new ButtonBuilder().setLabel('Join Discord').setURL('https://discord.gg/DhZwz3fzbD').setStyle(ButtonStyle.Link).setEmoji('💬'),
      );

      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error('Search error:', err);
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setDescription('❌ Failed to reach Scriptora API. Try again later.');
      return interaction.editReply({ embeds: [embed] });
    }
  }
};
