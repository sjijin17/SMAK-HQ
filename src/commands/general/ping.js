import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Verifies that the bot is responsive and displays gateway latency.');

/**
 * Executes the /ping slash command.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const sent = await interaction.reply({
    content: '🏓 Pong! Bot is online.',
    fetchReply: true,
  });

  const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
  const wsPing = interaction.client.ws.ping;

  await interaction.editReply(
    `🏓 **Pong! Bot is online.**\n⏱️ **Roundtrip Latency:** ${roundtripLatency}ms\n📡 **Discord Gateway:** ${wsPing}ms`
  );
}

export default { data, execute };
