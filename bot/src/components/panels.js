"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBankPanel = buildBankPanel;
exports.buildShopPanel = buildShopPanel;
exports.buildInventoryPanel = buildInventoryPanel;
exports.buildDailyPanel = buildDailyPanel;
exports.buildChestPanel = buildChestPanel;
exports.buildForgePanel = buildForgePanel;
exports.buildQuestsPanel = buildQuestsPanel;
exports.buildGiveawayPanel = buildGiveawayPanel;
exports.buildVaultPanel = buildVaultPanel;
exports.buildActivityPanel = buildActivityPanel;
exports.buildAdminPanel = buildAdminPanel;
exports.buildErrorPanel = buildErrorPanel;
exports.buildSuccessPanel = buildSuccessPanel;
const v2_js_1 = require("./v2.js");
function buildBankPanel(user) {
    const components = [
        (0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`## 🏦 Bank Panel\nWelcome back, **${user.username}**!`),
            (0, v2_js_1.createTextDisplay)(`**Balance:** ${user.balance.toLocaleString()} pts\n**Lifetime Earned:** ${user.balance.toLocaleString()} pts`),
        ], user.avatarHash ? (0, v2_js_1.createThumbnail)({ url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatarHash}.png`, description: user.username }) : undefined),
        (0, v2_js_1.createSeparator)(),
        (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('bank:activity', '📜 Activity Log', 2), (0, v2_js_1.createButton)('bank:vault', '🏪 Vault', 2), (0, v2_js_1.createButton)('bank:transfer', '💸 Transfer', 1)),
        (0, v2_js_1.createSeparator)(),
        (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('shop:open', '🛒 Shop', 3), (0, v2_js_1.createButton)('daily:claim', '🎁 Daily', 3), (0, v2_js_1.createButton)('chest:open', '📦 Chest', 1)),
    ];
    return (0, v2_js_1.componentsV2Payload)(null, components);
}
function buildShopPanel(items, page = 0, pageSize = 5) {
    const start = page * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    const totalPages = Math.ceil(items.length / pageSize);
    const components = [
        (0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`## 🛒 Secret Shop\nBrowse and purchase items with your loyalty points.`),
            (0, v2_js_1.createTextDisplay)(`Page ${page + 1}/${totalPages} • ${items.length} items available`),
        ]),
        (0, v2_js_1.createSeparator)(),
    ];
    for (const item of pageItems) {
        const metadata = item.metadata || {};
        const rarityColors = {
            common: 0x9CA3AF,
            uncommon: 0x22C55E,
            rare: 0x3B82F6,
            epic: 0xA855F7,
            legendary: 0xF59E0B,
        };
        const color = rarityColors[metadata.rarity] || 0x5865F2;
        components.push((0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`### ${item.name}\n${item.description}\n**Price:** ${item.price.toLocaleString()} pts | **Category:** ${item.category}`),
            (0, v2_js_1.createTextDisplay)(item.consumable ? '🔄 **Consumable**' : '♾️ **Permanent**' + (item.max_per_user ? ` • Max: ${item.max_per_user}` : '')),
        ]), (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)(`shop:buy:${item.item_id}:1`, 'Buy 1', 3, false), (0, v2_js_1.createButton)(`shop:buy:${item.item_id}:5`, 'Buy 5', 2, false), (0, v2_js_1.createButton)(`shop:buy:${item.item_id}:10`, 'Buy 10', 2, false)), (0, v2_js_1.createSeparator)());
    }
    // Pagination
    if (totalPages > 1) {
        const paginationButtons = [];
        if (page > 0)
            paginationButtons.push((0, v2_js_1.createButton)(`shop:page:${page - 1}`, '◀ Previous', 2));
        if (page < totalPages - 1)
            paginationButtons.push((0, v2_js_1.createButton)(`shop:page:${page + 1}`, 'Next ▶', 2));
        if (paginationButtons.length > 0) {
            components.push((0, v2_js_1.createActionRow)(...paginationButtons));
        }
    }
    components.push((0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('shop:categories', '📂 Categories', 2), (0, v2_js_1.createButton)('inventory:open', '🎒 Inventory', 2)));
    return (0, v2_js_1.componentsV2Payload)(null, components);
}
function buildInventoryPanel(inventory, userBalance) {
    if (inventory.length === 0) {
        return (0, v2_js_1.componentsV2Payload)(null, [
            (0, v2_js_1.createSection)([
                (0, v2_js_1.createTextDisplay)(`## 🎒 Inventory\nYour inventory is empty.`),
                (0, v2_js_1.createTextDisplay)(`**Balance:** ${userBalance.toLocaleString()} pts`),
            ]),
            (0, v2_js_1.createSeparator)(),
            (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('shop:open', '🛒 Go to Shop', 3))
        ]);
    }
    const components = [
        (0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`## 🎒 Inventory\n**Balance:** ${userBalance.toLocaleString()} pts`),
            (0, v2_js_1.createTextDisplay)(`${inventory.length} unique items`),
        ]),
        (0, v2_js_1.createSeparator)(),
    ];
    for (const invItem of inventory.slice(0, 10)) {
        const item = invItem.item_data;
        if (!item)
            continue;
        components.push((0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`**${item.name}** ×${invItem.quantity}\n${item.description}`),
        ]), (0, v2_js_1.createActionRow)(item.consumable ? (0, v2_js_1.createButton)(`inventory:use:${invItem.item_id}`, 'Use', 3) : (0, v2_js_1.createButton)(`inventory:info:${invItem.item_id}`, 'Info', 2), (0, v2_js_1.createButton)(`inventory:sell:${invItem.item_id}`, 'Sell', 4)), (0, v2_js_1.createSeparator)());
    }
    if (inventory.length > 10) {
        components.push((0, v2_js_1.createTextDisplay)(`... and ${inventory.length - 10} more items`));
    }
    components.push((0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('shop:open', '🛒 Shop', 3)));
    return (0, v2_js_1.componentsV2Payload)(null, components);
}
function buildDailyPanel(user) {
    const streak = user.daily_streak;
    const baseReward = 500;
    const streakBonus = Math.min(streak * 50, 2500);
    const totalReward = baseReward + streakBonus;
    const components = [
        (0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`## 🎁 Daily Reward\n**Current Streak:** ${streak} days 🔥`),
            (0, v2_js_1.createTextDisplay)(`**Base Reward:** ${baseReward} pts\n**Streak Bonus:** +${streakBonus} pts\n**Total:** **${totalReward} pts**`),
        ]),
        (0, v2_js_1.createSeparator)(),
    ];
    if (user.canClaim) {
        components.push((0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('daily:claim', `Claim ${totalReward} pts`, 3, false, { name: '🎁' })));
    }
    else {
        const nextClaim = user.last_daily ? new Date(new Date(user.last_daily).getTime() + 24 * 60 * 60 * 1000) : new Date();
        components.push((0, v2_js_1.createTextDisplay)(`⏰ Next claim available: <t:${Math.floor(nextClaim.getTime() / 1000)}:R>`), (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('daily:claim', 'Claim', 2, true, { name: '🎁' })));
    }
    components.push((0, v2_js_1.createSeparator)(), (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('shop:open', '🛒 Shop', 2), (0, v2_js_1.createButton)('chest:open', '📦 Chest', 2)));
    return (0, v2_js_1.componentsV2Payload)(null, components);
}
function buildChestPanel(chests, cooldowns) {
    const components = [
        (0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`## 📦 Chest Opening\nChoose a chest to open for random rewards!`),
        ]),
        (0, v2_js_1.createSeparator)(),
    ];
    for (const chest of chests) {
        const onCooldown = cooldowns[chest.id] && cooldowns[chest.id] > Date.now();
        const remaining = onCooldown ? Math.ceil((cooldowns[chest.id] - Date.now()) / 1000) : 0;
        components.push((0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`### ${chest.name}\n${chest.description}\n**Cost:** ${chest.cost} pts | **Cooldown:** ${chest.cooldown / 1000}s`),
            (0, v2_js_1.createTextDisplay)(onCooldown ? `⏳ Cooldown: ${remaining}s` : `🎯 Rewards: ${chest.rewards.join(', ')}`),
        ]), (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)(`chest:open:${chest.id}`, onCooldown ? 'On Cooldown' : 'Open', onCooldown ? 2 : 3, onCooldown)), (0, v2_js_1.createSeparator)());
    }
    components.push((0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('bank:panel', '🏦 Bank', 2)));
    return (0, v2_js_1.componentsV2Payload)(null, components);
}
function buildForgePanel(recipes, userMaterials) {
    const components = [
        (0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`## ⚒️ Forge\nCraft powerful items from materials.`),
        ]),
        (0, v2_js_1.createSeparator)(),
    ];
    for (const recipe of recipes) {
        const canCraft = recipe.materials.every((m) => (userMaterials[m.item_id] || 0) >= m.quantity);
        const missing = recipe.materials.filter((m) => (userMaterials[m.item_id] || 0) < m.quantity);
        components.push((0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`### ${recipe.name}\n${recipe.description}\n**Success Rate:** ${recipe.success_rate * 100}%`),
            (0, v2_js_1.createTextDisplay)(canCraft ? '✅ **Ready to craft!**' : `❌ Missing: ${missing.map(m => `${m.item_id} (${m.quantity - (userMaterials[m.item_id] || 0)})`).join(', ')}`),
        ]), (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)(`forge:craft:${recipe.id}`, 'Craft', canCraft ? 3 : 2, !canCraft)), (0, v2_js_1.createSeparator)());
    }
    components.push((0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('bank:panel', '🏦 Bank', 2)));
    return (0, v2_js_1.componentsV2Payload)(null, components);
}
function buildQuestsPanel(quests, userQuests) {
    const components = [
        (0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`## 📋 Quests\nComplete objectives for rewards!`),
        ]),
        (0, v2_js_1.createSeparator)(),
    ];
    for (const quest of quests) {
        const userQuest = userQuests.find(uq => uq.quest_id === quest.id);
        const progress = userQuest?.progress || 0;
        const completed = userQuest?.completed || false;
        const claimed = userQuest?.claimed || false;
        const percent = Math.min(100, Math.round((progress / quest.target) * 100));
        const bar = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));
        components.push((0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`### ${quest.name}\n${quest.description}\n**Progress:** ${bar} ${percent}% (${progress}/${quest.target})`),
            (0, v2_js_1.createTextDisplay)(`**Reward:** ${quest.reward_points} pts ${quest.reward_items?.map((i) => `${i.item_id}×${i.qty}`).join(', ') || ''}`),
        ]), (0, v2_js_1.createActionRow)(completed && !claimed
            ? (0, v2_js_1.createButton)(`quest:claim:${quest.id}`, 'Claim Reward', 3)
            : claimed
                ? (0, v2_js_1.createButton)(`quest:claim:${quest.id}`, 'Claimed', 2, true)
                : (0, v2_js_1.createButton)(`quest:claim:${quest.id}`, 'In Progress', 2, true)), (0, v2_js_1.createSeparator)());
    }
    components.push((0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('bank:panel', '🏦 Bank', 2)));
    return (0, v2_js_1.componentsV2Payload)(null, components);
}
function buildGiveawayPanel(giveaways) {
    const components = [
        (0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`## 🎉 Giveaways\nJoin active giveaways for a chance to win!`),
        ]),
        (0, v2_js_1.createSeparator)(),
    ];
    if (giveaways.length === 0) {
        components.push((0, v2_js_1.createTextDisplay)('No active giveaways at the moment.'));
    }
    else {
        for (const g of giveaways) {
            const endsAt = new Date(g.ends_at).getTime();
            const now = Date.now();
            const timeLeft = endsAt - now;
            components.push((0, v2_js_1.createSection)([
                (0, v2_js_1.createTextDisplay)(`### ${g.prize_points > 0 ? `${g.prize_points} pts` : 'Item Prize'}\n**Entries:** ${g.entries || 0}/${g.max_entries || '∞'} | **Winners:** ${g.winners_count}`),
                (0, v2_js_1.createTextDisplay)(`⏰ Ends: <t:${Math.floor(endsAt / 1000)}:R>`),
            ]), (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)(`giveaway:join:${g.id}`, g.entry_cost > 0 ? `Join (${g.entry_cost} pts)` : 'Join Free', 3)), (0, v2_js_1.createSeparator)());
        }
    }
    components.push((0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('bank:panel', '🏦 Bank', 2)));
    return (0, v2_js_1.componentsV2Payload)(null, components);
}
function buildVaultPanel(vaults) {
    const components = [
        (0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`## 🏪 Vault Management\nStore and organize your items and points.`),
        ]),
        (0, v2_js_1.createSeparator)(),
    ];
    for (const vault of vaults) {
        const itemCount = Object.values(vault.items).reduce((a, b) => a + b, 0);
        const itemPercent = Math.round((itemCount / vault.capacity_items) * 100);
        const pointPercent = Math.round((vault.points / vault.capacity_points) * 100);
        components.push((0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`### ${vault.vault_tier.charAt(0).toUpperCase() + vault.vault_tier.slice(1)} Vault\n**Items:** ${itemCount}/${vault.capacity_items} (${itemPercent}%)\n**Points:** ${vault.points.toLocaleString()}/${vault.capacity_points.toLocaleString()} (${pointPercent}%)`),
        ]), (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)(`vault:deposit:${vault.vault_tier}`, '📥 Deposit', 3), (0, v2_js_1.createButton)(`vault:withdraw:${vault.vault_tier}`, '📤 Withdraw', 2), (0, v2_js_1.createButton)(`vault:view:${vault.vault_tier}`, '👁 View', 2)), (0, v2_js_1.createSeparator)());
    }
    components.push((0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('bank:panel', '🏦 Bank', 2)));
    return (0, v2_js_1.componentsV2Payload)(null, components);
}
function buildActivityPanel(activities) {
    const components = [
        (0, v2_js_1.createSection)([
            (0, v2_js_1.createTextDisplay)(`## 📜 Activity Log\nYour recent economy activity.`),
        ]),
        (0, v2_js_1.createSeparator)(),
    ];
    if (activities.length === 0) {
        components.push((0, v2_js_1.createTextDisplay)('No recent activity.'));
    }
    else {
        for (const act of activities.slice(0, 10)) {
            const sign = act.amount > 0 ? '+' : '';
            const color = act.amount > 0 ? '🟢' : '🔴';
            components.push((0, v2_js_1.createTextDisplay)(`${color} **${act.type}** ${sign}${act.amount} pts • <t:${Math.floor(new Date(act.created_at).getTime() / 1000)}:R>`));
        }
    }
    components.push((0, v2_js_1.createSeparator)());
    components.push((0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('bank:panel', '🏦 Bank', 2)));
    return (0, v2_js_1.componentsV2Payload)(null, components);
}
function buildAdminPanel() {
    return (0, v2_js_1.componentsV2Payload)(null, [
        (0, v2_js_1.createSection)([(0, v2_js_1.createTextDisplay)(`## ⚙️ Admin Panel\nBot management and configuration.`)]),
        (0, v2_js_1.createSeparator)(),
        (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('admin:config', '⚙️ Config', 2), (0, v2_js_1.createButton)('admin:users', '👥 Users', 2), (0, v2_js_1.createButton)('admin:shop', '🛒 Shop', 2)),
        (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('admin:analytics', '📊 Analytics', 2), (0, v2_js_1.createButton)('admin:panels', '🔄 Repost Panels', 4)),
        (0, v2_js_1.createSeparator)(),
        (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)('bank:panel', '🏦 Bank', 2)),
    ]);
}
function buildErrorPanel(message, backAction = 'bank:panel') {
    return (0, v2_js_1.componentsV2Payload)(null, [
        (0, v2_js_1.createSection)([(0, v2_js_1.createTextDisplay)(`## ❌ Error\n${message}`)]),
        (0, v2_js_1.createSeparator)(),
        (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)(backAction, '← Back', 2)),
    ]);
}
function buildSuccessPanel(message, backAction = 'bank:panel') {
    return (0, v2_js_1.componentsV2Payload)(null, [
        (0, v2_js_1.createSection)([(0, v2_js_1.createTextDisplay)(`## ✅ Success\n${message}`)]),
        (0, v2_js_1.createSeparator)(),
        (0, v2_js_1.createActionRow)((0, v2_js_1.createButton)(backAction, '← Back', 2)),
    ]);
}
//# sourceMappingURL=panels.js.map