import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { PURPLE, errorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create a custom embed message (opens a modal)'),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'warn'))
      return interaction.reply({ embeds: [errorEmbed('You need **Support** or above.')], ephemeral: true });

    const modal = new ModalBuilder().setCustomId('embed_create').setTitle('Create Custom Embed')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('title').setLabel('Title').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(256)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(2000)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('color').setLabel('Color (hex e.g. #9B59B6)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(7).setPlaceholder('#9B59B6')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('footer').setLabel('Footer text').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(200)
        ),
      );
    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    const title = interaction.fields.getTextInputValue('title');
    const description = interaction.fields.getTextInputValue('description');
    const colorInput = interaction.fields.getTextInputValue('color') || '#9B59B6';
    const footer = interaction.fields.getTextInputValue('footer');

    let color = PURPLE;
    try { color = parseInt(colorInput.replace('#', ''), 16); } catch {}

    const embed = new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
    if (footer) embed.setFooter({ text: footer });

    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Embed sent!', ephemeral: true });
  }
};
