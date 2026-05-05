import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../../utils/permissions.js';
import { errorEmbed, PURPLE } from '../../utils/embeds.js';

export default {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages from this channel')
    .addIntegerOption(o => o.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('user').setDescription('Only delete messages from this user').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'mute'))
      return interaction.reply({ embeds: [errorEmbed('You need **Moderator** or above to purge messages.')], ephemeral: true });

    const amount = interaction.options.getInteger('amount');
    const filterUser = interaction.options.getMember('user');

    await interaction.deferReply({ ephemeral: true });

    let messages = await interaction.channel.messages.fetch({ limit: 100 });
    if (filterUser) messages = messages.filter(m => m.author.id === filterUser.id);
    messages = [...messages.values()].slice(0, amount);

    // Filter out messages older than 14 days (Discord limit)
    const twoWeeks = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const deletable = messages.filter(m => m.createdTimestamp > twoWeeks);

    if (!deletable.length) {
      return interaction.editReply({ embeds: [errorEmbed('No messages found to delete (messages may be over 14 days old).')] });
    }

    const deleted = await interaction.channel.bulkDelete(deletable, true);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🗑️ Messages Purged')
      .setDescription(
        `Successfully deleted **${deleted.size}** message(s)${filterUser ? ` from ${filterUser}` : ''}.\n` +
        `Requested by ${interaction.user.tag}`
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
