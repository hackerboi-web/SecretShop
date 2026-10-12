import { Events } from 'discord.js';
import { client, panelManager } from '../index.js';
import { config } from '../config.js';
import { supabase } from '../supabase.js';

export async function handleReady() {
  console.log(`[Bot] Ready! Logged in as ${client.user?.tag}`);

  // Set activity
  client.user?.setActivity('Secret Shop Economy', { type: 3 });

  // Post/repost panels
  console.log('[Bot] Posting panels...');
  await panelManager.repostAllPanels();
  console.log('[Bot] Panels posted');

  // Start periodic panel refresh (every 30 min)
  setInterval(async () => {
    try {
      await panelManager.repostAllPanels();
    } catch (e) {
      console.error('[Bot] Panel refresh failed:', e);
    }
  }, 30 * 60 * 1000);
}