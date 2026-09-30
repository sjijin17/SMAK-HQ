import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMMANDS_DIR = path.join(__dirname, '../src/commands');

/**
 * Recursively retrieves all .js files in a directory
 */
function getCommandFiles(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getCommandFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function deployCommands() {
  console.log('----------------------------------------------------');
  console.log('🚀 Discord Slash Command Deployment Script');
  console.log('----------------------------------------------------');

  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId) {
    console.error('❌ Error: Missing required environment variables.');
    console.error('Please ensure DISCORD_TOKEN and CLIENT_ID are defined in your .env file.');
    process.exit(1);
  }

  const commandFiles = getCommandFiles(COMMANDS_DIR);
  console.log(`🔍 Found ${commandFiles.length} command file(s) across commands subdirectories.`);

  const commandsPayload = [];

  for (const filePath of commandFiles) {
    const fileUrl = pathToFileURL(filePath).href;
    try {
      const module = await import(fileUrl);
      const command = module.default || module;

      if ('data' in command && 'execute' in command) {
        commandsPayload.push(command.data.toJSON());
        console.log(`  ✓ Loaded command: /${command.data.name} (${path.relative(COMMANDS_DIR, filePath)})`);
      } else {
        console.warn(`  ⚠️ Skipping ${filePath}: missing "data" or "execute" property.`);
      }
    } catch (err) {
      console.error(`  ❌ Failed to load command from ${filePath}:`, err.message);
    }
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`\n📡 Registering ${commandsPayload.length} slash command(s) with Discord API...`);

    if (guildId) {
      // Fast guild-scoped deployment for development/testing
      console.log(`Targeting Guild ID: ${guildId} (Instant deployment)`);
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandsPayload }
      );
      console.log(`✅ Successfully registered ${data.length} guild slash command(s)!`);
    } else {
      // Global deployment (can take up to an hour to propagate globally)
      console.log('GUILD_ID not set. Registering globally across all servers (Global deployment)...');
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandsPayload }
      );
      console.log(`✅ Successfully registered ${data.length} global slash command(s)!`);
    }

    console.log('----------------------------------------------------');
    console.log('🎉 Deployment complete. Commands are ready in Discord!');
  } catch (error) {
    console.error('❌ Failed to deploy slash commands to Discord:', error);
    process.exit(1);
  }
}

deployCommands();
