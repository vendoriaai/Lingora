/**
 * Supabase client — the ONLY backend client. Anon key + user JWT, RLS-scoped.
 * The service-role key never reaches the renderer (it lives in Edge Functions
 * and main process only — see docs/16-SECURITY.md).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!url || !anonKey) {
  // Dev stamp helps surface a missing .env early instead of opaque failures.
  // eslint-disable-next-line no-console
  console.warn(
    '[lingora] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — auth + DB calls will fail. Copy .env.example → .env.',
  );
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Redirect scheme handled by react-router AuthProvider.
      flowType: 'pkce',
    },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return _client;
}
