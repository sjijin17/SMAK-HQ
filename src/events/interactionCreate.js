import { logger } from '../utils/logger.js';

export default {
  name: 'interactionCreate',

  async execute(interaction) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`No handler found for /${interaction.commandName}`);

      await interaction.reply({
        content: `❌ I couldn't find the handler for \`/${interaction.commandName}\`.`,
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
