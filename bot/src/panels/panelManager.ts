import { Client, TextChannel, Message } from 'discord.js';
import { supabase } from '../supabase.js';
import { config } from '../config.js';
import {
  buildBankPanel,
  buildShopPanel,
  buildDailyPanel,
  buildChestPanel,
  buildForgePanel,
  buildQuestsPanel,
  buildGiveawayPanel,
  buildVaultPanel,
  buildActivityPanel,
  buildAdminPanel,
} from '../components/panels.js';
import { getOrCreateUser, getInventory, getShopItems, getTransactions, getLeaderboard } from '../economy/index.js';

export class PanelManager {
  private client: Client;
  private panelKeys = ['bank', 'shop', 'daily', 'chest', 'forge', 'quests', 'giveaways', 'vault', 'activity', 'admin'];

  constructor(client: Client) {
    this.client = client;
  }

  async repostAllPanels(): Promise<void> {
    const channel = this.client.channels.cache.get(config.panelChannelId) as TextChannel;
    if (!channel) {
      console.error('[Panels] Panel channel not found');
      return;
    }

    // Fetch existing panel messages
    const { data: panels } = await supabase.from('bot_panels').select('*');
    const panelMap = new Map(panels?.map(p => [p.panel_key, p]) || []);

    // Purge bot's messages in channel
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const botMessages = messages.filter(m => m.author.id === this.client.user?.id);
      for (const msg of botMessages.values()) {
        await msg.delete().catch(() => {});
      }
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error('[Panels] Failed to purge messages:', e);
    }

    // Post panels sequentially
    for (const key of this.panelKeys) {
      try {
        await this.postPanel(channel, key);
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
        console.error(`[Panels] Failed to post ${key}:`, e);
      }
    }
  }

  async postPanel(channel: TextChannel, panelKey: string, userId?: string): Promise<Message | null> {
    let components: any;

    switch (panelKey) {
      case 'bank': {
        const user = userId ? await getOrCreateUser(userId, '', null) : null;
        components = buildBankPanel(user || { balance: 0, username: 'User', avatarHash: null });
        break;
      }
      case 'shop': {
        const items = await getShopItems();
        components = buildShopPanel(items);
        break;
      }
      case 'daily': {
        const user = userId ? await getOrCreateUser(userId, '', null) : null;
        const canClaim = user ? !user.last_daily || (Date.now() - new Date(user.last_daily).getTime()) > 24 * 60 * 60 * 1000 : false;
        components = buildDailyPanel({ daily_streak: user?.daily_streak || 0, last_daily: user?.last_daily || null, canClaim });
        break;
      }
      case 'chest': {
        const chests = [
          { id: 'basic', name: 'Basic Chest', description: 'Common rewards', cost: 500, cooldown: 3600000, rewards: ['Points', 'Common Ore'] },
          { id: 'premium', name: 'Premium Chest', description: 'Rare rewards', cost: 2000, cooldown: 7200000, rewards: ['Points', 'Rare Crystal', 'Ancient Shard'] },
        ];
        components = buildChestPanel(chests, {});
        break;
      }
      case 'forge': {
        const recipes = [
          { id: 'steel_ingot', name: 'Forged Steel Ingot', description: 'Combine ores into steel', success_rate: 0.8, materials: [{ item_id: 'common_ore', quantity: 5 }] },
          { id: 'enchanted_ingot', name: 'Enchanted Ingot', description: 'Rare crafting material', success_rate: 0.5, materials: [{ item_id: 'rare_crystal', quantity: 3 }, { item_id: 'forge_guard_pass', quantity: 1 }] },
        ];
        components = buildForgePanel(recipes, {});
        break;
      }
      case 'quests': {
        const quests = [
          { id: 'daily_chest', name: 'Chest Opener', description: 'Open 3 chests', target: 3, reward_points: 1000 },
          { id: 'daily_forge', name: 'Master Smith', description: 'Craft 5 items', target: 5, reward_points: 2000 },
        ];
        components = buildQuestsPanel(quests, []);
        break;
      }
      case 'giveaways': {
        components = buildGiveawayPanel([]);
        break;
      }
      case 'vault': {
        components = buildVaultPanel([]);
        break;
      }
      case 'activity': {
        components = buildActivityPanel([]);
        break;
      }
      case 'admin': {
        components = buildAdminPanel();
        break;
      }
      default:
        return null;
    }

    const message = await channel.send(components);
    await supabase.from('bot_panels').upsert({
      panel_key: panelKey,
      channel_id: channel.id,
      message_id: message.id,
    });
    return message;
  }

  async updatePanel(panelKey: string, components: any): Promise<void> {
    const { data: panel } = await supabase
      .from('bot_panels')
      .select('channel_id, message_id')
      .eq('panel_key', panelKey)
      .single();

    if (!panel) return;

    const channel = this.client.channels.cache.get(panel.channel_id) as TextChannel;
    if (!channel) return;

    try {
      const message = await channel.messages.fetch(panel.message_id);
      await message.edit(components);
    } catch (e) {
      console.error(`[Panels] Failed to update ${panelKey}:`, e);
    }
  }
}