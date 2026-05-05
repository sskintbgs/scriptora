import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import { getConfig, updateConfig } from '../../utils/config.js';
import { hasPermission } from '../../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure the Scriptora bot for this server')
    .addSubcommand(sub => sub
      .setName('welcome')
      .setDescription('Set the welcome channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('Welcome channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub => sub
      .setName('logs')
      .setDescription('Set the log channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub => sub
      .setName('rules')
      .setDescription('Set the rules channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('Rules channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub => sub
      .setName('general')
      .setDescription('Set the general channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('General channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub => sub
      .setName('roles_channel')
      .setDescription('Set the role-info channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('Role info channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub => sub
      .setName('stat_members')
      .setDescription('Set voice channel to display member count')
      .addChannelOption(opt => opt.setName('channel').setDescription('Voice channel for member stats').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
    )
    .addSubcommand(sub => sub
      .setName('stat_scripts')
      .setDescription('Set voice channel to display script count')
      .addChannelOption(opt => opt.setName('channel').setDescription('Voice channel for script stats').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
    )
    .addSubcommand(sub => sub
      .setName('stat_online')
      .setDescription('Set voice channel to display online member count')
      .addChannelOption(opt => opt.setName('channel').setDescription('Voice channel for online stats').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
    )
    .addSubcommand(sub => sub
      .setName('view')
      .setDescription('View the current configuration')
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'config')) {
      return interaction.reply({ content: '❌ You need to be a **Head Operator** or **Admin** to use this.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const cfg = getConfig();
    const COLOR = 0x9B59B6;

    if (sub === 'view') {
      const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle('⚙️ Scriptora Bot Configuration')
        .addFields(
          { name: '📢 Welcome Channel', value: cfg.channels.welcome ? `<#${cfg.channels.welcome}>` : 'Not set', inline: true },
          { name: '📋 Log Channel', value: cfg.channels.logs ? `<#${cfg.channels.logs}>` : 'Not set', inline: true },
          { name: '📜 Rules Channel', value: cfg.channels.rules ? `<#${cfg.channels.rules}>` : 'Not set', inline: true },
          { name: '💬 General Channel', value: cfg.channels.general ? `<#${cfg.channels.general}>` : 'Not set', inline: true },
          { name: '🏷️ Role Info Channel', value: cfg.channels.roles ? `<#${cfg.channels.roles}>` : 'Not set', inline: true },
          { name: '👥 Member Stat VC', value: cfg.stat_channels.members ? `<#${cfg.stat_channels.members}>` : 'Not set', inline: true },
          { name: '📜 Script Stat VC', value: cfg.stat_channels.scripts ? `<#${cfg.stat_channels.scripts}>` : 'Not set', inline: true },
          { name: '🟢 Online Stat VC', value: cfg.stat_channels.online ? `<#${cfg.stat_channels.online}>` : 'Not set', inline: true },
        )
        .setFooter({ text: 'Scriptora Bot | /setup' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const ch = interaction.options.getChannel('channel');

    const updates = {
      welcome: { channels: { welcome: ch.id } },
      logs: { channels: { logs: ch.id } },
      rules: { channels: { rules: ch.id } },
      general: { channels: { general: ch.id } },
      roles_channel: { channels: { roles: ch.id } },
      stat_members: { stat_channels: { members: ch.id } },
      stat_scripts: { stat_channels: { scripts: ch.id } },
      stat_online: { stat_channels: { online: ch.id } },
    };

    updateConfig(updates[sub]);

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setDescription(`✅ Successfully set **${sub.replace('_', ' ')}** to ${ch}.`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
