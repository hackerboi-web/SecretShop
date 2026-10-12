import { Events, Interaction, ButtonInteraction, StringSelectMenuInteraction, ChatInputCommandInteraction, User } from 'discord.js';
import { client, panelManager } from '../index.js';
import { config } from '../config.js';
import { supabase } from '../supabase.js';
import {
  getOrCreateUser,
  getUserBalance,
  getInventory,
  getShopItems,
  purchaseItem,
  claimDaily,
  getTransactions,
  getLeaderboard,
  adjustBalance,
  addItemToInventory,
} from '../economy/index.js';
import {
  buildBankPanel,
  buildShopPanel,
  buildInventoryPanel,
  buildDailyPanel,
  buildChestPanel,
  buildForgePanel,
  buildQuestsPanel,
  buildGiveawayPanel,
  buildVaultPanel,
  buildActivityPanel,
  buildAdminPanel,
  buildErrorPanel,
  buildSuccessPanel,
} from '../components/panels.js';
import { loadItemsConfig } from '../config.js';

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
    }
  } catch (error) {
    console.error('[Interaction] Error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      await interaction.update(buildErrorPanel(message));
    } else if (interaction.isChatInputCommand()) {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
}

async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  const { commandName, user, guild } = interaction;

  // Get or create user
  const dbUser = await getOrCreateUser(user.id, user.username, user.avatar);

  switch (commandName) {
    case 'balance': {
      const target = interaction.options.getUser('user') || user;
      const targetUser = await getOrCreateUser(target.id, target.username, target.avatar);
      await interaction.reply({
        content: `**${target.username}** has **${targetUser.balance.toLocaleString()} pts**`,
        ephemeral: target.id !== user.id,
      });
      break;
    }

    case 'shop': {
      const items = await getShopItems();
      await interaction.reply(buildShopPanel(items));
      break;
    }

    case 'buy': {
      const itemId = interaction.options.getString('item', true);
      const quantity = interaction.options.getInteger('quantity') || 1;
      await interaction.deferReply({ ephemeral: true });
      try {
        const result = await purchaseItem(user.id, itemId, quantity);
        await interaction.editReply(buildSuccessPanel(`Purchased **${result.item.name}** ×${quantity} for ${(result.item.price * quantity).toLocaleString()} pts!`));
      } catch (e) {
        await interaction.editReply(buildErrorPanel(e instanceof Error ? e.message : 'Purchase failed'));
      }
      break;
    }

    case 'inventory': {
      const inv = await getInventory(user.id);
      await interaction.reply(buildInventoryPanel(inv, dbUser.balance));
      break;
    }

    case 'daily': {
      await interaction.deferReply({ ephemeral: true });
      try {
        const result = await claimDaily(user.id);
        await interaction.editReply(buildSuccessPanel(`Claimed **${result.reward.toLocaleString()} pts**! Streak: ${result.streak} days`));
      } catch (e) {
        await interaction.editReply(buildErrorPanel(e instanceof Error ? e.message : 'Failed to claim daily'));
      }
      break;
    }

    case 'chest': {
      const chests = [
        { id: 'basic', name: 'Basic Chest', description: 'Common rewards', cost: 500, cooldown: 3600000, rewards: ['Points', 'Common Ore'] },
        { id: 'premium', name: 'Premium Chest', description: 'Rare rewards', cost: 2000, cooldown: 7200000, rewards: ['Points', 'Rare Crystal', 'Ancient Shard'] },
      ];
      await interaction.reply(buildChestPanel(chests, {}));
      break;
    }

    case 'forge': {
      const recipes = [
        { id: 'steel_ingot', name: 'Forged Steel Ingot', description: 'Combine ores into steel', success_rate: 0.8, materials: [{ item_id: 'common_ore', quantity: 5 }] },
        { id: 'enchanted_ingot', name: 'Enchanted Ingot', description: 'Rare crafting material', success_rate: 0.5, materials: [{ item_id: 'rare_crystal', quantity: 3 }, { item_id: 'forge_guard_pass', quantity: 1 }] },
      ];
      await interaction.reply(buildForgePanel(recipes, {}));
      break;
    }

    case 'quests': {
      const quests = [
        { id: 'daily_chest', name: 'Chest Opener', description: 'Open 3 chests', target: 3, reward_points: 1000 },
        { id: 'daily_forge', name: 'Master Smith', description: 'Craft 5 items', target: 5, reward_points: 2000 },
      ];
      await interaction.reply(buildQuestsPanel(quests, []));
      break;
    }

    case 'giveaway': {
      await interaction.reply(buildGiveawayPanel([]));
      break;
    }

    case 'vault': {
      await interaction.reply(buildVaultPanel([]));
      break;
    }

    case 'activity': {
      const txs = await getTransactions(user.id, 10);
      await interaction.reply(buildActivityPanel(txs));
      break;
    }

    case 'leaderboard': {
      const lb = await getLeaderboard(10);
      const lines = lb.map((u, i) => `${i + 1}. **${u.username}** — ${u.balance.toLocaleString()} pts`);
      await interaction.reply({ content: `## 🏆 Leaderboard\n${lines.join('\n')}`, ephemeral: true });
      break;
    }

    // Admin commands
    case 'give': {
      if (!isAdmin(interaction.member)) return interaction.reply({ content: 'No permission', ephemeral: true });
      const target = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      await adjustBalance(target.id, amount, 'admin_give', null, 1, null, { admin: user.id });
      await interaction.reply({ content: `Gave ${amount} pts to ${target.username}`, ephemeral: true });
      break;
    }

    case 'take': {
      if (!isAdmin(interaction.member)) return interaction.reply({ content: 'No permission', ephemeral: true });
      const target = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      await adjustBalance(target.id, -amount, 'admin_take', null, 1, null, { admin: user.id });
      await interaction.reply({ content: `Took ${amount} pts from ${target.username}`, ephemeral: true });
      break;
    }

    case 'setshop': {
      if (!isAdmin(interaction.member)) return interaction.reply({ content: 'No permission', ephemeral: true });
      const itemId = interaction.options.getString('item', true);
      const price = interaction.options.getInteger('price', true);
      const itemsConfig = await loadItemsConfig();
      if (!itemsConfig.items[itemId]) return interaction.reply({ content: 'Item not found', ephemeral: true });
      itemsConfig.items[itemId].price = price;
      // Save to file (simplified - in production use proper file writing)
      await supabase.from('shop_items').update({ price }).eq('item_id', itemId);
      await interaction.reply({ content: `Set ${itemId} price to ${price}`, ephemeral: true });
      break;
    }

    case 'panel': {
      if (!isAdmin(interaction.member)) return interaction.reply({ content: 'No permission', ephemeral: true });
      const panelName = interaction.options.getString('name', true);
      const channel = interaction.channel;
      if (channel?.isTextBased()) {
        await panelManager.postPanel(channel as any, panelName);
        await interaction.reply({ content: `Posted ${panelName} panel`, ephemeral: true });
      }
      break;
    }

    case 'repost': {
      if (!isAdmin(interaction.member)) return interaction.reply({ content: 'No permission', ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      await panelManager.repostAllPanels();
      await interaction.editReply({ content: 'All panels reposted' });
      break;
    }

    default:
      await interaction.reply({ content: 'Unknown command', ephemeral: true });
  }
}

async function handleButton(interaction: ButtonInteraction) {
  const [category, action, ...params] = interaction.customId.split(':');
  const user = interaction.user;

  const dbUser = await getOrCreateUser(user.id, user.username, user.avatar);

  switch (category) {
    case 'bank': {
      switch (action) {
        case 'panel':
          await interaction.update(buildBankPanel(dbUser));
          break;
        case 'activity':
          const txs = await getTransactions(user.id, 10);
          await interaction.update(buildActivityPanel(txs));
          break;
        case 'vault':
          await interaction.update(buildVaultPanel([]));
          break;
        case 'transfer':
          await interaction.update(buildErrorPanel('Transfer feature coming soon'));
          break;
      }
      break;
    }

    case 'shop': {
      switch (action) {
        case 'open':
          const items = await getShopItems();
          await interaction.update(buildShopPanel(items));
          break;
        case 'page':
          const page = parseInt(params[0]) || 0;
          const allItems = await getShopItems();
          await interaction.update(buildShopPanel(allItems, page));
          break;
        case 'buy': {
          const itemId = params[0];
          const quantity = parseInt(params[1]) || 1;
          await interaction.deferUpdate();
          try {
            const result = await purchaseItem(user.id, itemId, quantity);
            await interaction.editReply(buildSuccessPanel(`Purchased **${result.item.name}** ×${quantity}!`));
          } catch (e) {
            await interaction.editReply(buildErrorPanel(e instanceof Error ? e.message : 'Purchase failed'));
          }
          break;
        }
        case 'categories':
          await interaction.update(buildErrorPanel('Categories view coming soon'));
          break;
      }
      break;
    }

    case 'inventory': {
      switch (action) {
        case 'open':
          const inv = await getInventory(user.id);
          await interaction.update(buildInventoryPanel(inv, dbUser.balance));
          break;
        case 'use':
          await interaction.update(buildErrorPanel('Item use coming soon'));
          break;
        case 'sell':
          await interaction.update(buildErrorPanel('Item selling coming soon'));
          break;
      }
      break;
    }

    case 'daily': {
      if (action === 'claim') {
        await interaction.deferUpdate();
        try {
          const result = await claimDaily(user.id);
          await interaction.editReply(buildSuccessPanel(`Claimed **${result.reward.toLocaleString()} pts**! Streak: ${result.streak} days`));
        } catch (e) {
          await interaction.editReply(buildErrorPanel(e instanceof Error ? e.message : 'Failed to claim'));
        }
      }
      break;
    }

    case 'chest': {
      if (action === 'open') {
        await interaction.update(buildErrorPanel('Chest opening coming soon'));
      }
      break;
    }

    case 'admin': {
      if (!isAdmin(interaction.member)) {
        await interaction.update(buildErrorPanel('No permission'));
        return;
      }
      switch (action) {
        case 'config':
          await interaction.update(buildErrorPanel('Config panel coming soon'));
          break;
        case 'users':
          await interaction.update(buildErrorPanel('User management coming soon'));
          break;
        case 'shop':
          await interaction.update(buildErrorPanel('Shop management coming soon'));
          break;
        case 'analytics':
          await interaction.update(buildErrorPanel('Analytics coming soon'));
          break;
        case 'panels':
          await interaction.deferUpdate();
          await panelManager.repostAllPanels();
          await interaction.editReply(buildSuccessPanel('All panels reposted'));
          break;
      }
      break;
    }
  }
}

async function handleSelectMenu(interaction: StringSelectMenuInteraction) {
  await interaction.reply({ content: 'Select menus not yet implemented', ephemeral: true });
}

function isAdmin(member: any): boolean {
  if (!member?.roles) return false;
  return config.adminRoleIds.some(id => member.roles.cache.has(id));
}