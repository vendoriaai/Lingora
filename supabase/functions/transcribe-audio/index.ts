// transcribe-audio — speech-to-text (Edge Function, Deno).
// Source: docs/08-SUPABASE-EDGE-FUNCTIONS.md §3. Pluggable provider:
// STT_PROVIDER ∈ google | deepgram | assemblyai | browser. When `browser`
// (the desktop default), the renderer uses the Web Speech API and never
// calls this function. Cloud providers land in Phase 5; this stub ships the
// correct HTTP shape + JWT verify + 501-not-implemented contract now.
import {
  corsHeaders, getUser, HttpError, jsonError, preflight,
} from '../_shared/auth.ts';

const STT_PROVIDER = (Deno.env.get('STT_PROVIDER') ?? 'browser').toLowerCase();
const STT_API_KEY = Deno.env.get('STT_API_KEY') ?? '';

Deno.serve(async (req: Request) => {
  // 08 §3: Allow-Origin * for audio uploads; OPTION -> "ok".
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Access-Control-Request-Headers',
      },
    });
  }
  if (req.method !== 'POST') return jsonError(405, { error: 'method_not_allowed' });

  // Verify JWT (anonymous ok if user allowed). 08 §3 step 2.
  try { await getUser(req); }
  catch (e) { return jsonError((e as HttpError).status ?? 401, { error: 'unauthorized' }); }

  // Multipart form: audio + language (+ optional provider override).
  const form = await req.formData();
  const audio = form.get('audio');
  const language = (form.get('language') as string | null) ?? 'en-US';
  const providerOverride = (form.get('provider') as string | null)?.toLowerCase();
  const provider = providerOverride || STT_PROVIDER;

  if (!audio || !(audio instanceof File)) {
    return jsonError(400, { error: 'missing_audio' });
  }

  // Dispatch by provider. Cloud providers return 501 until wired in Phase 5;
  // browser/unset/unknown return 501 with the documented info payload.
  switch (provider) {
    case 'browser':
    case '':
      return notImplemented(provider, language, audio);
    case 'google':
    case 'deepgram':
    case 'assemblyai':
      // TODO Phase 5: real provider calls. Enumerate now so config is explicit.
      if (!STT_API_KEY) return jsonError(500, { error: 'stt_unconfigured', provider });
      return notImplemented(provider, language, audio);
    default:
      return notImplemented(provider, language, audio);
  }
});

function notImplemented(provider: string, language: string, audio: File): Response {
  return new Response(
    JSON.stringify({
      text: '',
      message: 'Transcription not implemented for this provider.',
      info: { provider: provider || 'browser', language, size: audio.size, type: audio.type },
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json', ...corsHeaders({} as Request, false) },
    },
  );
}
