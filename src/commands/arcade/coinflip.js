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

export async function playCoinflip(interaction, choice, deferred = false) {
  if (!deferred) {
    await interaction.deferReply({ flags: 64 });
  }

  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const won = result === choice;

  if (won) {
    const economyResult = await EconomyService.addCurrency(
      interaction.guildId,
      interaction.user.id,
      WIN_REWARD,
      'arcade_coinflip_win',
      {
        gameType: 'coinflip',
        choice,
        result,
      }
    );

    const attempt = await ArcadeService.recordAttempt(
      interaction.guildId,
      interaction.user.id,
      'coinflip',
      'win',
      WIN_REWARD
    );

    const embed = new EmbedBuilder()
      .setTitle('🪙 Coinflip — WIN!')
      .setDescription(
        `The coin landed on **${result}**!\n\n` +
        `You chose **${choice}** and won **${WIN_REWARD} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**.`
      )
      .addFields(
        {
          name: '💰 Balance',
          value: `**${economyResult.newBalance} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**`,
          inline: true,
        },
        {
          name: '🎟️ Attempts Remaining',
          value: `**${attempt.remainingAttempts} / ${DEFAULTS.ARCADE.DAILY_ATTEMPTS}**`,
          inline: true,
        }
      );

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

    return;
  }

  const economyResult = await EconomyService.removeCurrency(
    interaction.guildId,
    interaction.user.id,
    BET_AMOUNT,
    'arcade_coinflip_loss',
    {
      gameType: 'coinflip',
      choice,
      result,
    }
  );

  const attempt = await ArcadeService.recordAttempt(
    interaction.guildId,
    interaction.user.id,
    'coinflip',
    'loss',
    0
  );

  const embed = new EmbedBuilder()
    .setTitle('🪙 Coinflip — LOSS')
    .setDescription(
      `The coin landed on **${result}**!\n\n` +
      `You chose **${choice}** and lost **${BET_AMOUNT} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**.`
    )
    .addFields(
      {
        name: '💰 Balance',
        value: `**${economyResult.newBalance} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**`,
        inline: true,
      },
      {
        name: '🎟️ Attempts Remaining',
        value: `**${attempt.remainingAttempts} / ${DEFAULTS.ARCADE.DAILY_ATTEMPTS}**`,
        inline: true,
      }
    );

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

  await playCoinflip(interaction, choice, false);
}

export default { data, execute };
