import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { PURPLE } from '../../utils/embeds.js';

const PAGES = {
  general: {
    title: '🔍 General Commands',
    fields: [
      '`/search <query>` — Search scripts on Scriptora',
      '`/stats` — Live platform statistics',
      '`/userinfo [user]` — Member info card',
      '`/serverinfo` — Server details & stats',
      '`/avatar [user]` — Get a user\'s avatar',
      '`/ping` — Bot latency & uptime',
      '`/embed` — Create a custom embed (modal)',
      '`/announce <channel> <title>` — Send announcement (modal)',
      '`/poll <question> <options>` — Create a poll',
      '`/help` — This menu',
    ]
  },
  moderation: {
    title: '🛡️ Moderation Commands',
    fields: [
      '`/kick <user> [reason]` — Kick member (DM sent)',
      '`/ban <user> [reason]` — Ban member (DM sent)',
      '`/unban <user_id>` — Unban by ID',
      '`/warn <user> <reason>` — Issue warning (DM sent)',
      '`/mute <user> <duration>` — Timeout member',
      '`/unmute <user>` — Remove timeout',
      '`/purge <amount> [user]` — Bulk delete messages',
      '`/slowmode <seconds>` — Set channel slowmode',
      '`/lock [channel]` — Lock a channel',
      '`/unlock [channel]` — Unlock a channel',
      '`/nick <user> [name]` — Change nickname',
      '`/role add/remove <user> <role>` — Manage roles',
      '`/modlogs <user>` — View warnings (paginated)',
    ]
  },
  economy: {
    title: '💰 Economy Commands',
    fields: [
      '`/balance [user]` — Check wallet & bank',
      '`/daily` — Claim daily reward (24h cooldown)',
      '`/work` — Work a job (1h cooldown)',
      '`/bank deposit/withdraw <amount>` — Bank management',
      '`/pay <user> <amount>` — Send money to a user',
      '`/gamble <amount>` — Gamble with random multipliers',
      '`/slots <bet>` — Play the slot machine',
      '`/coinflip <choice> <bet>` — Heads or tails',
      '`/blackjack <bet>` — Play blackjack (hit/stand buttons)',
      '`/highlow <bet>` — Higher or lower card game',
      '`/bet <amount>` — Spin the multiplier wheel (0–5×)',
      '`/duel <user> <amount>` — Challenge a user to a duel',
      '`/race <bet> <1-5>` — Bet on an animal race (live!)',
      '`/trivia <bet>` — Answer trivia to win 2× your bet',
      '`/rob <user>` — Attempt to rob another user',
      '`/lottery buy` — Buy a daily lottery ticket (⏣ 100)',
      '`/lottery pool` — View jackpot & your tickets',
      '`/leaderboard` — Top 10 richest members',
    ]
  },
  fun: {
    title: '🎮 Fun Commands',
    fields: [
      '`/8ball <question>` — Ask the magic 8-ball',
      '`/dice [sides] [count]` — Roll dice',
      '`/rps <choice>` — Rock Paper Scissors vs the bot',
    ]
  },
  config: {
    title: '⚙️ Configuration (Owner)',
    fields: [
      '`/startup` — Create all staff roles & save IDs',
      '`/setup view` — View current config',
      '`/setup welcome|logs|rules|general` — Set channels',
      '`/setup stat_members|stat_scripts|stat_online` — Stat VCs',
      '`/reactionrole create|add|list` — Button-based roles',
      '`/configroles view` — View permission mapping',
      '`/configroles set <perm> <roles>` — Set permissions',
    ]
  },
};

function buildPage(key) {
  const page = PAGES[key];
  return new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle(`📖 Scriptora Bot — ${page.title}`)
    .setDescription(page.fields.join('\n'))
    .setFooter({ text: 'Use the dropdown to switch categories' })
    .setTimestamp();
}

function buildSelectMenu(current) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('Choose a category...')
      .addOptions(
        { label: 'General', value: 'general', emoji: '🔍', default: current === 'general' },
        { label: 'Moderation', value: 'moderation', emoji: '🛡️', default: current === 'moderation' },
        { label: 'Economy', value: 'economy', emoji: '💰', default: current === 'economy' },
        { label: 'Fun', value: 'fun', emoji: '🎮', default: current === 'fun' },
        { label: 'Configuration', value: 'config', emoji: '⚙️', default: current === 'config' },
      )
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all Scriptora bot commands'),

  async execute(interaction) {
    const linkRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Scriptora').setURL('https://scriptora-mh3b.onrender.com').setStyle(ButtonStyle.Link).setEmoji('🔗'),
      new ButtonBuilder().setLabel('Discord').setURL('https://discord.gg/DhZwz3fzbD').setStyle(ButtonStyle.Link).setEmoji('💬'),
    );

    const reply = await interaction.reply({
      embeds: [buildPage('general')],
      components: [buildSelectMenu('general'), linkRow],
      ephemeral: true,
      fetchReply: true,
    });

    const collector = reply.createMessageComponentCollector({ time: 300000 });
    collector.on('collect', async (i) => {
      if (!i.isStringSelectMenu()) return;
      const selected = i.values[0];
      await i.update({
        embeds: [buildPage(selected)],
        components: [buildSelectMenu(selected), linkRow],
      });
    });
  }
};
