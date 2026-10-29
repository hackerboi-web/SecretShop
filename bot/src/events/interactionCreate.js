"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInteraction = handleInteraction;
const index_js_1 = require("../index.js");
const config_js_1 = require("../config.js");
const supabase_js_1 = require("../supabase.js");
const index_js_2 = require("../economy/index.js");
const panels_js_1 = require("../components/panels.js");
const config_js_2 = require("../config.js");
async function handleInteraction(interaction) {
    try {
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction);
        }
        else if (interaction.isButton()) {
            await handleButton(interaction);
        }
        else if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction);
        }
    }
    catch (error) {
        console.error('[Interaction] Error:', error);
        const message = error instanceof Error ? error.message : 'An error occurred';
        if (interaction.isButton() || interaction.isStringSelectMenu()) {
            await interaction.update((0, panels_js_1.buildErrorPanel)(message));
        }
        else if (interaction.isChatInputCommand()) {
            await interaction.reply({ content: message, ephemeral: true });
        }
    }
}
async function handleSlashCommand(interaction) {
    const { commandName, user, guild } = interaction;
    // Get or create user
    const dbUser = await (0, index_js_2.getOrCreateUser)(user.id, user.username, user.avatar);
    switch (commandName) {
        case 'balance': {
            const target = interaction.options.getUser('user') || user;
            const targetUser = await (0, index_js_2.getOrCreateUser)(target.id, target.username, target.avatar);
            await interaction.reply({
                content: `**${target.username}** has **${targetUser.balance.toLocaleString()} pts**`,
                ephemeral: target.id !== user.id,
            });
            break;
        }
        case 'shop': {
            const items = await (0, index_js_2.getShopItems)();
            await interaction.reply((0, panels_js_1.buildShopPanel)(items));
            break;
        }
        case 'buy': {
            const itemId = interaction.options.getString('item', true);
            const quantity = interaction.options.getInteger('quantity') || 1;
            await interaction.deferReply({ ephemeral: true });
            try {
                const result = await (0, index_js_2.purchaseItem)(user.id, itemId, quantity);
                await interaction.editReply((0, panels_js_1.buildSuccessPanel)(`Purchased **${result.item.name}** ×${quantity} for ${(result.item.price * quantity).toLocaleString()} pts!`));
            }
            catch (e) {
                await interaction.editReply((0, panels_js_1.buildErrorPanel)(e instanceof Error ? e.message : 'Purchase failed'));
            }
            break;
        }
        case 'inventory': {
            const inv = await (0, index_js_2.getInventory)(user.id);
            await interaction.reply((0, panels_js_1.buildInventoryPanel)(inv, dbUser.balance));
            break;
        }
        case 'daily': {
            await interaction.deferReply({ ephemeral: true });
            try {
                const result = await (0, index_js_2.claimDaily)(user.id);
                await interaction.editReply((0, panels_js_1.buildSuccessPanel)(`Claimed **${result.reward.toLocaleString()} pts**! Streak: ${result.streak} days`));
            }
            catch (e) {
                await interaction.editReply((0, panels_js_1.buildErrorPanel)(e instanceof Error ? e.message : 'Failed to claim daily'));
            }
            break;
        }
        case 'chest': {
            const chests = [
                { id: 'basic', name: 'Basic Chest', description: 'Common rewards', cost: 500, cooldown: 3600000, rewards: ['Points', 'Common Ore'] },
                { id: 'premium', name: 'Premium Chest', description: 'Rare rewards', cost: 2000, cooldown: 7200000, rewards: ['Points', 'Rare Crystal', 'Ancient Shard'] },
            ];
            await interaction.reply((0, panels_js_1.buildChestPanel)(chests, {}));
            break;
        }
        case 'forge': {
            const recipes = [
                { id: 'steel_ingot', name: 'Forged Steel Ingot', description: 'Combine ores into steel', success_rate: 0.8, materials: [{ item_id: 'common_ore', quantity: 5 }] },
                { id: 'enchanted_ingot', name: 'Enchanted Ingot', description: 'Rare crafting material', success_rate: 0.5, materials: [{ item_id: 'rare_crystal', quantity: 3 }, { item_id: 'forge_guard_pass', quantity: 1 }] },
            ];
            await interaction.reply((0, panels_js_1.buildForgePanel)(recipes, {}));
            break;
        }
        case 'quests': {
            const quests = [
                { id: 'daily_chest', name: 'Chest Opener', description: 'Open 3 chests', target: 3, reward_points: 1000 },
                { id: 'daily_forge', name: 'Master Smith', description: 'Craft 5 items', target: 5, reward_points: 2000 },
            ];
            await interaction.reply((0, panels_js_1.buildQuestsPanel)(quests, []));
            break;
        }
        case 'giveaway': {
            await interaction.reply((0, panels_js_1.buildGiveawayPanel)([]));
            break;
        }
        case 'vault': {
            await interaction.reply((0, panels_js_1.buildVaultPanel)([]));
            break;
        }
        case 'activity': {
            const txs = await (0, index_js_2.getTransactions)(user.id, 10);
            await interaction.reply((0, panels_js_1.buildActivityPanel)(txs));
            break;
        }
        case 'leaderboard': {
            const lb = await (0, index_js_2.getLeaderboard)(10);
            const lines = lb.map((u, i) => `${i + 1}. **${u.username}** — ${u.balance.toLocaleString()} pts`);
            await interaction.reply({ content: `## 🏆 Leaderboard\n${lines.join('\n')}`, ephemeral: true });
            break;
        }
        // Admin commands
        case 'give': {
            if (!isAdmin(interaction.member))
                return interaction.reply({ content: 'No permission', ephemeral: true });
            const target = interaction.options.getUser('user', true);
            const amount = interaction.options.getInteger('amount', true);
            await (0, index_js_2.adjustBalance)(target.id, amount, 'admin_give', null, 1, null, { admin: user.id });
            await interaction.reply({ content: `Gave ${amount} pts to ${target.username}`, ephemeral: true });
            break;
        }
        case 'take': {
            if (!isAdmin(interaction.member))
                return interaction.reply({ content: 'No permission', ephemeral: true });
            const target = interaction.options.getUser('user', true);
            const amount = interaction.options.getInteger('amount', true);
            await (0, index_js_2.adjustBalance)(target.id, -amount, 'admin_take', null, 1, null, { admin: user.id });
            await interaction.reply({ content: `Took ${amount} pts from ${target.username}`, ephemeral: true });
            break;
        }
        case 'setshop': {
            if (!isAdmin(interaction.member))
                return interaction.reply({ content: 'No permission', ephemeral: true });
            const itemId = interaction.options.getString('item', true);
            const price = interaction.options.getInteger('price', true);
            const itemsConfig = await (0, config_js_2.loadItemsConfig)();
            if (!itemsConfig.items[itemId])
                return interaction.reply({ content: 'Item not found', ephemeral: true });
            itemsConfig.items[itemId].price = price;
            // Save to file (simplified - in production use proper file writing)
            await supabase_js_1.supabase.from('shop_items').update({ price }).eq('item_id', itemId);
            await interaction.reply({ content: `Set ${itemId} price to ${price}`, ephemeral: true });
            break;
        }
        case 'panel': {
            if (!isAdmin(interaction.member))
                return interaction.reply({ content: 'No permission', ephemeral: true });
            const panelName = interaction.options.getString('name', true);
            const channel = interaction.channel;
            if (channel?.isTextBased()) {
                await index_js_1.panelManager.postPanel(channel, panelName);
                await interaction.reply({ content: `Posted ${panelName} panel`, ephemeral: true });
            }
            break;
        }
        case 'repost': {
            if (!isAdmin(interaction.member))
                return interaction.reply({ content: 'No permission', ephemeral: true });
            await interaction.deferReply({ ephemeral: true });
            await index_js_1.panelManager.repostAllPanels();
            await interaction.editReply({ content: 'All panels reposted' });
            break;
        }
        default:
            await interaction.reply({ content: 'Unknown command', ephemeral: true });
    }
}
async function handleButton(interaction) {
    const [category, action, ...params] = interaction.customId.split(':');
    const user = interaction.user;
    const dbUser = await (0, index_js_2.getOrCreateUser)(user.id, user.username, user.avatar);
    switch (category) {
        case 'bank': {
            switch (action) {
                case 'panel':
                    await interaction.update((0, panels_js_1.buildBankPanel)(dbUser));
                    break;
                case 'activity':
                    const txs = await (0, index_js_2.getTransactions)(user.id, 10);
                    await interaction.update((0, panels_js_1.buildActivityPanel)(txs));
                    break;
                case 'vault':
                    await interaction.update((0, panels_js_1.buildVaultPanel)([]));
                    break;
                case 'transfer':
                    await interaction.update((0, panels_js_1.buildErrorPanel)('Transfer feature coming soon'));
                    break;
            }
            break;
        }
        case 'shop': {
            switch (action) {
                case 'open':
                    const items = await (0, index_js_2.getShopItems)();
                    await interaction.update((0, panels_js_1.buildShopPanel)(items));
                    break;
                case 'page':
                    const page = parseInt(params[0]) || 0;
                    const allItems = await (0, index_js_2.getShopItems)();
                    await interaction.update((0, panels_js_1.buildShopPanel)(allItems, page));
                    break;
                case 'buy': {
                    const itemId = params[0];
                    const quantity = parseInt(params[1]) || 1;
                    await interaction.deferUpdate();
                    try {
                        const result = await (0, index_js_2.purchaseItem)(user.id, itemId, quantity);
                        await interaction.editReply((0, panels_js_1.buildSuccessPanel)(`Purchased **${result.item.name}** ×${quantity}!`));
                    }
                    catch (e) {
                        await interaction.editReply((0, panels_js_1.buildErrorPanel)(e instanceof Error ? e.message : 'Purchase failed'));
                    }
                    break;
                }
                case 'categories':
                    await interaction.update((0, panels_js_1.buildErrorPanel)('Categories view coming soon'));
                    break;
            }
            break;
        }
        case 'inventory': {
            switch (action) {
                case 'open':
                    const inv = await (0, index_js_2.getInventory)(user.id);
                    await interaction.update((0, panels_js_1.buildInventoryPanel)(inv, dbUser.balance));
                    break;
                case 'use':
                    await interaction.update((0, panels_js_1.buildErrorPanel)('Item use coming soon'));
                    break;
                case 'sell':
                    await interaction.update((0, panels_js_1.buildErrorPanel)('Item selling coming soon'));
                    break;
            }
            break;
        }
        case 'daily': {
            if (action === 'claim') {
                await interaction.deferUpdate();
                try {
                    const result = await (0, index_js_2.claimDaily)(user.id);
                    await interaction.editReply((0, panels_js_1.buildSuccessPanel)(`Claimed **${result.reward.toLocaleString()} pts**! Streak: ${result.streak} days`));
                }
                catch (e) {
                    await interaction.editReply((0, panels_js_1.buildErrorPanel)(e instanceof Error ? e.message : 'Failed to claim'));
                }
            }
            break;
        }
        case 'chest': {
            if (action === 'open') {
                await interaction.update((0, panels_js_1.buildErrorPanel)('Chest opening coming soon'));
            }
            break;
        }
        case 'admin': {
            if (!isAdmin(interaction.member)) {
                await interaction.update((0, panels_js_1.buildErrorPanel)('No permission'));
                return;
            }
            switch (action) {
                case 'config':
                    await interaction.update((0, panels_js_1.buildErrorPanel)('Config panel coming soon'));
                    break;
                case 'users':
                    await interaction.update((0, panels_js_1.buildErrorPanel)('User management coming soon'));
                    break;
                case 'shop':
                    await interaction.update((0, panels_js_1.buildErrorPanel)('Shop management coming soon'));
                    break;
                case 'analytics':
                    await interaction.update((0, panels_js_1.buildErrorPanel)('Analytics coming soon'));
                    break;
                case 'panels':
                    await interaction.deferUpdate();
                    await index_js_1.panelManager.repostAllPanels();
                    await interaction.editReply((0, panels_js_1.buildSuccessPanel)('All panels reposted'));
                    break;
            }
            break;
        }
    }
}
async function handleSelectMenu(interaction) {
    await interaction.reply({ content: 'Select menus not yet implemented', ephemeral: true });
}
function isAdmin(member) {
    if (!member?.roles)
        return false;
    return config_js_1.config.adminRoleIds.some(id => member.roles.cache.has(id));
}
//# sourceMappingURL=interactionCreate.js.map