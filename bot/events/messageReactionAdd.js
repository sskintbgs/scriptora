import { Events } from 'discord.js';
import { getConfig } from '../utils/config.js';

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction, user, client) {
    if (user.bot) return;
    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }

    const cfg = getConfig();
    const rr = cfg.reaction_roles.find(
      r => r.messageId === reaction.message.id && r.emoji === reaction.emoji.name
    );
    if (!rr) return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(rr.roleId);
    if (!role) return;

    await member.roles.add(role).catch(console.error);
  }
};
