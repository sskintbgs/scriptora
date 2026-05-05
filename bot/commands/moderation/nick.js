import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Change a member\'s nickname')
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(o => o.setName('nickname').setDescription('New nickname (leave empty to reset)').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'mute'))
      return interaction.reply({ embeds: [errorEmbed('You need **Moderator** or above.')], ephemeral: true });

    const target = interaction.options.getMember('user');
    const nickname = interaction.options.getString('nickname') || null;
    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found.')], ephemeral: true });

    const old = target.nickname || target.user.username;
    await target.setNickname(nickname);

    const embed = new EmbedBuilder().setColor(0x9B59B6).setTitle('📝 Nickname Changed')
      .setDescription(`**${old}** → **${nickname || target.user.username}**`)
      .setFooter({ text: `Changed by ${interaction.user.tag}` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
