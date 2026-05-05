import { Events, EmbedBuilder } from 'discord.js';
import { getConfig } from '../utils/config.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(member, client) {
    const cfg = getConfig();
    if (!cfg.channels.logs) return;

    const logCh = member.guild.channels.cache.get(cfg.channels.logs);
    if (!logCh) return;

    const rolesHeld = member.roles.cache
      .filter(r => r.id !== member.guild.id)
      .map(r => r.name)
      .join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('📤 Member Left')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: 'Joined', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
        { name: 'Roles Held', value: rolesHeld.length > 200 ? rolesHeld.substring(0, 200) + '...' : rolesHeld },
      )
      .setFooter({ text: `${member.guild.memberCount} members remaining` })
      .setTimestamp();

    await logCh.send({ embeds: [embed] });
  }
};
