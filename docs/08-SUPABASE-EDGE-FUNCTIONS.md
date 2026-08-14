# 08 — Supabase Edge Functions

Three Deno Edge Functions. All: HTTPS; CORS-aware (reflect Origin, allow `POST,OPTIONS`, request headers); **verify the Supabase JWT** (the baseline did not); use the **service role key** only server-side and only after resolving `user_id` from the verified JWT. See `16-SECURITY.md`.

Common auth helper (replicate per function — Deno has no shared lib):
```ts
async function getUser(req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const jwt = token || Deno.env.get('SUPABASE_ANON_KEY')!;
  // Create a supabase client WITH the user's bearer; getUser() validates the JWT against the JWKS.
  const sb = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) throw new HttpError(401, 'unauthorized');
  return { sb, user: data.user };   // user.id == auth.uid(); use this for RLS-scoped inserts
}
```
Send service-role-persisting writes through a second client built with the service role key.

---

## 1. `process-gemini-chat` — streaming AI tutor (text)

**Route:** `POST /functions/v1/process-gemini-chat`
**Purpose:** level-adaptive text chat with Gemini; streaming SSE; persists turns to `conversation_history`.

**CORS:** `OPTIONS→204` reflecting Origin; `Access-Control-Allow-Methods: POST,OPTIONS`; headers: `Content-Type, Authorization, Accept, X-Client-Info`. `Vary: Origin, Access-Control-Request-Headers`.

**Env:** `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Request body:**
```json
{ "message": "string",
  "session_id": "uuid?",            // optional, created if absent
  "user_level": "string?",          // beginner..advanced | A1..C2
  "focus_area": "string?",          // conversation|grammar|vocabulary|writing|testing|default
  "history": "Array<{role, content}>?" } // optional last-N context
```

**Model:** `gemini-2.5-flash` (`generativelanguage` REST `/v1beta/models/{model}:streamGenerateContent`), `generationConfig` `temperature 0.6, topP 0.7, topK 20, maxOutputTokens 200`.

**Flow:**
1. `OPTIONS→204`.
2. Parse body; `400` if `!message`.
3. Verify JWT → resolve `user_id`.
4. Build system prompt: focus-area variant + level matrix from `09-AI-INTEGRATION.md`; inject user's CEFR.
5. Stream from Gemini; forward each text delta as SSE `data: { content, fullResponse, done:false }\n\n`.
6. Final SSE `data: { fullResponse, done:true, session_id }\n\n`.
7. On stream complete, persist (service-role client): insert `user` turn then `assistant` turn into `conversation_history` with `session_id` (mapping to a `learning_sessions` row if absent). **Stop silently failing** — verify table existence and surface a server log on insert error.
8. On prohibited/blocked content (finishReason `SAFETY`/`PROHIBITED_CONTENT`): emit a canned neutral assistant turn; do not leak the raw block message.

**Error envelope (JSON):** `400` missing message; `401` unauthorized; `500` `{ ok:false, error:'internal', details, apiKeyConfigured:false }`.

**Response types:**
- `text/event-stream` for streaming.
- `application/json` `{ response, session_id, success:true, provider:'gemini-edge' }` if the client asked `stream=false` (non-streaming path).

---

## 2. `process-live-conversation` — live voice, SSE (relay mode)

**Route:** `POST /functions/v1/process-live-conversation`
**Purpose:** when the direct Gemini Live WebSocket can't be opened (desktop firewall / no browser-safe key), the renderer falls back here. Streams text + pushes a single TTS audio clip.

**CORS:** as above, additionally `Cache-Control, Connection`; base headers `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`.

**Env:** `GEMINI_API_KEY`, `SUPABASE_URL`, key set.

**Request body:**
```json
{ "message": "string", "session_id": "string",
  "user_id": "uuid?", "user_level": "string?", "focus_area": "string?",
  "language": "string?", "streaming": "bool?" }                  // default true
