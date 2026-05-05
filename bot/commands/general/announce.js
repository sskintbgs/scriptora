import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { errorEmbed, PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement embed')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to announce in').setRequired(true).addChannelTypes(ChannelType.GuildText))
    .addStringOption(o => o.setName('title').setDescription('Announcement title').setRequired(true))
    .addStringOption(o => o.setName('color').setDescription('Embed color (hex, e.g. #9B59B6)').setRequired(false))
    .addBooleanOption(o => o.setName('ping_everyone').setDescription('Ping @everyone?').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'config'))
      return interaction.reply({ embeds: [errorEmbed('You need **Head Operator** or above to send announcements.')], ephemeral: true });

    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const colorInput = interaction.options.getString('color') || '#9B59B6';
    const pingEveryone = interaction.options.getBoolean('ping_everyone') ?? false;

    let color = PURPLE;
    try { color = parseInt(colorInput.replace('#', ''), 16); } catch {}

    const modal = new ModalBuilder()
      .setCustomId(`announce_${channel.id}_${color}_${pingEveryone}`)
      .setTitle('Write Announcement')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('body')
            .setLabel('Announcement Body')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Write your announcement here...')
            .setRequired(true)
            .setMaxLength(2000)
        )
      );

    await interaction.showModal(modal);
  },

  async handleModal(interaction, client) {
    const parts = interaction.customId.split('_');
    const channelId = parts[1];
    const color = parseInt(parts[2]);
    const pingEveryone = parts[3] === 'true';
    const body = interaction.fields.getTextInputValue('body');
    const title = '📢 Announcement';

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) return interaction.reply({ embeds: [errorEmbed('Channel not found.')], ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(color || PURPLE)
      .setTitle(title)
      .setDescription(body)
      .setFooter({ text: `Announced by ${interaction.user.tag}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Open Scriptora').setURL('https://scriptora-mh3b.onrender.com').setStyle(ButtonStyle.Link).setEmoji('🔗')
    );

    await channel.send({ content: pingEveryone ? '@everyone' : undefined, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Announcement sent to ${channel}!`, ephemeral: true });
  }
};
