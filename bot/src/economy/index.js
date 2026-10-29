"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateUser = getOrCreateUser;
exports.getUserBalance = getUserBalance;
exports.adjustBalance = adjustBalance;
exports.addItemToInventory = addItemToInventory;
exports.removeItemFromInventory = removeItemFromInventory;
exports.getInventory = getInventory;
exports.getShopItems = getShopItems;
exports.purchaseItem = purchaseItem;
exports.claimDaily = claimDaily;
exports.getTransactions = getTransactions;
exports.getLeaderboard = getLeaderboard;
const supabase_js_1 = require("../supabase.js");
const config_js_1 = require("../config.js");
async function getOrCreateUser(discordId, username, avatarHash) {
    let { data: user, error } = await supabase_js_1.supabase
        .from('users')
        .select('*')
        .eq('discord_id', discordId)
        .single();
    if (error && error.code === 'PGRST116') {
        // User doesn't exist, create
        const { data: newUser, error: createError } = await supabase_js_1.supabase
            .from('users')
            .insert({
            discord_id: discordId,
            username,
            avatar_hash: avatarHash,
            balance: 1000, // Starting balance
            total_earned: 1000,
        })
            .select()
            .single();
        if (createError)
            throw createError;
        user = newUser;
        // Create Tiny Vault for new user
        await supabase_js_1.supabase.from('vaults').insert({
            user_id: discordId,
            vault_tier: 'tiny',
            capacity_items: 5,
            capacity_points: 10000,
            items: {},
            points: 0,
        });
    }
    else if (error) {
        throw error;
    }
    return user;
}
async function getUserBalance(discordId) {
    const { data, error } = await supabase_js_1.supabase
        .from('users')
        .select('balance')
        .eq('discord_id', discordId)
        .single();
    if (error)
        throw error;
    return data?.balance || 0;
}
async function adjustBalance(discordId, amount, type, itemId = null, quantity = 1, referenceId = null, metadata = {}) {
    const { data: user, error: userError } = await supabase_js_1.supabase
        .from('users')
        .select('balance, total_earned, total_spent')
        .eq('discord_id', discordId)
        .single();
    if (userError)
        throw userError;
    const newBalance = user.balance + amount;
    if (newBalance < 0)
        throw new Error('Insufficient balance');
    const newTotalEarned = amount > 0 ? user.total_earned + amount : user.total_earned;
    const newTotalSpent = amount < 0 ? user.total_spent + Math.abs(amount) : user.total_spent;
    const { error: updateError } = await supabase_js_1.supabase
        .from('users')
        .update({
        balance: newBalance,
        total_earned: newTotalEarned,
        total_spent: newTotalSpent,
    })
        .eq('discord_id', discordId);
    if (updateError)
        throw updateError;
    const { data: transaction, error: txError } = await supabase_js_1.supabase
        .from('transactions')
        .insert({
        user_id: discordId,
        type,
        amount,
        balance_after: newBalance,
        item_id: itemId,
        quantity,
        reference_id: referenceId,
        metadata,
    })
        .select('id')
        .single();
    if (txError)
        throw txError;
    return { newBalance, transactionId: transaction.id };
}
async function addItemToInventory(discordId, itemId, quantity = 1, metadata = {}) {
    const itemsConfig = await (0, config_js_1.loadItemsConfig)();
    const itemDef = itemsConfig.items[itemId];
    if (!itemDef)
        throw new Error(`Item ${itemId} not found`);
    if (itemDef.max_per_user) {
        const { data: existing } = await supabase_js_1.supabase
            .from('inventory')
            .select('quantity')
            .eq('user_id', discordId)
            .eq('item_id', itemId)
            .single();
        const currentQty = existing?.quantity || 0;
        if (currentQty + quantity > itemDef.max_per_user) {
            throw new Error(`Max per user limit reached (${itemDef.max_per_user})`);
        }
    }
    const { data, error } = await supabase_js_1.supabase
        .from('inventory')
        .upsert({
        user_id: discordId,
        item_id: itemId,
        quantity,
        metadata,
    }, { onConflict: 'user_id,item_id' })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function removeItemFromInventory(discordId, itemId, quantity = 1) {
    const { data: existing, error: fetchError } = await supabase_js_1.supabase
        .from('inventory')
        .select('quantity')
        .eq('user_id', discordId)
        .eq('item_id', itemId)
        .single();
    if (fetchError || !existing)
        return false;
    const newQty = existing.quantity - quantity;
    if (newQty <= 0) {
        const { error } = await supabase_js_1.supabase
            .from('inventory')
            .delete()
            .eq('user_id', discordId)
            .eq('item_id', itemId);
        return !error;
    }
    else {
        const { error } = await supabase_js_1.supabase
            .from('inventory')
            .update({ quantity: newQty })
            .eq('user_id', discordId)
            .eq('item_id', itemId);
        return !error;
    }
}
async function getInventory(discordId) {
    const { data, error } = await supabase_js_1.supabase
        .from('inventory')
        .select('*')
        .eq('user_id', discordId);
    if (error)
        throw error;
    // Enrich with item definitions
    const itemsConfig = await (0, config_js_1.loadItemsConfig)();
    return (data || []).map(item => ({
        ...item,
        item_data: itemsConfig.items[item.item_id],
    }));
}
async function getShopItems() {
    const { data, error } = await supabase_js_1.supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
    if (error)
        throw error;
    return data || [];
}
async function purchaseItem(discordId, itemId, quantity = 1) {
    const itemsConfig = await (0, config_js_1.loadItemsConfig)();
    const itemDef = itemsConfig.items[itemId];
    if (!itemDef)
        throw new Error('Item not found');
    if (!itemDef.is_active)
        throw new Error('Item not available');
    const totalPrice = itemDef.price * quantity;
    const user = await getOrCreateUser(discordId, '', null);
    if (user.balance < totalPrice) {
        throw new Error('Insufficient balance');
    }
    if (itemDef.max_per_user) {
        const { data: existing } = await supabase_js_1.supabase
            .from('inventory')
            .select('quantity')
            .eq('user_id', discordId)
            .eq('item_id', itemId)
            .single();
        const currentQty = existing?.quantity || 0;
        if (currentQty + quantity > itemDef.max_per_user) {
            throw new Error(`Max per user limit reached (${itemDef.max_per_user})`);
        }
    }
    // Deduct balance
    await adjustBalance(discordId, -totalPrice, 'purchase', itemId, quantity, null, {
        item_name: itemDef.name,
        unit_price: itemDef.price,
    });
    // Add to inventory
    await addItemToInventory(discordId, itemId, quantity);
    // Handle role grant
    if (itemDef.role_id && itemDef.category === 'roles') {
        // Role granting handled by bot via Discord API
    }
    const newBalance = user.balance - totalPrice;
    return { success: true, newBalance, item: itemDef };
}
async function claimDaily(discordId) {
    const { data: user, error } = await supabase_js_1.supabase
        .from('users')
        .select('daily_streak, last_daily, balance')
        .eq('discord_id', discordId)
        .single();
    if (error)
        throw error;
    const now = new Date();
    const lastDaily = user.last_daily ? new Date(user.last_daily) : null;
    let streak = user.daily_streak || 0;
    if (lastDaily) {
        const diffHours = (now.getTime() - lastDaily.getTime()) / (1000 * 60 * 60);
        if (diffHours < 24) {
            throw new Error('Daily already claimed');
        }
        else if (diffHours > 48) {
            streak = 0; // Streak broken
        }
        else {
            streak += 1;
        }
    }
    else {
        streak = 1;
    }
    const baseReward = 500;
    const streakBonus = Math.min(streak * 50, 2500);
    const reward = baseReward + streakBonus;
    await adjustBalance(discordId, reward, 'daily', null, 1, null, {
        base_reward: baseReward,
        streak_bonus: streakBonus,
        streak,
    });
    await supabase_js_1.supabase
        .from('users')
        .update({ daily_streak: streak, last_daily: now.toISOString() })
        .eq('discord_id', discordId);
    return { reward, streak, multiplier: 1 };
}
async function getTransactions(discordId, limit = 50, offset = 0) {
    const { data, error } = await supabase_js_1.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', discordId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error)
        throw error;
    return data || [];
}
async function getLeaderboard(limit = 10) {
    const { data, error } = await supabase_js_1.supabase
        .from('users')
        .select('discord_id, username, balance, avatar_hash')
        .order('balance', { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    return data || [];
}
//# sourceMappingURL=index.js.map