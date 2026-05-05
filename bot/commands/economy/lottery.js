import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBalance, removeMoney } from '../../utils/economy.js';
import { getPool, savePool } from '../../utils/lottery.js';
import { PURPLE, errorEmbed } from '../../utils/embeds.js';

const TICKET_COST = 100;

export default {
  data: new SlashCommandBuilder()
    .setName('lottery')
    .setDescription('Buy a lottery ticket or view the pool')
    .addSubcommand(s => s.setName('buy').setDescription(`Buy a ticket for ⏣ ${TICKET_COST}`))
    .addSubcommand(s => s.setName('pool').setDescription('View the current jackpot and your tickets')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const pool = getPool();

    if (sub === 'pool') {
      const myTickets = pool.tickets.filter(t => t === interaction.user.id).length;
      const nextDraw = Math.floor(pool.nextDraw / 1000);
      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('🎟️ Scriptora Lottery')
        .addFields(
          { name: '🏆 Jackpot',       value: `⏣ ${(pool.tickets.length * TICKET_COST).toLocaleString()}`,   inline: true },
          { name: '🎫 Total Tickets', value: `${pool.tickets.length}`,                                       inline: true },
          { name: '🔖 Your Tickets',  value: `${myTickets}`,                                                 inline: true },
          { name: '⏰ Next Draw',      value: `<t:${nextDraw}:R>`,                                           inline: true },
        )
        .setFooter({ text: 'More tickets = higher chance of winning!' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    // Buy a ticket
    const eco = getBalance(interaction.user.id);
    if (eco.balance < TICKET_COST)
      return interaction.reply({ embeds: [errorEmbed(`You need ⏣ ${TICKET_COST} to buy a ticket.`)], ephemeral: true });

    removeMoney(interaction.user.id, TICKET_COST);
    pool.tickets.push(interaction.user.id);
    savePool(pool);

    const jackpot = pool.tickets.length * TICKET_COST;
    const myTickets = pool.tickets.filter(t => t === interaction.user.id).length;
    const chance = ((myTickets / pool.tickets.length) * 100).toFixed(1);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🎟️ Ticket Purchased!')
      .setDescription(`Good luck! You now have **${myTickets}** ticket(s).`)
      .addFields(
        { name: '🏆 Current Jackpot', value: `⏣ ${jackpot.toLocaleString()}`, inline: true },
        { name: '📊 Your Win Chance', value: `${chance}%`,                     inline: true },
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
