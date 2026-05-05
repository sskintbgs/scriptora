import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { getConfig, updateConfig } from '../../utils/config.js';
import { hasPermission } from '../../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Manage reaction roles')
    .addSubcommand(sub => sub
      .setName('create')
      .setDescription('Post a reaction role embed with buttons')
      .addStringOption(opt => opt.setName('title').setDescription('Embed title').setRequired(true))
      .addStringOption(opt => opt.setName('description').setDescription('Embed description').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Add a role button to the last reaction role message')
      .addRoleOption(opt => opt.setName('role').setDescription('Role to give').setRequired(true))
      .addStringOption(opt => opt.setName('label').setDescription('Button label').setRequired(true))
      .addStringOption(opt => opt.setName('emoji').setDescription('Button emoji (optional)').setRequired(false))
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('List all reaction role entries')
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'reaction_roles')) {
      return interaction.reply({ content: '❌ You need **Operator** or above to manage reaction roles.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const cfg = getConfig();
    const COLOR = 0x9B59B6;

    if (sub === 'create') {
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');

      const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: 'Scriptora | Click a button to get/remove your role' })
        .setTimestamp();

      const msg = await interaction.channel.send({ embeds: [embed] });

      updateConfig({ lastRRMessageId: msg.id, lastRRChannelId: interaction.channelId });

      return interaction.reply({ content: `✅ Reaction role embed posted! Use \`/reactionrole add\` to add role buttons.`, ephemeral: true });
    }

    if (sub === 'add') {
      const role = interaction.options.getRole('role');
      const label = interaction.options.getString('label');
      const emoji = interaction.options.getString('emoji');
      const currentCfg = getConfig();

      if (!currentCfg.lastRRMessageId) {
        return interaction.reply({ content: '❌ No reaction role message found. Use `/reactionrole create` first.', ephemeral: true });
      }

      const ch = interaction.guild.channels.cache.get(currentCfg.lastRRChannelId);
      if (!ch) return interaction.reply({ content: '❌ Channel not found.', ephemeral: true });

      const msg = await ch.messages.fetch(currentCfg.lastRRMessageId).catch(() => null);
      if (!msg) return interaction.reply({ content: '❌ Message not found.', ephemeral: true });

      // Build existing buttons + new one
      const existingRows = msg.components.map(row => ActionRowBuilder.from(row));
      const btn = new ButtonBuilder()
        .setCustomId(`rr_${role.id}`)
        .setLabel(label)
        .setStyle(ButtonStyle.Secondary);
      if (emoji) btn.setEmoji(emoji);

      let lastRow = existingRows[existingRows.length - 1];
      if (!lastRow || lastRow.components.length >= 5) {
        lastRow = new ActionRowBuilder();
        existingRows.push(lastRow);
      }
      lastRow.addComponents(btn);

      await msg.edit({ components: existingRows });

      // Save to config
      const rr = currentCfg.reaction_roles || [];
      rr.push({ messageId: msg.id, roleId: role.id, emoji: emoji || null, label });
      updateConfig({ reaction_roles: rr });

      return interaction.reply({ content: `✅ Added **${role.name}** button to the reaction role message.`, ephemeral: true });
    }

    if (sub === 'list') {
      const rr = cfg.reaction_roles || [];
      if (!rr.length) return interaction.reply({ content: '❌ No reaction roles set up.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle('🏷️ Reaction Roles')
        .setDescription(rr.map((r, i) => `**${i + 1}.** <@&${r.roleId}> → \`${r.label}\` ${r.emoji || ''}`).join('\n'))
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
