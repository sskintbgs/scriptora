import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getConfig, updateConfig } from '../../utils/config.js';
import { errorEmbed, PURPLE } from '../../utils/embeds.js';

const ROLE_HIERARCHY = [
  { name: 'OG Member',         color: 0x95A5A6, hoist: false },
  { name: 'OG+ Member',        color: 0x7F8C8D, hoist: false },
  { name: 'Staff',             color: 0x3498DB, hoist: true },
  { name: 'Trial Support',     color: 0x1ABC9C, hoist: true },
  { name: 'Support',           color: 0x2ECC71, hoist: true },
  { name: 'Moderator',         color: 0xF1C40F, hoist: true },
  { name: 'Senior Moderator',  color: 0xE67E22, hoist: true },
  { name: 'Head Moderator',    color: 0xE74C3C, hoist: true },
  { name: 'Junior Operator',   color: 0x9B59B6, hoist: true },
  { name: 'Operator',          color: 0x8E44AD, hoist: true },
  { name: 'Head Operator',     color: 0x6C3483, hoist: true },
  { name: 'Admin',             color: 0xFF0000, hoist: true },
];

export default {
  data: new SlashCommandBuilder()
    .setName('startup')
    .setDescription('Create all Scriptora staff roles and save their IDs (Owner only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const cfg = getConfig();
    if (interaction.user.id !== cfg.OWNER_ID)
      return interaction.reply({ embeds: [errorEmbed('Only the bot owner can run `/startup`.')], ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const createdRoles = {};
    const log = [];

    for (let i = 0; i < ROLE_HIERARCHY.length; i++) {
      const roleDef = ROLE_HIERARCHY[i];
      let existing = guild.roles.cache.find(r => r.name === roleDef.name);

      if (existing) {
        createdRoles[roleDef.name] = existing.id;
        log.push(`♻️ **${roleDef.name}** — already exists (\`${existing.id}\`)`);
      } else {
        try {
          const role = await guild.roles.create({
            name: roleDef.name,
            color: roleDef.color,
            hoist: roleDef.hoist,
            mentionable: false,
            position: i + 1,
            reason: 'Scriptora /startup — auto role creation',
          });
          createdRoles[roleDef.name] = role.id;
          log.push(`✅ **${roleDef.name}** — created (\`${role.id}\`)`);
        } catch (err) {
          log.push(`❌ **${roleDef.name}** — failed: ${err.message}`);
        }
      }
    }

    // Save role IDs to config
    updateConfig({
      roleIds: createdRoles,
      configured: true,
      roles: Object.fromEntries(
        ROLE_HIERARCHY.map(r => [r.name.toUpperCase().replace(/[^A-Z]/g, '_'), r.name])
      ),
    });

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🚀 Scriptora Server Setup Complete')
      .setDescription(
        `Created/verified **${ROLE_HIERARCHY.length}** staff roles:\n\n` +
        log.join('\n') +
        `\n\n✅ All role IDs have been saved to config.`
      )
      .addFields(
        { name: '📋 Next Steps', value:
          '1. Use `/setup welcome #channel` to set welcome channel\n' +
          '2. Use `/setup logs #channel` to set log channel\n' +
          '3. Use `/setup stat_members` to set stat VCs\n' +
          '4. Use `/reactionrole create` to set up role selection\n' +
          '5. Use `/configroles set` to customize permissions'
        }
      )
      .setFooter({ text: 'Scriptora Bot • Server Setup' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
