import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let botClient = null;

export async function startBot() {
  if (!process.env.DISCORD_TOKEN) {
    console.log('⚠️  DISCORD_TOKEN not set — bot will not start.');
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
  });

  client.commands = new Collection();
  client.cooldowns = new Collection();

  // Load commands
  const commandFolders = readdirSync(path.join(__dirname, 'commands'));
  for (const folder of commandFolders) {
    const files = readdirSync(path.join(__dirname, 'commands', folder)).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const { default: command } = await import(`./commands/${folder}/${file}`);
        if (command?.data?.name) client.commands.set(command.data.name, command);
      } catch (e) {
        console.error(`[Bot] Failed to load command ${file}:`, e.message);
      }
    }
  }

  // Load events
  const eventFiles = readdirSync(path.join(__dirname, 'events')).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    try {
      const { default: event } = await import(`./events/${file}`);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    } catch (e) {
      console.error(`[Bot] Failed to load event ${file}:`, e.message);
    }
  }

  await client.login(process.env.DISCORD_TOKEN);
  botClient = client;
  return client;
}

export function getBotClient() { return botClient; }
