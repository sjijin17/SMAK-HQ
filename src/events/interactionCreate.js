import { logger } from '../utils/logger.js';

export default {
  name: 'interactionCreate',

  async execute(interaction) {
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // Return to Arcade hub.
      if (customId.startsWith('arcade-back:')) {
        const [, ownerId] = customId.split(':');

        if (interaction.user.id !== ownerId) {
          await interaction.reply({
            content: '❌ This Arcade menu belongs to another player.',
            flags: 64,
          });
          return;
        }

        try {
          await interaction.deferReply({ flags: 64 });

          const { renderArcade } = await import(
            '../commands/arcade/arcade.js'
          );

          await renderArcade(interaction, true);
        } catch (error) {
          logger.error('Error returning to Arcade:', error);
        }

        return;
      }

      // Coinflip choice buttons
      if (customId.startsWith('arcade-coinflip:')) {
        const [, choice, ownerId] = customId.split(':');

        if (interaction.user.id !== ownerId) {
          await interaction.reply({
            content: '❌ This Coinflip belongs to another player.',
            flags: 64,
          });
          return;
        }

        try {
          await interaction.deferReply({ flags: 64 });

          const { playCoinflip } = await import(
            '../commands/arcade/coinflip.js'
          );

          await playCoinflip(interaction, choice, true);
        } catch (error) {
          logger.error('Error handling Coinflip button:', error);
        }

        return;
      }

      // Higher / Lower choice buttons
      if (customId.startsWith('arcade-higher-lower:')) {
        const [, choice, ownerId] = customId.split(':');

        if (interaction.user.id !== ownerId) {
          await interaction.reply({
            content: '❌ This game belongs to another player.',
            flags: 64,
          });
          return;
        }

        try {
          await interaction.deferReply({ flags: 64 });

          const { playHigherLower } = await import(
            '../commands/arcade/higher-lower.js'
          );

          await playHigherLower(interaction, choice, true);
        } catch (error) {
          logger.error('Error handling Higher or Lower button:', error);
        }

        return;
      }

      // Memory buttons are handled by the game's collector.
      if (customId.startsWith('memory:')) {
        return;
      }

      // Arcade hub buttons
      if (!customId.startsWith('arcade:')) {
        return;
      }

      const [, game, ownerId] = customId.split(':');

      if (interaction.user.id !== ownerId) {
        await interaction.reply({
          content: '❌ This Arcade menu belongs to another player.',
          flags: 64,
        });
        return;
      }

      try {
        if (game === 'coinflip') {
          const {
            ActionRowBuilder,
            ButtonBuilder,
            ButtonStyle,
          } = await import('discord.js');

          await interaction.reply({
            content: '🪙 **Coinflip**\n\nChoose your side:',
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(
                    `arcade-coinflip:heads:${interaction.user.id}`
                  )
                  .setLabel('Heads')
                  .setEmoji('🙂')
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId(
                    `arcade-coinflip:tails:${interaction.user.id}`
                  )
                  .setLabel('Tails')
                  .setEmoji('🔄')
                  .setStyle(ButtonStyle.Primary)
              ),
            ],
            flags: 64,
          });

          return;
        }

        if (game === 'higher-lower') {
          const {
            ActionRowBuilder,
            ButtonBuilder,
            ButtonStyle,
          } = await import('discord.js');

          await interaction.reply({
            content: '📈 **Higher or Lower**\n\nChoose your prediction:',
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(
                    `arcade-higher-lower:higher:${interaction.user.id}`
                  )
                  .setLabel('Higher')
                  .setEmoji('⬆️')
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId(
                    `arcade-higher-lower:lower:${interaction.user.id}`
                  )
                  .setLabel('Lower')
                  .setEmoji('⬇️')
                  .setStyle(ButtonStyle.Primary)
              ),
            ],
            flags: 64,
          });

          return;
        }

        if (game === 'memory') {
          await interaction.deferReply({ flags: 64 });

          const { startMemory } = await import(
            '../commands/arcade/memory.js'
          );

          await startMemory(interaction, true);
          return;
        }

        if (game === 'code-breaker') {
          await interaction.deferReply({ flags: 64 });

          const { startCodeBreaker } = await import(
            '../commands/arcade/code-breaker.js'
          );

          await startCodeBreaker(interaction, true);
          return;
        }

        await interaction.reply({
          content: '❌ I could not identify that Arcade game.',
          flags: 64,
        });
      } catch (error) {
        logger.error(
          `Error handling Arcade button ${interaction.customId}:`,
          error
        );

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ Something went wrong while opening that Arcade game.',
            flags: 64,
          }).catch(() => {});
        }
      }

      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`No handler found for /${interaction.commandName}`);

      await interaction.reply({
        content:
          `❌ I couldn't find the handler for \`/${interaction.commandName}\`.`,
        flags: 64,
      }).catch((error) => {
        logger.error('Failed to respond to unknown command:', error);
      });

      return;
    }

    try {
      logger.info(
        `Executing /${interaction.commandName} for user ${interaction.user.id}`
      );

      await command.execute(interaction);

      logger.info(
        `Successfully executed /${interaction.commandName} for user ${interaction.user.id}`
      );
    } catch (error) {
      logger.error(
        `Error executing /${interaction.commandName}:`,
        error
      );

      const errorMessage =
        '❌ Something went wrong while processing that command. Please try again.';

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: errorMessage,
            flags: 64,
          });
        } else {
          await interaction.reply({
            content: errorMessage,
            flags: 64,
          });
        }
      } catch (responseError) {
        logger.error(
          'Failed to send interaction error response:',
          responseError
        );
      }
    }
  },
};
