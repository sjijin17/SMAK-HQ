import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { ArcadeService } from '../../services/arcadeService.js';
import { EconomyService } from '../../services/economyService.js';
import { DEFAULTS } from '../../config/defaults.js';

export const data = new SlashCommandBuilder()
  .setName('arcade')
  .setDescription('Open the SMAK-HQ Arcade.');

function createButtons(userId, remainingAttempts) {
  const disabled = remainingAttempts <= 0;

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`arcade:coinflip:${userId}`)
        .setLabel('Coinflip')
        .setEmoji('🪙')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled),

      new ButtonBuilder()
        .setCustomId(`arcade:higher-lower:${userId}`)
        .setLabel('Higher or Lower')
        .setEmoji('📈')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled)
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`arcade:memory:${userId}`)
        .setLabel('Memory')
        .setEmoji('🧠')
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled),

      new ButtonBuilder()
        .setCustomId(`arcade:code-breaker:${userId}`)
        .setLabel('Code Breaker')
        .setEmoji('🔐')
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled)
    ),
  ];
}

export async function renderArcade(interaction, deferred = false) {
  if (!deferred) {
    await interaction.deferReply({ flags: 64 });
  }

  const remainingAttempts = await ArcadeService.getRemainingAttempts(
    interaction.guildId,
    interaction.user.id
  );

  const balance = await EconomyService.getBalance(
    interaction.guildId,
    interaction.user.id
  );

  const embed = new EmbedBuilder()
    .setTitle('🎮 SMAK-HQ Arcade')
    .setDescription(
      remainingAttempts > 0
        ? 'Choose a game below and test your luck, memory, or deduction skills.'
        : 'You have used all of your Arcade attempts for today. Come back tomorrow!'
    )
    .addFields(
      {
        name: '🪙 Credits',
        value: `**${balance} ${DEFAULTS.ECONOMY.CURRENCY_NAME}**`,
        inline: true,
      },
      {
        name: '🎟️ Attempts',
        value:
          `**${remainingAttempts} / ${DEFAULTS.ARCADE.DAILY_ATTEMPTS}**`,
        inline: true,
      },
      {
        name: '🎮 Games',
        value:
          '🪙 **Coinflip** — Bet 10 → Win 20\n' +
          '📈 **Higher or Lower** — Bet 10 → Win 25\n' +
          '🧠 **Memory** — Bet 10 → Win 35\n' +
          '🔐 **Code Breaker** — Risk 10 → Win 50',
      }
    )
    .setFooter({
      text: 'Each completed game uses one Arcade attempt.',
    });

  await interaction.editReply({
    embeds: [embed],
    components: createButtons(interaction.user.id, remainingAttempts),
  });
}

export async function execute(interaction) {
  await renderArcade(interaction, false);
}

export default { data, execute };
