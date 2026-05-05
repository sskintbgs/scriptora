import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { getConfig } from '../../utils/config.js';
import { PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show live Scriptora platform statistics'),

  async execute(interaction) {
    await interaction.deferReply();
    const cfg = getConfig();

    try {
      const res = await fetch(`${cfg.API_URL}/api/stats`);
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('📊 Scriptora — Live Statistics')
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '📜 Total Scripts', value: `\`${data.totalScripts || 0}\``, inline: true },
          { name: '✅ Verified', value: `\`${data.verifiedScripts || 0}\``, inline: true },
          { name: '⏳ Pending', value: `\`${data.pendingScripts || 0}\``, inline: true },
          { name: '👥 Users', value: `\`${data.totalUsers || 0}\``, inline: true },
          { name: '🟢 Online', value: `\`${data.onlineUsers || 0}\``, inline: true },
          { name: '🌐 Visitors', value: `\`${data.totalVisitors || 0}\``, inline: true },
          { name: '👁️ Total Views', value: `\`${(data.totalViews || 0).toLocaleString()}\``, inline: true },
          { name: '❤️ Total Likes', value: `\`${data.totalLikes || 0}\``, inline: true },
          { name: '🏠 Discord Members', value: `\`${interaction.guild.memberCount.toLocaleString()}\``, inline: true },
        )
        .setFooter({ text: 'Scriptora Bot • Live stats update every 5 minutes' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Open Scriptora').setURL(cfg.WEBSITE_URL).setStyle(ButtonStyle.Link).setEmoji('🔗'),
        new ButtonBuilder().setLabel('Join Discord').setURL('https://discord.gg/DhZwz3fzbD').setStyle(ButtonStyle.Link).setEmoji('💬'),
      );

      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch {
      return interaction.editReply({ content: '❌ Could not fetch stats from Scriptora.' });
    }
  }
};
