-- Supabase Schema for Secret Shop Discord Bot
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users & Economy
CREATE TABLE IF NOT EXISTS users (
  discord_id BIGINT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_hash TEXT,
  balance BIGINT DEFAULT 0,
  total_earned BIGINT DEFAULT 0,
  total_spent BIGINT DEFAULT 0,
  daily_streak INT DEFAULT 0,
  last_daily TIMESTAMPTZ,
  last_chest TIMESTAMPTZ,
  last_digsite TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory (user items)
CREATE TABLE IF NOT EXISTS inventory (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(discord_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INT DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Shop Items (synced from items.json)
CREATE TABLE IF NOT EXISTS shop_items (
  item_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  currency_type TEXT DEFAULT 'points',
  category TEXT,
  role_id BIGINT,
  consumable BOOLEAN DEFAULT false,
  max_per_user INT,
  cooldown_seconds INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (audit log)
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(discord_id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  item_id TEXT,
  quantity INT DEFAULT 1,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Sessions (for dashboard)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(discord_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bot Panels (persistent message references)
CREATE TABLE IF NOT EXISTS bot_panels (
  panel_key TEXT PRIMARY KEY,
  channel_id BIGINT NOT NULL,
  message_id BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config (server-wide settings)
CREATE TABLE IF NOT EXISTS bot_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vaults (per user per tier)
CREATE TABLE IF NOT EXISTS vaults (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(discord_id) ON DELETE CASCADE,
  vault_tier TEXT NOT NULL,
  capacity_items INT NOT NULL,
  capacity_points BIGINT NOT NULL,
  items JSONB DEFAULT '{}',
  points BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vault_tier)
);

-- Quests progress
CREATE TABLE IF NOT EXISTS user_quests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(discord_id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  progress INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

-- Giveaways
CREATE TABLE IF NOT EXISTS giveaways (
  id BIGSERIAL PRIMARY KEY,
  host_id BIGINT REFERENCES users(discord_id) ON DELETE SET NULL,
  channel_id BIGINT NOT NULL,
  message_id BIGINT,
  prize_points BIGINT DEFAULT 0,
  prize_items JSONB DEFAULT '[]',
  entry_cost BIGINT DEFAULT 0,
  max_entries INT,
  winners_count INT DEFAULT 1,
  status TEXT DEFAULT 'active',
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Giveaway entries
CREATE TABLE IF NOT EXISTS giveaway_entries (
  id BIGSERIAL PRIMARY KEY,
  giveaway_id BIGINT REFERENCES giveaways(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(discord_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(giveaway_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_vaults_user ON vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_giveaways_status ON giveaways(status);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role bypasses all)
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = discord_id::text OR auth.role() = 'service_role');
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = discord_id::text OR auth.role() = 'service_role');

-- Inventory policies
CREATE POLICY "Users can read own inventory" ON inventory FOR SELECT USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');
CREATE POLICY "Service role manages inventory" ON inventory FOR ALL USING (auth.role() = 'service_role');

-- Shop items - public read, service role write
CREATE POLICY "Public read shop items" ON shop_items FOR SELECT USING (is_active = true);
CREATE POLICY "Service role manages shop" ON shop_items FOR ALL USING (auth.role() = 'service_role');

-- Transactions - users read own, service role all
CREATE POLICY "Users read own transactions" ON transactions FOR SELECT USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');
CREATE POLICY "Service role manages transactions" ON transactions FOR ALL USING (auth.role() = 'service_role');

-- Sessions - service role only
CREATE POLICY "Service role manages sessions" ON user_sessions FOR ALL USING (auth.role() = 'service_role');

-- Panels, config, vaults, quests, giveaways - service role only
CREATE POLICY "Service role manages panels" ON bot_panels FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages config" ON bot_config FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages vaults" ON vaults FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages quests" ON user_quests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages giveaways" ON giveaways FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages entries" ON giveaway_entries FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_items_updated_at BEFORE UPDATE ON shop_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bot_panels_updated_at BEFORE UPDATE ON bot_panels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bot_config_updated_at BEFORE UPDATE ON bot_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vaults_updated_at BEFORE UPDATE ON vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_quests_updated_at BEFORE UPDATE ON user_quests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();