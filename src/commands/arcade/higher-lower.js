import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { ArcadeService } from '../../services/arcadeService.js';
import { EconomyService } from '../../services/economyService.js';
import { DEFAULTS } from '../../config/defaults.js';

const BET_AMOUNT = 10;
const WIN_REWARD = 25;

export const data = new SlashCommandBuilder()
  .setName('higher-lower')
  .setDescription('Guess whether the next number will be higher or lower.')
  .addStringOption((option) =>
    option
      .setName('choice')
      .setDescription('Choose higher or lower.')
      .setRequired(true)
      .addChoices(
        { name: 'Higher', value: 'higher' },
        { name: 'Lower', value: 'lower' }
      )
  );

export async function playHigherLower(interaction, choice, deferred = false) {
  if (!deferred) {
    await interaction.deferReply({ flags: 64 });
  }

  const remainingAttempts = await ArcadeService.getRemainingAttempts(
    interaction.guildId,
    interaction.user.id
  );

  if (remainingAttempts <= 0) {
    await interaction.editReply({
      content: `🎮 You have used all **${DEFAULTS.ARCADE.DAILY_ATTEMPTS} Arcade attempts** for today.`,
    });
    return;
  }

  const balance = await EconomyService.getBalance(
    interaction.guildId,
    interaction.user.id
  );

  if (balance < BET_AMOUNT) {
    await interaction.editReply({
      content: `🪙 You need at least **${BET_AMOUNT} ${DEFAULTS.ECONOMY.CURRENCY_NAME}** to play.`,
    });
    return;
  }

  const firstNumber = Math.floor(Math.random() * 100) + 1;
  let secondNumber = Math.floor(Math.random() * 100) + 1;

  while (secondNumber === firstNumber) {
    secondNumber = Math.floor(Math.random() * 100) + 1;
  }

  const won =
    choice === 'higher'
      ? secondNumber > firstNumber
      : secondNumber < firstNumber;

  const finalResult = won ? 'win' : 'loss';
  const rewardAmount = won ? WIN_REWARD : 0;

  if (!won) {
    await EconomyService.removeCurrency(
      interaction.guildId,
      interaction.user.id,
      BET_AMOUNT,
      'arcade_higher_lower_loss',
      {
        referenceType: 'arcade_game',
        referenceId: interaction.id,
        description: 'Higher or Lower losing bet',
      }
    );
  }

  const arcadeResult = await ArcadeService.playGame({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    gameType: 'higher_lower',
    result: finalResult,
    rewardAmount,
    rewardSource: 'arcade_higher_lower_win',
    transactionMeta: {
      referenceType: 'arcade_game',
      referenceId: interaction.id,
      description: 'Higher or Lower winning reward',
    },
  });

  if (!arcadeResult.allowed) {
    await interaction.editReply({
      content: `🎮 You have used all **${DEFAULTS.ARCADE.DAILY_ATTEMPTS} Arcade attempts** for today.`,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎯 Higher or Lower')
    .setDescription(
      won
        ? `The first number was **${firstNumber}**.\nThe next number was **${secondNumber}**.\n\n🎉 You guessed **${choice}** correctly!\n\n💰 You won **${WIN_REWARD} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**.`
        : `The first number was **${firstNumber}**.\nThe next number was **${secondNumber}**.\n\n❌ You guessed **${choice}**, but the number went the other way.\n\nYou lost **${BET_AMOUNT} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**.`
    )
    .addFields({
      name: 'Attempts Remaining',
      value: `**${arcadeResult.remainingAttempts} / ${DEFAULTS.ARCADE.DAILY_ATTEMPTS}**`,
      inline: true,
    });

  await interaction.editReply({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`arcade-back:${interaction.user.id}`)
          .setLabel('Back to Arcade')
          .setEmoji('🎮')
          .setStyle(ButtonStyle.Secondary)
      ),
    ],
  });
}

export async function execute(interaction) {
  const choice = interaction.options.getString('choice', true);
  await playHigherLower(interaction, choice, false);
}

export default { data, execute };
