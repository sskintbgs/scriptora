import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isOwnerDiscordId } from '../../utils/permissions.js';
import { getConfig } from '../../utils/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get info about a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to look up').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user') || interaction.member;
    const user = target.user;
    const cfg = getConfig();
    const COLOR = 0x9B59B6;

    const roles = target.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `<@&${r.id}>`)
      .slice(0, 10)
      .join(', ') || 'None';

    // Determine staff level from config roles
    const roleMap = [
      cfg.roles?.ADMIN, cfg.roles?.HEAD_OP, cfg.roles?.OPERATOR,
      cfg.roles?.JUNIOR_OP, cfg.roles?.HEAD_MOD, cfg.roles?.SENIOR_MOD,
      cfg.roles?.MODERATOR, cfg.roles?.SUPPORT, cfg.roles?.TRIAL_SUPPORT,
      cfg.roles?.STAFF, cfg.roles?.OG_PLUS, cfg.roles?.OG_MEMBER,
    ].filter(Boolean);

    const staffRole = target.roles.cache.find(r => roleMap.includes(r.name));
    const isOwner = isOwnerDiscordId(user.id);

    const embed = new EmbedBuilder()
      .setColor(isOwner ? 0xFFD700 : COLOR)
      .setTitle(`${isOwner ? '👑' : '👤'} ${user.username}${user.discriminator !== '0' ? `#${user.discriminator}` : ''}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🆔 User ID',        value: `\`${user.id}\``,                                        inline: true },
        { name: '📅 Joined Discord', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,     inline: true },
        { name: '📥 Joined Server',  value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`,    inline: true },
        { name: '🎭 Nickname',       value: target.nickname || 'None',                               inline: true },
        { name: '🏅 Staff Role',     value: isOwner ? '👑 **Bot Owner**' : (staffRole?.name || 'Regular Member'), inline: true },
        { name: '🤖 Bot?',           value: user.bot ? 'Yes' : 'No',                                  inline: true },
        { name: `🏷️ Roles (${target.roles.cache.size - 1})`, value: roles },
      )
      .setFooter({ text: 'Scriptora Bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
