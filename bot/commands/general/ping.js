import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PURPLE } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s latency and API response time'),

  async execute(interaction, client) {
    const start = Date.now();
    await interaction.deferReply();
    const end = Date.now();

    const wsLatency = client.ws.ping;
    const apiLatency = end - start;

    const getStatus = (ms) => ms < 100 ? '🟢 Excellent' : ms < 200 ? '🟡 Good' : ms < 400 ? '🟠 Fair' : '🔴 Poor';

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '📡 WebSocket Latency', value: `\`${wsLatency}ms\` ${getStatus(wsLatency)}`, inline: true },
        { name: '⚡ API Response', value: `\`${apiLatency}ms\` ${getStatus(apiLatency)}`, inline: true },
        { name: '🤖 Uptime', value: `<t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: 'Scriptora Bot' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
