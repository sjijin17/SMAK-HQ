import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { execute as executeQuery, queryOne } from '../../database/client.js';
import { EconomyService } from '../../services/economyService.js';
import { DEFAULTS } from '../../config/defaults.js';
import { getManilaDate } from '../../utils/time.js';

const DAILY_REWARD = 100;

export const data = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('Claim your daily currency reward.');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const claimDate = getManilaDate();

  const existingClaim = await queryOne(
    `SELECT reward_amount, claimed_at
     FROM daily_claims
     WHERE guild_id = ?
       AND discord_user_id = ?
       AND claim_date = ?`,
    [guildId, userId, claimDate]
  );

  if (existingClaim) {
    await interaction.reply({
      content: `⏰ You already claimed your daily reward today. Come back tomorrow!`,
      ephemeral: true,
    });
    return;
  }

  const result = await EconomyService.addCurrency(
    guildId,
    userId,
    DAILY_REWARD,
    'daily_claim',
    {
      referenceType: 'daily_claim',
      referenceId: claimDate,
      description: 'Daily reward claim',
    }
  );

  await executeQuery(
    `INSERT INTO daily_claims
     (guild_id, discord_user_id, claim_date, reward_amount)
     VALUES (?, ?, ?, ?)`,
    [guildId, userId, claimDate, DAILY_REWARD]
  );

  const embed = new EmbedBuilder()
    .setTitle('🎁 Daily Reward Claimed!')
    .setDescription(
      `You received **${DAILY_REWARD.toLocaleString()} ${DEFAULTS.ECONOMY.CURRENCY_NAME}** ${DEFAULTS.ECONOMY.CURRENCY_SYMBOL}.`
    )
    .addFields({
      name: 'New Balance',
      value: `**${result.newBalance.toLocaleString()} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**`,
      inline: false,
    })
    .setColor(0xf1c40f)
    .setFooter({
      text: `Daily reward • ${claimDate}`,
    });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

export default { data, execute };
