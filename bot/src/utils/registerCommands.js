"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = registerCommands;
const discord_js_1 = require("discord.js");
const config_js_1 = require("../config.js");
const commands = [
    // User commands
    new discord_js_1.SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your or another user\'s balance')
        .addUserOption(opt => opt.setName('user').setDescription('User to check')),
    new discord_js_1.SlashCommandBuilder()
        .setName('shop')
        .setDescription('Open the shop panel'),
    new discord_js_1.SlashCommandBuilder()
        .setName('buy')
        .setDescription('Purchase an item from the shop')
        .addStringOption(opt => opt.setName('item').setDescription('Item ID').setRequired(true))
        .addIntegerOption(opt => opt.setName('quantity').setDescription('Quantity to buy').setMinValue(1)),
    new discord_js_1.SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View your inventory'),
    new discord_js_1.SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward'),
    new discord_js_1.SlashCommandBuilder()
        .setName('chest')
        .setDescription('Open the chest panel'),
    new discord_js_1.SlashCommandBuilder()
        .setName('forge')
        .setDescription('Open the forge panel'),
    new discord_js_1.SlashCommandBuilder()
        .setName('quests')
        .setDescription('View available quests'),
    new discord_js_1.SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('View active giveaways'),
    new discord_js_1.SlashCommandBuilder()
        .setName('vault')
        .setDescription('Manage your vaults'),
    new discord_js_1.SlashCommandBuilder()
        .setName('activity')
        .setDescription('View your activity log'),
    new discord_js_1.SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the server leaderboard'),
    // Admin commands
    new discord_js_1.SlashCommandBuilder()
        .setName('give')
        .setDescription('[Admin] Give points to a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to give').setRequired(true).setMinValue(1)),
    new discord_js_1.SlashCommandBuilder()
        .setName('take')
        .setDescription('[Admin] Take points from a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to take').setRequired(true).setMinValue(1)),
    new discord_js_1.SlashCommandBuilder()
        .setName('setshop')
        .setDescription('[Admin] Set item price')
        .addStringOption(opt => opt.setName('item').setDescription('Item ID').setRequired(true))
        .addIntegerOption(opt => opt.setName('price').setDescription('New price').setRequired(true).setMinValue(0)),
    new discord_js_1.SlashCommandBuilder()
        .setName('panel')
        .setDescription('[Admin] Post a specific panel')
        .addStringOption(opt => opt.setName('name').setDescription('Panel name').setRequired(true)
        .addChoices({ name: 'Bank', value: 'bank' }, { name: 'Shop', value: 'shop' }, { name: 'Daily', value: 'daily' }, { name: 'Chest', value: 'chest' }, { name: 'Forge', value: 'forge' }, { name: 'Quests', value: 'quests' }, { name: 'Giveaways', value: 'giveaways' }, { name: 'Vault', value: 'vault' }, { name: 'Activity', value: 'activity' }, { name: 'Admin', value: 'admin' })),
    new discord_js_1.SlashCommandBuilder()
        .setName('repost')
        .setDescription('[Admin] Repost all panels'),
].map(cmd => cmd.toJSON());
async function registerCommands(client) {
    const rest = new discord_js_1.REST({ version: '10' }).setToken(config_js_1.config.discord.token);
    try {
        console.log('[Commands] Registering slash commands...');
        if (config_js_1.config.nodeEnv === 'development' && config_js_1.config.discord.guildId) {
            await rest.put(discord_js_1.Routes.applicationGuildCommands(config_js_1.config.discord.clientId, config_js_1.config.discord.guildId), { body: commands });
            console.log('[Commands] Guild commands registered');
        }
        else {
            await rest.put(discord_js_1.Routes.applicationCommands(config_js_1.config.discord.clientId), { body: commands });
            console.log('[Commands] Global commands registered');
        }
    }
    catch (error) {
        console.error('[Commands] Failed to register:', error);
        throw error;
    }
}
//# sourceMappingURL=registerCommands.js.map