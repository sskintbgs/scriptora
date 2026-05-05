import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get a user\'s avatar')
    .addUserOption(o => o.setName('user').setDescription('User to get avatar of').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user') || interaction.member;
    const user = target.user;

    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 4096 });
    const serverAvatarUrl = target.displayAvatarURL({ dynamic: true, size: 4096 });

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle(`🖼️ ${user.username}'s Avatar`)
      .setImage(avatarUrl)
      .setFooter({ text: 'Scriptora Bot • Click below to open full size' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Global Avatar').setURL(avatarUrl).setStyle(ButtonStyle.Link),
    );
    if (serverAvatarUrl !== avatarUrl) {
      row.addComponents(new ButtonBuilder().setLabel('Server Avatar').setURL(serverAvatarUrl).setStyle(ButtonStyle.Link));
    }

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
