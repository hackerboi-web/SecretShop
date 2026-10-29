import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  adminRoleIds: (process.env.ADMIN_ROLE_IDS || '').split(',').filter(Boolean),
  panelChannelId: process.env.PANEL_CHANNEL_ID || '',
};

export async function loadItemsConfig() {
  try { return JSON.parse(fs.readFileSync('items.json', 'utf8')); } catch { return { items: {} }; }
}
export async function validateItemsConfig(cfg) { return { valid: true, errors: [] }; }