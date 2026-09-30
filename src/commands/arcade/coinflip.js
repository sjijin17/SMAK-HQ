import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ArcadeService } from '../../services/arcadeService.js';
import { DEFAULTS } from '../../config/defaults.js';

const BET_AMOUNT = 10;
const WIN_REWARD = 20;

export const data = new SlashCommandBuilder()
  .setName('coinflip')
  .setDescription('Flip a coin for a chance to win Credits.')
  .addStringOption((option) =>
    option
      .setName('choice')
      .setDescription('Choose heads or tails.')
      .setRequired(true)
      .addChoices(
        { name: 'Heads', value: 'heads' },
        { name: 'Tails', value: 'tails' }
      )
  );

export async function execute(interaction) {
  const choice = interaction.options.getString('choice', true);

  const { EconomyService } = await import('../../services/economyService.js');

  const remainingAttempts = await ArcadeService.getRemainingAttempts(
    interaction.guildId,
    interaction.user.id
  );

  if (remainingAttempts <= 0) {
    await interaction.reply({
      content: `🎮 You have used all **${DEFAULTS.ARCADE.DAILY_ATTEMPTS} Arcade attempts** for today.`,
      ephemeral: true,
    });
    return;
  }

  const balance = await EconomyService.getBalance(
    interaction.guildId,
    interaction.user.id
  );

  if (balance < BET_AMOUNT) {
    await interaction.reply({
      content: `🪙 You need at least **${BET_AMOUNT} ${DEFAULTS.ECONOMY.CURRENCY_NAME}** to play.`,
      ephemeral: true,
    });
    return;
  }

  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const won = result === choice;

  const finalResult = won ? 'win' : 'loss';
  const rewardAmount = won ? WIN_REWARD : 0;

  if (!won) {
    await EconomyService.removeCurrency(
      interaction.guildId,
      interaction.user.id,
      BET_AMOUNT,
      'arcade_coinflip_loss',
      {
        referenceType: 'arcade_game',
        referenceId: interaction.id,
        description: 'Coinflip losing bet',
      }
    );
  }

  const arcadeResult = await ArcadeService.playGame({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    gameType: 'coinflip',
    result: finalResult,
    rewardAmount,
    rewardSource: 'arcade_coinflip_win',
    transactionMeta: {
      referenceType: 'arcade_game',
      referenceId: interaction.id,
      description: 'Coinflip winning reward',
    },
  });

  if (!arcadeResult.allowed) {
    await interaction.reply({
      content: '🎮 You have used all 5 Arcade attempts for today.',
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🪙 Coinflip')
    .setDescription(
      won
        ? `The coin landed on **${result}**!\n\n🎉 You won **${WIN_REWARD} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**!`
        : `The coin landed on **${result}**.\n\nYou lost **${BET_AMOUNT} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**.`
    )
    .addFields({
      name: 'Attempts Remaining',
      value: `**${arcadeResult.remainingAttempts} / ${DEFAULTS.ARCADE.DAILY_ATTEMPTS}**`,
      inline: true,
    })
    .setColor(won ? 0x2ecc71 : 0xe74c3c);

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

export default { data, execute };
