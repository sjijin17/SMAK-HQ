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
const WIN_REWARD = 35;

const SYMBOLS = ['🍎', '🍋', '🍇', '🍒', '🥝', '🍉'];

function generateSequence(length) {
  return Array.from(
    { length },
    () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  );
}

function createButtons(userId, disabled = false) {
  const buttons = SYMBOLS.map((symbol, index) =>
    new ButtonBuilder()
      .setCustomId(`memory:${userId}:${index}`)
      .setLabel(symbol)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );

  return [
    new ActionRowBuilder().addComponents(buttons.slice(0, 3)),
    new ActionRowBuilder().addComponents(buttons.slice(3, 6)),
  ];
}

export const data = new SlashCommandBuilder()
  .setName('memory')
  .setDescription('Remember the sequence and reproduce it.');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

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

  const sequenceLength = 4;
  const sequence = generateSequence(sequenceLength);

  const embed = new EmbedBuilder()
    .setTitle('🧠 Memory Challenge')
    .setDescription(
      `Memorize this sequence:\n\n**${sequence.join('  ')}**\n\nThe sequence will disappear shortly.`
    );

  await interaction.editReply({
    embeds: [embed],
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const answerEmbed = new EmbedBuilder()
    .setTitle('🧠 Memory Challenge')
    .setDescription(
      `The sequence is hidden.\n\nClick the symbols **in the exact order** you remember.`
    );

  const response = await interaction.editReply({
    embeds: [answerEmbed],
    components: createButtons(interaction.user.id),
  });

  const selected = [];

  const collector = response.createMessageComponentCollector({
    filter: (buttonInteraction) =>
      buttonInteraction.user.id === interaction.user.id &&
      buttonInteraction.customId.startsWith(`memory:${interaction.user.id}:`),
    time: 15000,
  });

  collector.on('collect', async (buttonInteraction) => {
    const symbolIndex = Number(
      buttonInteraction.customId.split(':').pop()
    );

    selected.push(SYMBOLS[symbolIndex]);

    await buttonInteraction.deferUpdate();

    if (selected.length < sequence.length) {
      return;
    }

    collector.stop('completed');

    const won = selected.every(
      (symbol, index) => symbol === sequence[index]
    );

    const finalResult = won ? 'win' : 'loss';
    const rewardAmount = won ? WIN_REWARD : 0;

    if (!won) {
      await EconomyService.removeCurrency(
        interaction.guildId,
        interaction.user.id,
        BET_AMOUNT,
        'arcade_memory_loss',
        {
          referenceType: 'arcade_game',
          referenceId: interaction.id,
          description: 'Memory Challenge losing bet',
        }
      );
    }

    const arcadeResult = await ArcadeService.playGame({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      gameType: 'memory',
      result: finalResult,
      rewardAmount,
      rewardSource: 'arcade_memory_win',
      transactionMeta: {
        referenceType: 'arcade_game',
        referenceId: interaction.id,
        description: 'Memory Challenge winning reward',
      },
    });

    if (!arcadeResult.allowed) {
      await interaction.editReply({
        content: `🎮 You have used all **${DEFAULTS.ARCADE.DAILY_ATTEMPTS} Arcade attempts** for today.`,
        embeds: [],
        components: [],
      });
      return;
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle(won ? '🧠 Memory — Correct!' : '🧠 Memory — Wrong!')
      .setDescription(
        won
          ? `🎉 Perfect memory!\n\nYou won **${WIN_REWARD} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**.`
          : `❌ That sequence was incorrect.\n\nYou lost **${BET_AMOUNT} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**.`
      )
      .addFields(
        {
          name: 'Correct Sequence',
          value: sequence.join('  '),
        },
        {
          name: 'Attempts Remaining',
          value: `**${arcadeResult.remainingAttempts} / ${DEFAULTS.ARCADE.DAILY_ATTEMPTS}**`,
        }
      );

    await interaction.editReply({
      embeds: [resultEmbed],
      components: [],
    });
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'completed' || collected.size >= sequence.length) {
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🧠 Memory — Time Up')
          .setDescription(
            `⏰ You didn't complete the sequence in time.\n\nThe correct sequence was **${sequence.join('  ')}**.`
          ),
      ],
      components: [],
    }).catch(() => {});
  });
}

export default { data, execute };
