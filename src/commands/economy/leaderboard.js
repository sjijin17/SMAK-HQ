import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { query } from '../../database/client.js';
import { DEFAULTS } from '../../config/defaults.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('View the server economy leaderboard.');

export async function execute(interaction) {
  const rows = await query(
    `SELECT discord_user_id, balance
     FROM users
     WHERE guild_id = ?
     ORDER BY balance DESC, discord_user_id ASC
     LIMIT 10`,
    [interaction.guildId]
  );

  if (!rows.length) {
    await interaction.reply({
      content: '🏆 The leaderboard is empty right now.',
      ephemeral: true,
    });
    return;
  }

  const lines = rows.map((row, index) => {
    const position = index + 1;
    const medal =
      position === 1 ? '🥇' :
      position === 2 ? '🥈' :
      position === 3 ? '🥉' :
      `**${position}.**`;

    return `${medal} <@${row.discord_user_id}> — **${Number(row.balance).toLocaleString()} ${DEFAULTS.ECONOMY.CURRENCY_SYMBOL}**`;
  });

  const embed = new EmbedBuilder()
    .setTitle('🏆 Economy Leaderboard')
    .setDescription(lines.join('\n'))
    .setColor(0x3498db)
    .setFooter({
      text: `Top ${rows.length} members`,
    });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

export default { data, execute };
