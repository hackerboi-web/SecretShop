import { Client, GatewayIntentBits, Events, REST, Routes, Collection } from 'discord.js';
import { config } from './config.js';
import { startApiServer } from './rest/server.js';
import { loadItemsConfig, validateItemsConfig } from './config.js';
import { supabase } from './supabase.js';
import { loadKeys } from './rest/auth.js';
import { registerCommands } from './utils/registerCommands.js';
import { handleInteraction } from './events/interactionCreate.js';
import { handleReady } from './events/ready.js';
import { PanelManager } from './panels/panelManager.js';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

export const panelManager = new PanelManager(client);

client.commands = new Collection();

async function main() {
  console.log('[Bot] Starting Secret Shop bot...');

  // Load JWT keys
  await loadKeys();
  console.log('[Bot] JWT keys loaded');

  // Load and validate items config
  const itemsConfig = await loadItemsConfig();
  const validation = await validateItemsConfig(itemsConfig);
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
  const { error } = await supabase.from('shop_items').upsert(items, { onConflict: 'item_id' });
  if (error) {
    console.error('[Bot] Failed to sync items to Supabase:', error.message);
  } else {
    console.log('[Bot] Shop items synced to Supabase');
  }

  // Register slash commands
  await registerCommands(client);
  console.log('[Bot] Slash commands registered');

  // Start REST API server
  await startApiServer();

  // Event handlers
  client.once(Events.ClientReady, handleReady);
  client.on(Events.InteractionCreate, handleInteraction);

  // Error handling
  client.on(Events.Error, (error) => console.error('[Bot] Discord client error:', error));
  process.on('unhandledRejection', (reason) => console.error('[Bot] Unhandled rejection:', reason));

  // Login
  await client.login(config.discord.token);
  console.log('[Bot] Logged in successfully');
}

main().catch((err) => {
  console.error('[Bot] Fatal error:', err);
  process.exit(1);
});