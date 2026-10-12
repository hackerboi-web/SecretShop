import {
  createContainer,
  createSection,
  createTextDisplay,
  createButton,
  createActionRow,
  createSeparator,
  createThumbnail,
  componentsV2Payload,
  componentsV2Update,
  MessageFlags,
} from './v2.js';

export function buildBankPanel(user: { balance: number; username: string; avatarHash: string | null }) {
  const components = [
    createSection([
      createTextDisplay(`## 🏦 Bank Panel\nWelcome back, **${user.username}**!`),
      createTextDisplay(`**Balance:** ${user.balance.toLocaleString()} pts\n**Lifetime Earned:** ${user.balance.toLocaleString()} pts`),
    ], user.avatarHash ? createThumbnail({ url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatarHash}.png`, description: user.username }) : undefined),
    createSeparator(),
    createActionRow(
      createButton('bank:activity', '📜 Activity Log', 2),
      createButton('bank:vault', '🏪 Vault', 2),
      createButton('bank:transfer', '💸 Transfer', 1)
    ),
    createSeparator(),
    createActionRow(
      createButton('shop:open', '🛒 Shop', 3),
      createButton('daily:claim', '🎁 Daily', 3),
      createButton('chest:open', '📦 Chest', 1)
    ),
  ];
  return componentsV2Payload(null, components);
}

export function buildShopPanel(items: any[], page = 0, pageSize = 5) {
  const start = page * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  const totalPages = Math.ceil(items.length / pageSize);

  const components = [
    createSection([
      createTextDisplay(`## 🛒 Secret Shop\nBrowse and purchase items with your loyalty points.`),
      createTextDisplay(`Page ${page + 1}/${totalPages} • ${items.length} items available`),
    ]),
    createSeparator(),
  ];

  for (const item of pageItems) {
    const metadata = item.metadata || {};
    const rarityColors: Record<string, number> = {
      common: 0x9CA3AF,
      uncommon: 0x22C55E,
      rare: 0x3B82F6,
      epic: 0xA855F7,
      legendary: 0xF59E0B,
    };
    const color = rarityColors[metadata.rarity] || 0x5865F2;

    components.push(
      createSection([
        createTextDisplay(`### ${item.name}\n${item.description}\n**Price:** ${item.price.toLocaleString()} pts | **Category:** ${item.category}`),
        createTextDisplay(item.consumable ? '🔄 **Consumable**' : '♾️ **Permanent**' + (item.max_per_user ? ` • Max: ${item.max_per_user}` : '')),
      ]),
      createActionRow(
        createButton(`shop:buy:${item.item_id}:1`, 'Buy 1', 3, false),
        createButton(`shop:buy:${item.item_id}:5`, 'Buy 5', 2, false),
        createButton(`shop:buy:${item.item_id}:10`, 'Buy 10', 2, false)
      ),
      createSeparator()
    );
  }

  // Pagination
  if (totalPages > 1) {
    const paginationButtons = [];
    if (page > 0) paginationButtons.push(createButton(`shop:page:${page - 1}`, '◀ Previous', 2));
    if (page < totalPages - 1) paginationButtons.push(createButton(`shop:page:${page + 1}`, 'Next ▶', 2));
    if (paginationButtons.length > 0) {
      components.push(createActionRow(...paginationButtons));
    }
  }

  components.push(
    createActionRow(
      createButton('shop:categories', '📂 Categories', 2),
      createButton('inventory:open', '🎒 Inventory', 2)
    )
  );

  return componentsV2Payload(null, components);
}

export function buildInventoryPanel(inventory: any[], userBalance: number) {
  if (inventory.length === 0) {
    return componentsV2Payload(null, [
      createSection([
        createTextDisplay(`## 🎒 Inventory\nYour inventory is empty.`),
        createTextDisplay(`**Balance:** ${userBalance.toLocaleString()} pts`),
      ]),
      createSeparator(),
      createActionRow(createButton('shop:open', '🛒 Go to Shop', 3))
    ]);
  }

  const components = [
    createSection([
      createTextDisplay(`## 🎒 Inventory\n**Balance:** ${userBalance.toLocaleString()} pts`),
      createTextDisplay(`${inventory.length} unique items`),
    ]),
    createSeparator(),
  ];

  for (const invItem of inventory.slice(0, 10)) {
    const item = invItem.item_data;
    if (!item) continue;
    components.push(
      createSection([
        createTextDisplay(`**${item.name}** ×${invItem.quantity}\n${item.description}`),
      ]),
      createActionRow(
        item.consumable ? createButton(`inventory:use:${invItem.item_id}`, 'Use', 3) : createButton(`inventory:info:${invItem.item_id}`, 'Info', 2),
        createButton(`inventory:sell:${invItem.item_id}`, 'Sell', 4)
      ),
      createSeparator()
    );
  }

  if (inventory.length > 10) {
    components.push(createTextDisplay(`... and ${inventory.length - 10} more items`));
  }

  components.push(createActionRow(createButton('shop:open', '🛒 Shop', 3)));

  return componentsV2Payload(null, components);
}

