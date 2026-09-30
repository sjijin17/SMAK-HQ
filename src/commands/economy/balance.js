import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { EconomyService } from '../../services/economyService.js';
import { DEFAULTS } from '../../config/defaults.js';

export const data = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('Check your current economy balance.');

export async function execute(interaction) {
  const balance = await EconomyService.getBalance(
    interaction.guildId,
    interaction.user.id
  );

  const embed = new EmbedBuilder()
    .setTitle('💰 Your Balance')
    .setDescription(
      `You currently have **${balance.toLocaleString()} ${DEFAULTS.ECONOMY.CURRENCY_NAME}** ${DEFAULTS.ECONOMY.CURRENCY_SYMBOL}`
    )
    .setColor(0x2ecc71)
    .setFooter({
      text: interaction.user.displayName,
    });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

export default { data, execute };
