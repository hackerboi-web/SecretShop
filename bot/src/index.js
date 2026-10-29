"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.panelManager = exports.client = void 0;
const discord_js_1 = require("discord.js");
const config_js_1 = require("./config.js");
const server_js_1 = require("./rest/server.js");
const config_js_2 = require("./config.js");
const supabase_js_1 = require("./supabase.js");
const auth_js_1 = require("./rest/auth.js");
const registerCommands_js_1 = require("./utils/registerCommands.js");
const interactionCreate_js_1 = require("./events/interactionCreate.js");
const ready_js_1 = require("./events/ready.js");
const panelManager_js_1 = require("./panels/panelManager.js");
exports.client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers,
    ],
});
exports.panelManager = new panelManager_js_1.PanelManager(exports.client);
exports.client.commands = new discord_js_1.Collection();
async function main() {
    console.log('[Bot] Starting Secret Shop bot...');
    // Load JWT keys
    await (0, auth_js_1.loadKeys)();
    console.log('[Bot] JWT keys loaded');
    // Load and validate items config
    const itemsConfig = await (0, config_js_2.loadItemsConfig)();
    const validation = await (0, config_js_2.validateItemsConfig)(itemsConfig);
    if (!validation.valid) {
        console.error('[Bot] Invalid items.json:', validation.errors);
        process.exit(1);
    }
    console.log(`[Bot] Loaded ${Object.keys(itemsConfig.items).length} shop items`);
    // Sync items to Supabase
    const items = Object.entries(itemsConfig.items).map(([item_id, item]) => ({
        item_id,
        ...item,
        role_id: item.role_id === '0' ? null : item.role_id,
    }));
    const { error } = await supabase_js_1.supabase.from('shop_items').upsert(items, { onConflict: 'item_id' });
    if (error) {
        console.error('[Bot] Failed to sync items to Supabase:', error.message);
    }
    else {
        console.log('[Bot] Shop items synced to Supabase');
    }
    // Register slash commands
    await (0, registerCommands_js_1.registerCommands)(exports.client);
    console.log('[Bot] Slash commands registered');
    // Start REST API server
    await (0, server_js_1.startApiServer)();
    // Event handlers
    exports.client.once(discord_js_1.Events.ClientReady, ready_js_1.handleReady);
    exports.client.on(discord_js_1.Events.InteractionCreate, interactionCreate_js_1.handleInteraction);
    // Error handling
    exports.client.on(discord_js_1.Events.Error, (error) => console.error('[Bot] Discord client error:', error));
    process.on('unhandledRejection', (reason) => console.error('[Bot] Unhandled rejection:', reason));
    // Login
    await exports.client.login(config_js_1.config.discord.token);
    console.log('[Bot] Logged in successfully');
}
main().catch((err) => {
    console.error('[Bot] Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map