export function buildDailyPanel(user: { daily_streak: number; last_daily: string | null; canClaim: boolean }) {
  const streak = user.daily_streak;
  const baseReward = 500;
  const streakBonus = Math.min(streak * 50, 2500);
  const totalReward = baseReward + streakBonus;

  const components = [
    createSection([
      createTextDisplay(`## 🎁 Daily Reward\n**Current Streak:** ${streak} days 🔥`),
      createTextDisplay(`**Base Reward:** ${baseReward} pts\n**Streak Bonus:** +${streakBonus} pts\n**Total:** **${totalReward} pts**`),
    ]),
    createSeparator(),
  ];

  if (user.canClaim) {
    components.push(
      createActionRow(createButton('daily:claim', `Claim ${totalReward} pts`, 3, false, { name: '🎁' }))
    );
  } else {
    const nextClaim = user.last_daily ? new Date(new Date(user.last_daily).getTime() + 24 * 60 * 60 * 1000) : new Date();
    components.push(
      createTextDisplay(`⏰ Next claim available: <t:${Math.floor(nextClaim.getTime() / 1000)}:R>`),
      createActionRow(createButton('daily:claim', 'Claim', 2, true, { name: '🎁' }))
    );
  }

  components.push(
    createSeparator(),
    createActionRow(
      createButton('shop:open', '🛒 Shop', 2),
      createButton('chest:open', '📦 Chest', 2)
    )
  );

  return componentsV2Payload(null, components);
}

export function buildChestPanel(chests: any[], cooldowns: Record<string, number>) {
  const components = [
    createSection([
      createTextDisplay(`## 📦 Chest Opening\nChoose a chest to open for random rewards!`),
    ]),
    createSeparator(),
  ];

  for (const chest of chests) {
    const onCooldown = cooldowns[chest.id] && cooldowns[chest.id] > Date.now();
    const remaining = onCooldown ? Math.ceil((cooldowns[chest.id] - Date.now()) / 1000) : 0;

    components.push(
      createSection([
        createTextDisplay(`### ${chest.name}\n${chest.description}\n**Cost:** ${chest.cost} pts | **Cooldown:** ${chest.cooldown / 1000}s`),
        createTextDisplay(onCooldown ? `⏳ Cooldown: ${remaining}s` : `🎯 Rewards: ${chest.rewards.join(', ')}`),
      ]),
      createActionRow(
        createButton(`chest:open:${chest.id}`, onCooldown ? 'On Cooldown' : 'Open', onCooldown ? 2 : 3, onCooldown)
      ),
      createSeparator()
    );
  }

  components.push(createActionRow(createButton('bank:panel', '🏦 Bank', 2)));

  return componentsV2Payload(null, components);
}

export function buildForgePanel(recipes: any[], userMaterials: Record<string, number>) {
  const components = [
    createSection([
      createTextDisplay(`## ⚒️ Forge\nCraft powerful items from materials.`),
    ]),
    createSeparator(),
  ];

  for (const recipe of recipes) {
    const canCraft = recipe.materials.every((m: any) => (userMaterials[m.item_id] || 0) >= m.quantity);
    const missing = recipe.materials.filter((m: any) => (userMaterials[m.item_id] || 0) < m.quantity);

    components.push(
      createSection([
        createTextDisplay(`### ${recipe.name}\n${recipe.description}\n**Success Rate:** ${recipe.success_rate * 100}%`),
        createTextDisplay(canCraft ? '✅ **Ready to craft!**' : `❌ Missing: ${missing.map(m => `${m.item_id} (${m.quantity - (userMaterials[m.item_id] || 0)})`).join(', ')}`),
      ]),
      createActionRow(
        createButton(`forge:craft:${recipe.id}`, 'Craft', canCraft ? 3 : 2, !canCraft)
      ),
      createSeparator()
    );
  }

  components.push(createActionRow(createButton('bank:panel', '🏦 Bank', 2)));

  return componentsV2Payload(null, components);
}

export function buildQuestsPanel(quests: any[], userQuests: any[]) {
  const components = [
    createSection([
      createTextDisplay(`## 📋 Quests\nComplete objectives for rewards!`),
    ]),
    createSeparator(),
  ];

  for (const quest of quests) {
    const userQuest = userQuests.find(uq => uq.quest_id === quest.id);
    const progress = userQuest?.progress || 0;
    const completed = userQuest?.completed || false;
    const claimed = userQuest?.claimed || false;
    const percent = Math.min(100, Math.round((progress / quest.target) * 100));

    const bar = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));

    components.push(
      createSection([
        createTextDisplay(`### ${quest.name}\n${quest.description}\n**Progress:** ${bar} ${percent}% (${progress}/${quest.target})`),
        createTextDisplay(`**Reward:** ${quest.reward_points} pts ${quest.reward_items?.map((i: any) => `${i.item_id}×${i.qty}`).join(', ') || ''}`),
      ]),
      createActionRow(
        completed && !claimed
          ? createButton(`quest:claim:${quest.id}`, 'Claim Reward', 3)
          : claimed
            ? createButton(`quest:claim:${quest.id}`, 'Claimed', 2, true)
            : createButton(`quest:claim:${quest.id}`, 'In Progress', 2, true)
      ),
      createSeparator()
    );
  }

  components.push(createActionRow(createButton('bank:panel', '🏦 Bank', 2)));

  return componentsV2Payload(null, components);
}

