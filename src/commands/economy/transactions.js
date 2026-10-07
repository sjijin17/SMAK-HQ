import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { query } from '../../database/client.js';
import { DEFAULTS } from '../../config/defaults.js';

export const data = new SlashCommandBuilder()
  .setName('transactions')
  .setDescription('View your recent economy transactions.');

export async function execute(interaction) {
  const rows = await query(
    `SELECT type, amount, balance_after, description, created_at
     FROM transactions
     WHERE guild_id = ?
       AND discord_user_id = ?
     ORDER BY id DESC
     LIMIT 10`,
    [interaction.guildId, interaction.user.id]
  );

  if (!rows.length) {
    await interaction.reply({
      content: '📜 You do not have any transactions yet.',
      ephemeral: true,
    });
    return;
  }

  const lines = rows.map((row) => {
    const amount = Number(row.amount);
    const sign = amount >= 0 ? '+' : '';
    const description = row.description || row.type;

    return [
      `**${description}**`,
      `${sign}${amount.toLocaleString()} ${DEFAULTS.ECONOMY.CURRENCY_SYMBOL} • Balance: **${Number(row.balance_after).toLocaleString()}**`,
    ].join('\n');
  });

  const embed = new EmbedBuilder()
    .setTitle('📜 Your Recent Transactions')
    .setDescription(lines.join('\n\n'))
    .setColor(0x9b59b6)
    .setFooter({
      text: 'Showing your 10 most recent transactions',
    });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

export default { data, execute };
