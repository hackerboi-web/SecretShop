"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelManager = void 0;
const supabase_js_1 = require("../supabase.js");
const config_js_1 = require("../config.js");
const panels_js_1 = require("../components/panels.js");
const index_js_1 = require("../economy/index.js");
class PanelManager {
    client;
    panelKeys = ['bank', 'shop', 'daily', 'chest', 'forge', 'quests', 'giveaways', 'vault', 'activity', 'admin'];
    constructor(client) {
        this.client = client;
    }
    async repostAllPanels() {
        const channel = this.client.channels.cache.get(config_js_1.config.panelChannelId);
        if (!channel) {
            console.error('[Panels] Panel channel not found');
            return;
        }
        // Fetch existing panel messages
        const { data: panels } = await supabase_js_1.supabase.from('bot_panels').select('*');
        const panelMap = new Map(panels?.map(p => [p.panel_key, p]) || []);
        // Purge bot's messages in channel
        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            const botMessages = messages.filter(m => m.author.id === this.client.user?.id);
            for (const msg of botMessages.values()) {
                await msg.delete().catch(() => { });
            }
            await new Promise(r => setTimeout(r, 1000));
        }
        catch (e) {
            console.error('[Panels] Failed to purge messages:', e);
        }
        // Post panels sequentially
        for (const key of this.panelKeys) {
            try {
                await this.postPanel(channel, key);
                await new Promise(r => setTimeout(r, 1500));
            }
            catch (e) {
                console.error(`[Panels] Failed to post ${key}:`, e);
            }
        }
    }
    async postPanel(channel, panelKey, userId) {
        let components;
        switch (panelKey) {
            case 'bank': {
                const user = userId ? await (0, index_js_1.getOrCreateUser)(userId, '', null) : null;
                components = (0, panels_js_1.buildBankPanel)(user || { balance: 0, username: 'User', avatarHash: null });
                break;
            }
            case 'shop': {
                const items = await (0, index_js_1.getShopItems)();
                components = (0, panels_js_1.buildShopPanel)(items);
                break;
            }
            case 'daily': {
                const user = userId ? await (0, index_js_1.getOrCreateUser)(userId, '', null) : null;
                const canClaim = user ? !user.last_daily || (Date.now() - new Date(user.last_daily).getTime()) > 24 * 60 * 60 * 1000 : false;
                components = (0, panels_js_1.buildDailyPanel)({ daily_streak: user?.daily_streak || 0, last_daily: user?.last_daily || null, canClaim });
                break;
            }
            case 'chest': {
                const chests = [
                    { id: 'basic', name: 'Basic Chest', description: 'Common rewards', cost: 500, cooldown: 3600000, rewards: ['Points', 'Common Ore'] },
                    { id: 'premium', name: 'Premium Chest', description: 'Rare rewards', cost: 2000, cooldown: 7200000, rewards: ['Points', 'Rare Crystal', 'Ancient Shard'] },
                ];
                components = (0, panels_js_1.buildChestPanel)(chests, {});
                break;
            }
            case 'forge': {
                const recipes = [
                    { id: 'steel_ingot', name: 'Forged Steel Ingot', description: 'Combine ores into steel', success_rate: 0.8, materials: [{ item_id: 'common_ore', quantity: 5 }] },
                    { id: 'enchanted_ingot', name: 'Enchanted Ingot', description: 'Rare crafting material', success_rate: 0.5, materials: [{ item_id: 'rare_crystal', quantity: 3 }, { item_id: 'forge_guard_pass', quantity: 1 }] },
                ];
                components = (0, panels_js_1.buildForgePanel)(recipes, {});
                break;
            }
            case 'quests': {
                const quests = [
                    { id: 'daily_chest', name: 'Chest Opener', description: 'Open 3 chests', target: 3, reward_points: 1000 },
                    { id: 'daily_forge', name: 'Master Smith', description: 'Craft 5 items', target: 5, reward_points: 2000 },
                ];
                components = (0, panels_js_1.buildQuestsPanel)(quests, []);
                break;
            }
            case 'giveaways': {
                components = (0, panels_js_1.buildGiveawayPanel)([]);
                break;
            }
            case 'vault': {
                components = (0, panels_js_1.buildVaultPanel)([]);
                break;
            }
            case 'activity': {
                components = (0, panels_js_1.buildActivityPanel)([]);
                break;
            }
            case 'admin': {
                components = (0, panels_js_1.buildAdminPanel)();
                break;
            }
            default:
                return null;
        }
        const message = await channel.send(components);
        await supabase_js_1.supabase.from('bot_panels').upsert({
            panel_key: panelKey,
            channel_id: channel.id,
            message_id: message.id,
        });
        return message;
    }
    async updatePanel(panelKey, components) {
        const { data: panel } = await supabase_js_1.supabase
            .from('bot_panels')
            .select('channel_id, message_id')
            .eq('panel_key', panelKey)
            .single();
        if (!panel)
            return;
        const channel = this.client.channels.cache.get(panel.channel_id);
        if (!channel)
            return;
        try {
            const message = await channel.messages.fetch(panel.message_id);
            await message.edit(components);
        }
        catch (e) {
            console.error(`[Panels] Failed to update ${panelKey}:`, e);
        }
    }
}
exports.PanelManager = PanelManager;
//# sourceMappingURL=panelManager.js.map