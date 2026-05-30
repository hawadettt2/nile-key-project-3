import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createUnavailableClient(): SupabaseClient {
  const error = new Error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Supabase.'
  );

  return new Proxy({} as SupabaseClient, {
    get() {
      throw error;
    },
  });
}

export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : createUnavailableClient();