```
Note: `user_id` from the verified JWT overrides the body field. Verify JWT; ignore client-provided `user_id` for security.

**Models:**
- Chat: `gemini-2.5-flash` via `@google/generative-ai` esm.sh. `temperature 0.7, topK 40, topP 0.95, maxOutputTokens 256`.
- TTS: `gemini-2.5-flash-preview-tts` REST; `responseModalities: ['AUDIO']`; `prebuiltVoiceConfig.voiceName` default `'Kore'` (selectable by the client's `voice` field — map to Gemini voices: Kore, Puck, Charon, Fenrir, Aoede, Leda, Orus, Zephyr).

**Flow (streaming):**
1. `OPTIONS→204`. Verify JWT.
2. System prompt: "VERY SHORT (15–30 words, 1–2 sentences). Use the singular 'you.' Gently correct one thing. End with a follow-up."
3. Open a TransformStream SSE writer. `model.generateContentStream` with `[systemPrompt(user), 'Understood.', userMessage]`.
4. Forward each chunk as `data: { content, fullResponse, done:false, session_id }`.
5. After stream completes, if `fullResponse` is non-empty: in parallel fire the TTS REST call; when it resolves, emit one SSE `data: { content:'', audioData:{ data:base64, mimeType }, done:false, session_id }`.
6. Final `data: { fullResponse, done:true, session_id }`. Close.
7. On error: `data: { error, done:true }` then close (then HTTP 200 stream end; do NOT 500 mid-stream).
8. Persist turn pair to `conversation_history` (service role). Optionally upsert `live_conversation_sessions` row if `session_id` absent.

**Flow (non-streaming):** `model.generateContent` → JSON `{ response, session_id, success:true, source:'gemini-api' }`.

**Errors:** `400` `{ error, success:false, apiKeyConfigured, debug }` for missing message/key; `401` for bad JWT.

---

## 3. `transcribe-audio` — speech-to-text

**Route:** `POST /functions/v1/transcribe-audio`
**Purpose:** STT for the live feature when a cloud STT provider is configured. Pluggable: `STT_PROVIDER` ∈ `google` | `deepgram` | `assemblyai` | `browser`. When `browser`, the renderer uses the Web Speech API and never calls this function.

**CORS:** `Allow-Origin *` (audio uploads), `Allow-Headers: authorization, x-client-info, apikey, content-type`, `Allow-Methods: POST,OPTIONS`. `OPTIONS→"ok"`.

**Env:** `STT_PROVIDER`, `STT_API_KEY`.

**Request:** `multipart/form-data` field `audio` (binary) + `language` (default `en-US`) + optional `provider` override.

**Flow:**
1. `OPTIONS→"ok"`. Reject non-POST → `405`.
2. Verify JWT (anonymous ok if user is allowed).
3. Require `audio` File else `400`.
4. Dispatch by provider:
   - `google` — Google Cloud Speech-to-Text (sync/async based on duration).
   - `deepgram` — `POST https://api.deepgram.com/v1/listen` with the audio body.
   - `assemblyai` — upload then poll.
5. If provider unset / `browser` / unimplemented → `501 Not Implemented` `{ text:'', message:'Transcription not implemented for this provider.', info:{provider, language, size, type} }`.

**Response (200):** `{ text:'transcript', provider, language, model, duration_seconds }`. **Response (500):** `{ error:'internal_error', message }`.

Provider selection also affects latency/cost — document the trade-off in the README; default `browser` lets the desktop app work with zero extra keys.

---

## 4. Cross-cutting requirements

- **Auth:** every function verifies JWT; never trust a body-supplied `user_id` for auth-sensitive operations.
- **Persistence:** service-role client only; it bypasses RLS by design — that's why functions resolve `user_id` from the verified JWT and insert with that value, not arbitrary rows.
- **Idempotency:** each function is stateless; `session_id` is the correlating key.
- **Retries/timeouts:** callers bearer the retry (the client SDK does up to 2 retries with 30s timeout); server never blocks longer than Gemini's own stream.
- **Logging:** stderr only; never log raw prompts/responses with PII in production (log masked lengths + model + finishReason).
- **Versioning:** each function has a `deno.json` and imports versions via esm.sh (pin them, don't `latest`).
- **Tests:** each function has golden-path + error-path Deno tests in a `test.ts`, run in CI.
