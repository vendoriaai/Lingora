// Shared auth + CORS helpers — replicated per the deno-no-shared-lib convention
// documented in docs/08-SUPABASE-EDGE-FUNCTIONS.md. Each function imports this
// via a relative path; the import map in each deno.json resolves supabase-js.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
export const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
export const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** CORS preflight + response headers. `reflectOrigin` opts into Origin reflection. */
export function corsHeaders(req: Request, reflectOrigin = true): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allow = reflectOrigin ? (origin || '*') : '*';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Client-Info, apikey',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin, Access-Control-Request-Headers',
  };
}

export function preflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  return null;
}

/** Verify the Supabase JWT via the user's bearer; resolve user.id == auth.uid(). */
export async function getUser(req: Request): Promise<{ sb: SupabaseClient; user: { id: string } }> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'unauthorized: missing bearer');
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) throw new HttpError(401, 'unauthorized: invalid jwt');
  return { sb, user: { id: data.user.id } };
}

/** Service-role client (bypasses RLS). Use ONLY after getUser() resolved the
 *  real user id, and insert with that id — never a body-supplied user_id. */
export function serviceClient(): SupabaseClient {
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new HttpError(500, 'service role key not configured');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function jsonError(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders({} as Request, false) },
  });
}
