import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';

import { env, validateEnvironment } from './config/environment.js';
import { logger } from './utils/logger.js';
import { pingDatabase, closeDatabase } from './database/client.js';
import { registerErrorHandlers } from './events/errorHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

logger.info('====================================================');
logger.info('🤖 Starting Discord Economy & Entertainment Bot');
logger.info(`Environment: ${env.NODE_ENV} | Node: ${process.version}`);
logger.info('====================================================');

// ============================================================================
// 1. GATEWAY INTENTS & CLIENT INITIALIZATION
// ============================================================================
/**
 * Gateway Intents Rationale:
 * 
 * 1. GatewayIntentBits.Guilds (Standard)
 *    - Required for guild, channel, and role caching and slash command resolution.
 * 
 * 2. GatewayIntentBits.GuildMembers (Privileged)
 *    - Required for fetching guild members, evaluating member statuses, and
 *      applying Discord server timeouts (member.timeout()) for the jail system.
 * 
 * 3. GatewayIntentBits.GuildMessages (Standard)
 *    - Required for listening to messageCreate events across server channels.
 * 
 * 4. GatewayIntentBits.MessageContent (Privileged)
 *    - Required for inspecting message text (for future secret rule detection & chat activity)
 *      and reading attachment metadata for the Camera Roll rewards system.
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,    // Privileged Intent
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Privileged Intent
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Attach Collections for dynamic slash command loader
client.commands = new Collection();

// Register global and process error listeners
registerErrorHandlers(client);

// ============================================================================
// 2. DYNAMIC SLASH COMMAND LOADER
// ============================================================================
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

async function loadCommands() {
  const commandsDir = path.join(__dirname, 'commands');
  const commandFiles = getCommandFiles(commandsDir);

  logger.info(`Loading slash commands from ${commandsDir}...`);

  for (const filePath of commandFiles) {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      const command = module.default || module;

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.debug(`Loaded slash command: /${command.data.name}`);
      } else {
        logger.warn(`Skipping command at ${filePath}: missing "data" or "execute" export.`);
      }
    } catch (error) {
      logger.error(`Failed to load command at ${filePath}:`, error.message);
    }
  }

  logger.info(`Successfully loaded ${client.commands.size} slash command(s).`);
}

// ============================================================================
// 3. DYNAMIC EVENT LOADER
// ============================================================================
async function loadEvents() {
  const eventsDir = path.join(__dirname, 'events');
  if (!fs.existsSync(eventsDir)) return;

  const eventFiles = fs.readdirSync(eventsDir).filter((file) => file.endsWith('.js') && file !== 'errorHandlers.js');

  logger.info(`Loading event handlers from ${eventsDir}...`);

  for (const file of eventFiles) {
    try {
      const filePath = path.join(eventsDir, file);
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      const event = module.default || module;

      if (event.name && typeof event.execute === 'function') {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
        logger.debug(`Registered event: ${event.name} (once=${!!event.once})`);
      }
    } catch (error) {
      logger.error(`Failed to load event handler ${file}:`, error.message);
    }
  }
}

// ============================================================================
// 4. MINIMAL HTTP HEALTH SERVER (Cloud Run Compatibility)
// ============================================================================
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Health endpoint required by Google Cloud Run
  if (url.pathname === '/health') {
    const dbPing = await pingDatabase().catch(() => ({ ok: false }));
    const isBotReady = client.isReady();

    const healthPayload = {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      bot: {
        status: isBotReady ? 'connected' : 'connecting',
        user: isBotReady ? client.user.tag : null,
        guildCount: isBotReady ? client.guilds.cache.size : 0,
      },
      database: {
        connected: dbPing.ok,
        latencyMs: dbPing.latencyMs || null,
        type: 'Turso/libSQL (Remote)',
      },
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthPayload, null, 2));
    return;
  }

  // Root endpoint info
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify(
      {
        name: 'Discord Economy & Entertainment Bot',
        version: '1.0.0',
        healthCheck: '/health',
        commandsLoaded: client.commands.size,
      },
      null,
      2
    )
  );
});

// ============================================================================
// 5. APPLICATION STARTUP & LIFECYCLE
// ============================================================================
async function startApplication() {
  // Start HTTP health server immediately so Cloud Run health checks pass
  const port = env.PORT;
  server.listen(port, '0.0.0.0', () => {
    logger.info(`HTTP Health Server listening on port ${port} (Health check at GET /health)`);
  });

  // Verify database connectivity
  logger.info('Testing connection to remote Turso database...');
  const dbStatus = await pingDatabase();
  if (dbStatus.ok) {
    logger.info(`Turso database connection verified! Latency: ${dbStatus.latencyMs}ms`);
  } else {
    logger.warn(`Turso database check warning: ${dbStatus.error}`);
    logger.warn('Please verify TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your .env file.');
  }

  // Load commands and events
  await loadCommands();
  await loadEvents();

  // Validate Discord environment variables
  const envValidation = validateEnvironment({ requireDiscord: true, requireTurso: false });
  if (!envValidation.valid) {
    logger.warn('------------------------------------------------------------');
    logger.warn(`⚠️ Discord credentials missing: ${envValidation.missing.join(', ')}`);
    logger.warn('HTTP server is running for Cloud Run health checks, but bot login is deferred.');
    logger.warn('Please populate DISCORD_TOKEN and CLIENT_ID in your .env file to connect to Discord.');
    logger.warn('------------------------------------------------------------');
    return;
  }

  // Login Discord Client to Gateway
  try {
    logger.info('Connecting Discord bot to Discord Gateway...');
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    // Check for privileged intent failure
    if (
      error.code === 'DisallowedIntents' ||
      (error.message && error.message.toLowerCase().includes('intent'))
    ) {
      logger.error('================================================================');
      logger.error('CRITICAL ERROR: Discord Privileged Intents Not Enabled!');
      logger.error('The bot requires Privileged Gateway Intents:');
      logger.error('  1. SERVER MEMBERS INTENT (GatewayIntentBits.GuildMembers)');
      logger.error('  2. MESSAGE CONTENT INTENT (GatewayIntentBits.MessageContent)');
      logger.error('To fix this:');
      logger.error('  1. Go to https://discord.com/developers/applications');
      logger.error('  2. Select your application -> Click "Bot" tab on the left');
      logger.error('  3. Scroll down to "Privileged Gateway Intents"');
      logger.error('  4. Toggle ON "Server Members Intent" and "Message Content Intent"');
      logger.error('  5. Save Changes and restart the bot.');
      logger.error('================================================================');
    } else {
      logger.error('Failed to log in to Discord:', error);
    }
  }
}

// ============================================================================
// 6. GRACEFUL SHUTDOWN (SIGTERM / SIGINT)
// ============================================================================
let isShuttingDown = false;

async function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP health server closed.');
  });

  // Destroy Discord WebSocket client
  try {
    client.destroy();
    logger.info('Discord client disconnected cleanly from Gateway.');
  } catch (err) {
    logger.warn('Error destroying Discord client:', err.message);
  }

  // Close database connection
  await closeDatabase();

  logger.info('Graceful shutdown complete. Exiting process.');
  process.exit(0);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startApplication();
