import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load .env from the project root (one level above /bot)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
  console.error('❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');
  process.exit(1);
}

const commands = [];
const commandsDir = path.join(__dirname, 'commands');
const folders = readdirSync(commandsDir);

for (const folder of folders) {
  const files = readdirSync(path.join(commandsDir, folder)).filter(f => f.endsWith('.js'));
  for (const file of files) {
    try {
      const { default: cmd } = await import(`./commands/${folder}/${file}`);
      if (cmd?.data) {
        commands.push(cmd.data.toJSON());
        console.log(`  ✅ Loaded: /${cmd.data.name}`);
      }
    } catch (e) {
      console.error(`  ❌ Failed: ${file} — ${e.message}`);
    }
  }
}

console.log(`\n🔄 Registering ${commands.length} slash commands globally...`);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  const data = await rest.put(
    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
    { body: commands }
  );
  console.log(`\n✅ Successfully registered ${data.length} slash commands!`);
  data.forEach(c => console.log(`  /${c.name}`));
} catch (err) {
  console.error('❌ Failed to register commands:', err.message);
}