export function buildGiveawayPanel(giveaways: any[]) {
  const components = [
    createSection([
      createTextDisplay(`## 🎉 Giveaways\nJoin active giveaways for a chance to win!`),
    ]),
    createSeparator(),
  ];

  if (giveaways.length === 0) {
    components.push(createTextDisplay('No active giveaways at the moment.'));
  } else {
    for (const g of giveaways) {
      const endsAt = new Date(g.ends_at).getTime();
      const now = Date.now();
      const timeLeft = endsAt - now;

      components.push(
        createSection([
          createTextDisplay(`### ${g.prize_points > 0 ? `${g.prize_points} pts` : 'Item Prize'}\n**Entries:** ${g.entries || 0}/${g.max_entries || '∞'} | **Winners:** ${g.winners_count}`),
          createTextDisplay(`⏰ Ends: <t:${Math.floor(endsAt / 1000)}:R>`),
        ]),
        createActionRow(
          createButton(`giveaway:join:${g.id}`, g.entry_cost > 0 ? `Join (${g.entry_cost} pts)` : 'Join Free', 3)
        ),
        createSeparator()
      );
    }
  }

  components.push(createActionRow(createButton('bank:panel', '🏦 Bank', 2)));

  return componentsV2Payload(null, components);
}

export function buildVaultPanel(vaults: any[]) {
  const components = [
    createSection([
      createTextDisplay(`## 🏪 Vault Management\nStore and organize your items and points.`),
    ]),
    createSeparator(),
  ];

  for (const vault of vaults) {
    const itemCount = Object.values(vault.items).reduce((a: number, b: number) => a + b, 0);
    const itemPercent = Math.round((itemCount / vault.capacity_items) * 100);
    const pointPercent = Math.round((vault.points / vault.capacity_points) * 100);

    components.push(
      createSection([
        createTextDisplay(`### ${vault.vault_tier.charAt(0).toUpperCase() + vault.vault_tier.slice(1)} Vault\n**Items:** ${itemCount}/${vault.capacity_items} (${itemPercent}%)\n**Points:** ${vault.points.toLocaleString()}/${vault.capacity_points.toLocaleString()} (${pointPercent}%)`),
      ]),
      createActionRow(
        createButton(`vault:deposit:${vault.vault_tier}`, '📥 Deposit', 3),
        createButton(`vault:withdraw:${vault.vault_tier}`, '📤 Withdraw', 2),
        createButton(`vault:view:${vault.vault_tier}`, '👁 View', 2)
      ),
      createSeparator()
    );
  }

  components.push(createActionRow(createButton('bank:panel', '🏦 Bank', 2)));

  return componentsV2Payload(null, components);
}

export function buildActivityPanel(activities: any[]) {
  const components = [
    createSection([
      createTextDisplay(`## 📜 Activity Log\nYour recent economy activity.`),
    ]),
    createSeparator(),
  ];

  if (activities.length === 0) {
    components.push(createTextDisplay('No recent activity.'));
  } else {
    for (const act of activities.slice(0, 10)) {
      const sign = act.amount > 0 ? '+' : '';
      const color = act.amount > 0 ? '🟢' : '🔴';
      components.push(
        createTextDisplay(`${color} **${act.type}** ${sign}${act.amount} pts • <t:${Math.floor(new Date(act.created_at).getTime() / 1000)}:R>`)
      );
    }
  }

  components.push(createSeparator());
  components.push(createActionRow(createButton('bank:panel', '🏦 Bank', 2)));

  return componentsV2Payload(null, components);
}

export function buildAdminPanel() {
  return componentsV2Payload(null, [
    createSection([createTextDisplay(`## ⚙️ Admin Panel\nBot management and configuration.`)],),
    createSeparator(),
    createActionRow(
      createButton('admin:config', '⚙️ Config', 2),
      createButton('admin:users', '👥 Users', 2),
      createButton('admin:shop', '🛒 Shop', 2)
    ),
    createActionRow(
      createButton('admin:analytics', '📊 Analytics', 2),
      createButton('admin:panels', '🔄 Repost Panels', 4)
    ),
    createSeparator(),
    createActionRow(createButton('bank:panel', '🏦 Bank', 2)),
  ]);
}

export function buildErrorPanel(message: string, backAction = 'bank:panel') {
  return componentsV2Payload(null, [
    createSection([createTextDisplay(`## ❌ Error\n${message}`)]),
    createSeparator(),
    createActionRow(createButton(backAction, '← Back', 2)),
  ]);
}

export function buildSuccessPanel(message: string, backAction = 'bank:panel') {
  return componentsV2Payload(null, [
    createSection([createTextDisplay(`## ✅ Success\n${message}`)]),
    createSeparator(),
    createActionRow(createButton(backAction, '← Back', 2)),
  ]);
}