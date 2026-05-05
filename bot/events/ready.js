import { EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getConfig } from '../utils/config.js';
import { getPool, savePool } from '../utils/lottery.js';
import { addMoney } from '../utils/economy.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Scriptora Bot is online as ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: 'scriptora.xyz | /help', type: 3 }],
      status: 'online',
    });
    startStatUpdater(client);
    startLotteryDraw(client);
  }
};

// ── Stat VC Updater ─────────────────────────────────────────
async function startStatUpdater(client) {
  const update = async () => {
    try {
      const cfg = getConfig();
      for (const [, g] of client.guilds.cache) {
        try { await g.members.fetch(); } catch {}

        const everyone = g.roles.everyone;

        // View-only permissions for stat VCs (can see, cannot connect/join)
        const viewOnlyPerms = [
          { id: everyone.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages] }
        ];

        if (cfg.stat_channels?.members) {
          const ch = g.channels.cache.get(cfg.stat_channels.members);
          if (ch && ch.type === ChannelType.GuildVoice) {
            await ch.setName(`👥 Members: ${g.memberCount.toLocaleString()}`).catch(() => {});
            await ch.permissionOverwrites.set(viewOnlyPerms).catch(() => {});
          }
        }

        if (cfg.stat_channels?.scripts) {
          const ch = g.channels.cache.get(cfg.stat_channels.scripts);
          if (ch && ch.type === ChannelType.GuildVoice) {
            try {
              const res = await fetch(`${cfg.API_URL}/api/stats`);
              const data = await res.json();
              await ch.setName(`📜 Scripts: ${(data.totalScripts || 0).toLocaleString()}`).catch(() => {});
              await ch.permissionOverwrites.set(viewOnlyPerms).catch(() => {});
            } catch {}
          }
        }

        if (cfg.stat_channels?.online) {
          const ch = g.channels.cache.get(cfg.stat_channels.online);
          if (ch && ch.type === ChannelType.GuildVoice) {
            const online = g.members.cache.filter(m => m.presence?.status === 'online').size;
            await ch.setName(`🟢 Online: ${online}`).catch(() => {});
            await ch.permissionOverwrites.set(viewOnlyPerms).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.error('[StatUpdater] Error:', e.message);
    }
  };

  await update();
  setInterval(update, 5 * 60 * 1000); // Every 5 min
  console.log('📊 Stat VC updater started (5 min interval)');
}

// ── Daily Lottery Draw ──────────────────────────────────────
async function startLotteryDraw(client) {
  const draw = async () => {
    try {
      const pool = getPool();
      if (!pool.tickets.length) {
        pool.nextDraw = Date.now() + 86400000;
        savePool(pool);
        return;
      }

      const winnerId = pool.tickets[Math.floor(Math.random() * pool.tickets.length)];
      const prize    = pool.tickets.length * 100;
      addMoney(winnerId, prize);

      const cfg = getConfig();

      for (const [, g] of client.guilds.cache) {
        const ch = cfg.channels?.logs
          ? g.channels.cache.get(cfg.channels.logs)
          : g.channels.cache.find(c => c.isTextBased?.() && (c.name.includes('general') || c.name.includes('bot')));
        if (!ch) continue;

        let winnerMention = `<@${winnerId}>`;
        try { const u = await client.users.fetch(winnerId); winnerMention = `${u} (**${u.tag}**)`; } catch {}

        const embed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle('🎟️ Daily Lottery Draw!')
          .setDescription(`🏆 ${winnerMention} wins the jackpot!\n\n💰 **Prize:** ⏣ ${prize.toLocaleString()}\n🎫 **Tickets sold:** ${pool.tickets.length}`)
          .setTimestamp();

        await ch.send({ embeds: [embed] }).catch(() => {});
      }

      pool.tickets = [];
      pool.nextDraw = Date.now() + 86400000;
      savePool(pool);
    } catch (e) {
      console.error('[Lottery] Draw error:', e.message);
    }
  };

  const pool = getPool();
  const delay = Math.max(5000, pool.nextDraw - Date.now());
  setTimeout(() => { draw(); setInterval(draw, 86400000); }, delay);
  console.log(`🎟️  Lottery draw scheduled in ${Math.round(delay / 3600000)}h`);
}
