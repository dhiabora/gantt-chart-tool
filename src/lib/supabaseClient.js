import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
const isValidSupabaseUrl = /^https?:\/\/.+/i.test(supabaseUrl);

export const isSupabaseEnabled = Boolean(isValidSupabaseUrl && supabaseAnonKey);
export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Supabase環境変数が未設定です。'
    : !isValidSupabaseUrl
      ? 'VITE_SUPABASE_URL が不正です。https:// から始まるURLを設定してください。'
      : '';

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

