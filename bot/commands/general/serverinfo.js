import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { getConfig } from '../../utils/config.js';
import { PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show information about this server'),

  async execute(interaction) {
    await interaction.deferReply();
    const { guild } = interaction;
    await guild.members.fetch();

    const cfg = getConfig();
    const onlineMembers = guild.members.cache.filter(m => m.presence?.status && m.presence.status !== 'offline').size;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    const humanCount = guild.memberCount - botCount;
    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const verif = ['None', 'Low', 'Medium', 'High', 'Very High'][guild.verificationLevel] || 'Unknown';

    let scriptCount = '?';
    try {
      const res = await fetch(`${cfg.API_URL}/api/stats`);
      const data = await res.json();
      scriptCount = data.totalScripts || 0;
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .setImage(guild.bannerURL({ size: 1024 }) || null)
      .addFields(
        { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👥 Members', value: `\`${guild.memberCount.toLocaleString()}\` total\n\`${humanCount}\` humans • \`${botCount}\` bots`, inline: true },
        { name: '🟢 Online', value: `\`${onlineMembers.toLocaleString()}\``, inline: true },
        { name: '🏷️ Roles', value: `\`${guild.roles.cache.size}\``, inline: true },
        { name: '💬 Channels', value: `\`${textChannels}\` text • \`${voiceChannels}\` voice`, inline: true },
        { name: '🛡️ Verification', value: verif, inline: true },
        { name: '📜 Scripts on Scriptora', value: `\`${scriptCount}\``, inline: true },
        { name: '🔗 Boost Level', value: `Level ${guild.premiumTier} • \`${guild.premiumSubscriptionCount || 0}\` boosts`, inline: true },
      )
      .setFooter({ text: 'Scriptora Bot • Server Info' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Open Scriptora').setURL(cfg.WEBSITE_URL).setStyle(ButtonStyle.Link).setEmoji('🔗'),
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
