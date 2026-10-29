import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
export const supabase = createClient(config.supabase.url || 'http://localhost', config.supabase.serviceRoleKey || config.supabase.anonKey || 'anon');