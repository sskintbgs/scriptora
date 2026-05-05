import { Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { getConfig } from '../utils/config.js';
import { PURPLE } from '../utils/embeds.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member, client) {
    const cfg = getConfig();
    if (!cfg.channels.welcome) return;

    const channel = member.guild.channels.cache.get(cfg.channels.welcome);
    if (!channel) return;

    let scriptCount = '?';
    let totalUsers = '?';
    try {
      const res = await fetch(`${cfg.API_URL}/api/stats`);
      const data = await res.json();
      scriptCount = (data.totalScripts || 0).toLocaleString();
      totalUsers = (data.totalUsers || 0).toLocaleString();
    } catch {}

    const memberNumber = member.guild.memberCount;

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setAuthor({ name: 'Scriptora', iconURL: client.user.displayAvatarURL() })
      .setTitle(`Welcome to ${member.guild.name}! 🎉`)
      .setDescription(
        `Hey ${member}, we're glad you're here!\n\n` +
        `**Here's how to get started:**\n` +
        `1. 📖 Read <#${cfg.channels.rules || cfg.channels.welcome}> to understand the rules\n` +
        `2. ✅ Complete verification to unlock all channels\n` +
        `3. 🏷️ Grab your roles in <#${cfg.channels.roles || cfg.channels.welcome}>\n` +
        `4. 💬 Introduce yourself in <#${cfg.channels.general || cfg.channels.welcome}>\n\n` +
        `*Need help? Open a ticket in #support*`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '👥 You are member', value: `**#${memberNumber.toLocaleString()}**`, inline: true },
        { name: '📜 Scripts Available', value: `**${scriptCount}**`, inline: true },
        { name: '🌐 Platform Users', value: `**${totalUsers}**`, inline: true },
      )
      .setImage('https://i.imgur.com/placeholder.png') // Replace with your banner
      .setFooter({ text: `Scriptora • ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Open Scriptora').setURL(cfg.WEBSITE_URL).setStyle(ButtonStyle.Link).setEmoji('🔗'),
      new ButtonBuilder().setLabel('Join Discord').setURL('https://discord.gg/DhZwz3fzbD').setStyle(ButtonStyle.Link).setEmoji('💬'),
    );

    await channel.send({ content: `${member}`, embeds: [embed], components: [row] });

    // Log in log channel
    if (cfg.channels.logs) {
      const logCh = member.guild.channels.cache.get(cfg.channels.logs);
      if (logCh) {
        const logEmbed = new EmbedBuilder()
          .setColor(0x2ECC71)
          .setTitle('📥 Member Joined')
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Account Age', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Member #', value: `${memberNumber.toLocaleString()}`, inline: true },
          )
          .setTimestamp();
        await logCh.send({ embeds: [logEmbed] });
      }
    }
  }
};
