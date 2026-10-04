import { SlashCommandBuilder } from 'discord.js';
import { queryOne, batch } from '../../database/client.js';
import { ValidationError } from '../../utils/errors.js';

export const data = new SlashCommandBuilder()
  .setName('admin-give')
  .setDescription('Give currency to a member for testing.')
  .addUserOption((option) =>
    option.setName('member')
      .setDescription('Member receiving the currency.')
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option.setName('amount')
      .setDescription('Amount of currency to give.')
      .setMinValue(1)
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    if (!interaction.guildId) {
      throw new ValidationError('This command can only be used inside a server.');
    }

    if (!interaction.memberPermissions?.has('Administrator')) {
      throw new ValidationError('Only server administrators can use this command.');
    }

    const target = interaction.options.getUser('member', true);
    const amount = interaction.options.getInteger('amount', true);

    if (target.bot) {
      throw new ValidationError('Bots cannot receive economy currency.');
    }

    const existing = await queryOne(
      `SELECT balance
       FROM users
       WHERE guild_id = ? AND discord_user_id = ?
       LIMIT 1`,
      [interaction.guildId, target.id]
    );

    if (existing) {
      const newBalance = Number(existing.balance) + amount;

      await batch([
        {
          sql: `UPDATE users
                SET balance = ?, updated_at = CURRENT_TIMESTAMP
                WHERE guild_id = ? AND discord_user_id = ?`,
          args: [newBalance, interaction.guildId, target.id],
        },
        {
          sql: `INSERT INTO transactions
                (guild_id, discord_user_id, type, amount, balance_after, description)
                VALUES (?, ?, 'admin_give', ?, ?, ?)`,
          args: [
            interaction.guildId,
            target.id,
            amount,
            newBalance,
            `Admin test currency granted by ${interaction.user.id}`,
          ],
        },
      ], 'deferred');
    } else {
      await batch([
        {
          sql: `INSERT INTO users
                (guild_id, discord_user_id, balance, created_at, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [interaction.guildId, target.id, amount],
        },
        {
          sql: `INSERT INTO transactions
                (guild_id, discord_user_id, type, amount, balance_after, description)
                VALUES (?, ?, 'admin_give', ?, ?, ?)`,
          args: [
            interaction.guildId,
            target.id,
            amount,
            amount,
            `Admin test currency granted by ${interaction.user.id}`,
          ],
        },
      ], 'deferred');
    }

    const account = await queryOne(
      `SELECT balance
       FROM users
       WHERE guild_id = ? AND discord_user_id = ?
       LIMIT 1`,
      [interaction.guildId, target.id]
    );

    await interaction.editReply(
      `✅ Gave **${amount}** currency to ${target}.\nNew balance: **${account.balance}**.`
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      await interaction.editReply(`❌ ${error.message}`);
      return;
    }

    console.error('Unexpected /admin-give error:', error);
    await interaction.editReply('❌ Something went wrong while giving currency.');
  }
}
