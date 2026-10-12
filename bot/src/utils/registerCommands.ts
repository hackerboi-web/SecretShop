import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config } from '../config.js';
import { client } from '../index.js';

const commands = [
  // User commands
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your or another user\'s balance')
    .addUserOption(opt => opt.setName('user').setDescription('User to check')),

  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Open the shop panel'),

  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase an item from the shop')
    .addStringOption(opt => opt.setName('item').setDescription('Item ID').setRequired(true))
    .addIntegerOption(opt => opt.setName('quantity').setDescription('Quantity to buy').setMinValue(1)),

  new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your inventory'),

  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),

  new SlashCommandBuilder()
    .setName('chest')
    .setDescription('Open the chest panel'),

  new SlashCommandBuilder()
    .setName('forge')
    .setDescription('Open the forge panel'),

  new SlashCommandBuilder()
    .setName('quests')
    .setDescription('View available quests'),

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('View active giveaways'),

  new SlashCommandBuilder()
    .setName('vault')
    .setDescription('Manage your vaults'),

  new SlashCommandBuilder()
    .setName('activity')
    .setDescription('View your activity log'),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server leaderboard'),

  // Admin commands
  new SlashCommandBuilder()
    .setName('give')
    .setDescription('[Admin] Give points to a user')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to give').setRequired(true).setMinValue(1)),

  new SlashCommandBuilder()
    .setName('take')
    .setDescription('[Admin] Take points from a user')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to take').setRequired(true).setMinValue(1)),

  new SlashCommandBuilder()
    .setName('setshop')
    .setDescription('[Admin] Set item price')
    .addStringOption(opt => opt.setName('item').setDescription('Item ID').setRequired(true))
    .addIntegerOption(opt => opt.setName('price').setDescription('New price').setRequired(true).setMinValue(0)),

  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('[Admin] Post a specific panel')
    .addStringOption(opt => opt.setName('name').setDescription('Panel name').setRequired(true)
      .addChoices(
        { name: 'Bank', value: 'bank' },
        { name: 'Shop', value: 'shop' },
        { name: 'Daily', value: 'daily' },
        { name: 'Chest', value: 'chest' },
        { name: 'Forge', value: 'forge' },
        { name: 'Quests', value: 'quests' },
        { name: 'Giveaways', value: 'giveaways' },
        { name: 'Vault', value: 'vault' },
        { name: 'Activity', value: 'activity' },
        { name: 'Admin', value: 'admin' },
      )),

  new SlashCommandBuilder()
    .setName('repost')
    .setDescription('[Admin] Repost all panels'),
].map(cmd => cmd.toJSON());

export async function registerCommands(client: any) {
  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    console.log('[Commands] Registering slash commands...');

    if (config.nodeEnv === 'development' && config.discord.guildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands }
      );
      console.log('[Commands] Guild commands registered');
    } else {
      await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands }
      );
      console.log('[Commands] Global commands registered');
    }
  } catch (error) {
    console.error('[Commands] Failed to register:', error);
    throw error;
  }
}