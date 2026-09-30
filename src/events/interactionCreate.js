import { logger } from '../utils/logger.js';
import { formatUserErrorMessage } from '../utils/errors.js';

export const name = 'interactionCreate';
export const once = false;

/**
 * Handles incoming interactions (Slash Commands, Buttons, Select Menus, Modals).
 * @param {import('discord.js').BaseInteraction} interaction
 */
export async function execute(interaction) {
  // Handle Slash Commands (ChatInputCommand)
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Received unknown slash command: /${interaction.commandName}`);
      await interaction.reply({
        content: `❌ Unknown command: \`/${interaction.commandName}\`. It may have been deprecated or moved.`,
        ephemeral: true,
      });
      return;
    }

    try {
      logger.debug(
        `Executing command /${interaction.commandName} by ${interaction.user.tag} in guild ${interaction.guildId || 'DM'}`
      );
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing /${interaction.commandName}:`, error);

      const errorMessage = formatUserErrorMessage(error);

      // Reply safely depending on whether response was already deferred or sent
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      } catch (replyError) {
        logger.error('Failed to send error notification to interaction:', replyError);
      }
    }
    return;
  }

  // Future milestone handler for Buttons (e.g. Escape Room, Arcade, Shop)
  if (interaction.isButton()) {
    logger.debug(`Received button interaction: ${interaction.customId} from ${interaction.user.tag}`);
    // Prepared for future component handlers
    return;
  }

  // Future milestone handler for Select Menus (e.g. Shop item selector)
  if (interaction.isAnySelectMenu()) {
    logger.debug(`Received select menu interaction: ${interaction.customId} from ${interaction.user.tag}`);
    return;
  }

  // Future milestone handler for Modals (e.g. Escape Room riddle input)
  if (interaction.isModalSubmit()) {
    logger.debug(`Received modal submission: ${interaction.customId} from ${interaction.user.tag}`);
    return;
  }
}

export default { name, once, execute };
