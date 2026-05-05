import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let botClient = null;

export async function startBot() {
  console.log('[Bot] Initializing startBot...');
  if (!process.env.DISCORD_TOKEN) {
    console.log('⚠️  DISCORD_TOKEN not set — bot will not start.');
    return;
  }
  const token = process.env.DISCORD_TOKEN.trim();
  console.log(`[Bot] Token found (length: ${token.length}, prefix: ${token.substring(0, 5)}...${token.substring(token.length - 5)})`);

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
  console.log('[Bot] Loading commands...');
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
  console.log(`[Bot] Loaded ${client.commands.size} commands.`);

  // Load events
  console.log('[Bot] Loading events...');
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
  console.log(`[Bot] Loaded ${eventFiles.length} events.`);

  // Loading events
  // ... (existing code)

  // ── Network Connectivity Test ───────────────────────────────
  console.log('[Bot] Running network connectivity test...');
  try {
    const dns = await import('node:dns/promises');
    const lookup = await dns.lookup('gateway.discord.gg');
    console.log(`[Bot] DNS Lookup successful: ${lookup.address}`);
    
    const fetchRes = await fetch('https://discord.com/api/v10/gateway');
    const fetchJson = await fetchRes.json();
    console.log(`[Bot] API Gateway reachability: ${fetchRes.status} (URL: ${fetchJson.url})`);
  } catch (err) {
    console.error(`[Bot] Network test FAILED: ${err.message}`);
  }

  // Debugging gateway connection
  client.on('debug', (m) => {
    if (m.includes('heartbeat') || m.includes('Latency')) return;
    console.log(`[Bot Debug] ${m}`);
  });

  console.log('[Bot] Attempting to login to Discord...');
  try {
    // Add a race condition to timeout if login takes > 30s
    const loginPromise = client.login(token);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Login timed out after 30 seconds')), 30_000)
    );

    await Promise.race([loginPromise, timeoutPromise]);
    console.log('[Bot] Successfully logged in to Discord.');
  } catch (err) {
    console.error('[Bot] Login failed:', err.message);
    throw err;
  }
  
  botClient = client;
  return client;
}

export function getBotClient() { return botClient; }
