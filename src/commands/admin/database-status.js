import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { pingDatabase, queryOne } from '../../database/client.js';
import { logger } from '../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('database-status')
  .setDescription('Administrator command to verify remote Turso SQL database connectivity.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

/**
 * Executes the /database-status slash command.
 * Strictly restricted to Administrators. Never reveals auth tokens or credentials.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const pingResult = await pingDatabase();

    if (!pingResult.ok) {
      await interaction.editReply({
        content: `❌ **Turso Database Status: Disconnected**\n**Error:** ${pingResult.error || 'Connection timed out'}\n**Latency:** ${pingResult.latencyMs}ms`,
      });
      return;
    }

    // Check row counts from foundation tables safely
    let userCount = 0;
    let migrationCount = 0;

    try {
      const userRes = await queryOne('SELECT COUNT(*) AS count FROM users');
      userCount = userRes ? Number(userRes.count || 0) : 0;
    } catch {
      userCount = 0;
    }

    try {
      const migRes = await queryOne('SELECT COUNT(*) AS count FROM _migrations');
      migrationCount = migRes ? Number(migRes.count || 0) : 0;
    } catch {
      migrationCount = 0;
    }

    await interaction.editReply({
      content: [
        '✅ **Turso Database Status: Operational & Connected**',
        `⚡ **Latency:** ${pingResult.latencyMs}ms`,
        `📦 **Applied Migrations:** ${migrationCount}`,
        `👥 **Registered Member Accounts:** ${userCount}`,
        '🔒 **Storage Type:** Remote libSQL / Turso Cloud (Zero local SQLite files)',
      ].join('\n'),
    });
  } catch (error) {
    logger.error('Error executing /database-status command:', error);
    await interaction.editReply({
      content: '❌ **Database Check Failed:** An unexpected error occurred while communicating with the database.',
    });
  }
}

export default { data, execute };
