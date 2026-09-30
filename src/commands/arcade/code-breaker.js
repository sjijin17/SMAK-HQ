import {
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { ArcadeService } from '../../services/arcadeService.js';
import { EconomyService } from '../../services/economyService.js';
import { DEFAULTS } from '../../config/defaults.js';

const BET_AMOUNT = 10;
const WIN_REWARD = 50;
const MAX_GUESSES = 5;

const activeSessions = new Map();

function generateCode() {
  const digits = [];

  while (digits.length < 4) {
    const digit = Math.floor(Math.random() * 10);

    if (!digits.includes(digit)) {
      digits.push(digit);
    }
  }

  return digits.join('');
}

function evaluateGuess(secret, guess) {
  const feedback = Array(4).fill('⚫');
  const remainingSecret = secret.split('');
  const remainingGuess = guess.split('');

  for (let i = 0; i < 4; i += 1) {
    if (remainingGuess[i] === remainingSecret[i]) {
      feedback[i] = '🟢';
      remainingSecret[i] = null;
      remainingGuess[i] = null;
    }
  }

  for (let i = 0; i < 4; i += 1) {
    if (remainingGuess[i] === null) {
      continue;
    }

    const matchingIndex = remainingSecret.indexOf(remainingGuess[i]);

    if (matchingIndex !== -1) {
      feedback[i] = '🟡';
      remainingSecret[matchingIndex] = null;
    }
  }

  return feedback;
}

function isValidGuess(guess) {
  return /^\d{4}$/.test(guess) && new Set(guess).size === 4;
}

function createGameEmbed(session, feedback = null) {
  const fields = [
    {
      name: 'Guesses',
      value: `**${session.guesses.length} / ${MAX_GUESSES}**`,
      inline: true,
    },
    {
      name: 'Attempts Remaining',
      value: `**${session.remainingAttempts} / ${DEFAULTS.ARCADE.DAILY_ATTEMPTS}**`,
      inline: true,
    },
  ];

  if (feedback) {
    fields.push({
      name: `Guess #${session.guesses.length}`,
      value: `**${session.guesses[session.guesses.length - 1]}**\n${feedback.join(' ')}`,
    });
  }

  return new EmbedBuilder()
    .setTitle('🔐 Code Breaker')
    .setDescription(
      'Crack the secret **4-digit code**.\n\n' +
      '🟢 Correct digit and position\n' +
      '🟡 Correct digit, wrong position\n' +
      '⚫ Digit is not in the code\n\n' +
      `You have **${MAX_GUESSES - session.guesses.length} guesses remaining**.`
    )
    .addFields(fields);
}

export const data = new SlashCommandBuilder()
  .setName('code-breaker')
  .setDescription('Start or continue a Code Breaker session.')
  .addStringOption((option) =>
    option
      .setName('guess')
      .setDescription('Your 4-digit guess. Leave empty to start a new game.')
      .setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const userId = interaction.user.id;
  const guildId = interaction.guildId;
  const guess = interaction.options.getString('guess')?.trim();

  let session = activeSessions.get(userId);

  if (!session) {
    if (guess) {
      if (!isValidGuess(guess)) {
        await interaction.editReply({
          content:
            '🔐 Your guess must contain exactly **4 different digits**.',
        });
        return;
      }
    }

    const remainingAttempts = await ArcadeService.getRemainingAttempts(
      guildId,
      userId
    );

    if (remainingAttempts <= 0) {
      await interaction.editReply({
        content:
          `🎮 You have used all **${DEFAULTS.ARCADE.DAILY_ATTEMPTS} Arcade attempts** for today.`,
      });
      return;
    }

    const balance = await EconomyService.getBalance(
      guildId,
      userId
    );

    if (balance < BET_AMOUNT) {
      await interaction.editReply({
        content:
          `🪙 You need at least **${BET_AMOUNT} ${DEFAULTS.ECONOMY.CURRENCY_NAME}** to play.`,
      });
      return;
    }

    session = {
      guildId,
      userId,
      secret: generateCode(),
      guesses: [],
      remainingAttempts,
    };

    activeSessions.set(userId, session);

    if (!guess) {
      await interaction.editReply({
        embeds: [createGameEmbed(session)],
        content:
          '🔐 **Code Breaker started!**\n\n' +
          'Submit your first 4-digit guess using `/code-breaker`.',
      });
      return;
    }
  }

  if (session.guildId !== guildId) {
    await interaction.editReply({
      content: '❌ Your active Code Breaker session belongs to another server.',
    });
    return;
  }

  if (session.userId !== userId) {
    await interaction.editReply({
      content: '❌ This Code Breaker session belongs to another player.',
    });
    return;
  }

  if (!guess) {
    await interaction.editReply({
      content:
        '🔐 You already have an active Code Breaker session.\n\n' +
        'Submit a **4-digit guess** using `/code-breaker`.',
    });
    return;
  }

  if (!isValidGuess(guess)) {
    await interaction.editReply({
      content:
        '🔐 Your guess must contain exactly **4 different digits**.',
    });
    return;
  }

  if (session.guesses.includes(guess)) {
    await interaction.editReply({
      content:
        '⚠️ You already tried that code. Submit a different 4-digit guess.',
    });
    return;
  }

  session.guesses.push(guess);

  const feedback = evaluateGuess(session.secret, guess);
  const won = guess === session.secret;
  const exhausted = session.guesses.length >= MAX_GUESSES;

  if (won) {
    activeSessions.delete(userId);

    const arcadeResult = await ArcadeService.playGame({
      guildId,
      userId,
      gameType: 'code_breaker',
      result: 'win',
      rewardAmount: WIN_REWARD,
      rewardSource: 'arcade_code_breaker_win',
      transactionMeta: {
        referenceType: 'arcade_game',
        referenceId: interaction.id,
        description: 'Code Breaker winning reward',
      },
    });

    if (!arcadeResult.allowed) {
      await interaction.editReply({
        content:
          `🎮 You have used all **${DEFAULTS.ARCADE.DAILY_ATTEMPTS} Arcade attempts** for today.`,
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🔐 Code Breaker — CRACKED!')
          .setDescription(
            `🎉 You cracked the code in **${session.guesses.length} guesses**!\n\n` +
            `🔓 Secret code: **${session.secret}**\n\n` +
            `💰 You won **${WIN_REWARD} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**!`
          )
          .addFields({
            name: 'Attempts Remaining',
            value:
              `**${arcadeResult.remainingAttempts} / ${DEFAULTS.ARCADE.DAILY_ATTEMPTS}**`,
          }),
      ],
    });

    return;
  }

  if (exhausted) {
    activeSessions.delete(userId);

    await EconomyService.removeCurrency(
      guildId,
      userId,
      BET_AMOUNT,
      'arcade_code_breaker_loss',
      {
        referenceType: 'arcade_game',
        referenceId: interaction.id,
        description: 'Code Breaker failed session',
      }
    );

    const arcadeResult = await ArcadeService.playGame({
      guildId,
      userId,
      gameType: 'code_breaker',
      result: 'loss',
      rewardAmount: 0,
      rewardSource: 'arcade_code_breaker_loss',
      transactionMeta: {
        referenceType: 'arcade_game',
        referenceId: interaction.id,
        description: 'Code Breaker failed session',
      },
    });

    if (!arcadeResult.allowed) {
      await interaction.editReply({
        content:
          `🎮 You have used all **${DEFAULTS.ARCADE.DAILY_ATTEMPTS} Arcade attempts** for today.`,
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🔐 Code Breaker — Failed')
          .setDescription(
            `❌ You used all **${MAX_GUESSES} guesses**.\n\n` +
            `🔓 The secret code was **${session.secret}**.\n\n` +
            `🪙 You lost **${BET_AMOUNT} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**.`
          )
          .addFields({
            name: 'Attempts Remaining',
            value:
              `**${arcadeResult.remainingAttempts} / ${DEFAULTS.ARCADE.DAILY_ATTEMPTS}**`,
          }),
      ],
    });

    return;
  }

  await interaction.editReply({
    embeds: [createGameEmbed(session, feedback)],
    content:
      `🔐 Guess **${session.guesses.length}** recorded.\n\n` +
      'Submit your next guess using `/code-breaker`.',
  });
}

export default { data, execute };
