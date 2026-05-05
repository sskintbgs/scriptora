import { Events } from 'discord.js';
import { getConfig } from '../utils/config.js';
import { errorEmbed } from '../utils/embeds.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {

    // ── Slash Commands ──
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // Cooldown system
      const { cooldowns } = client;
      if (!cooldowns.has(command.data.name)) cooldowns.set(command.data.name, new Map());
      const timestamps = cooldowns.get(command.data.name);
      const cooldownAmount = (command.cooldown || 3) * 1000;
      if (timestamps.has(interaction.user.id)) {
        const expiration = timestamps.get(interaction.user.id) + cooldownAmount;
        if (Date.now() < expiration) {
          const remaining = ((expiration - Date.now()) / 1000).toFixed(1);
          return interaction.reply({ embeds: [errorEmbed(`Please wait **${remaining}s** before using \`/${command.data.name}\` again.`)], ephemeral: true });
        }
      }
      timestamps.set(interaction.user.id, Date.now());
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[Bot] Command error [${interaction.commandName}]:`, err);
        const reply = { embeds: [errorEmbed('Something went wrong. Please try again.')], ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
        else await interaction.reply(reply);
      }
      return;
    }

    // ── Button Interactions ──
    if (interaction.isButton()) {
      // Reaction role buttons (rr_ prefix)
      if (interaction.customId.startsWith('rr_')) {
        const roleId = interaction.customId.replace('rr_', '');
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ embeds: [errorEmbed('Role not found.')], ephemeral: true });
        const member = interaction.member;
        try {
          if (member.roles.cache.has(roleId)) {
            await member.roles.remove(role);
            return interaction.reply({ content: `✅ Removed **${role.name}**`, ephemeral: true });
          } else {
            await member.roles.add(role);
            return interaction.reply({ content: `✅ You now have **${role.name}**`, ephemeral: true });
          }
        } catch (err) {
          return interaction.reply({ embeds: [errorEmbed(`Could not assign role: ${err.message}`)], ephemeral: true });
        }
      }
    }

    // ── Modal Submissions ──
    if (interaction.isModalSubmit()) {
      // Embed builder modal
      if (interaction.customId === 'embed_create') {
        const embedCmd = client.commands.get('embed');
        if (embedCmd?.handleModal) return embedCmd.handleModal(interaction, client);
      }

      // Announce modal
      if (interaction.customId.startsWith('announce_')) {
        const announceCmd = client.commands.get('announce');
        if (announceCmd?.handleModal) return announceCmd.handleModal(interaction, client);
      }
    }

    // ── Select Menu (help pages etc) ──
    if (interaction.isStringSelectMenu()) {
      // Help menu is handled by its own collector — no action needed here
      return;
    }

    // ── Autocomplete ──
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        try { await command.autocomplete(interaction); } catch {}
      }
    }
  }
};
