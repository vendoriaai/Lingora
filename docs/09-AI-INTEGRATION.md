# 09 — AI Integration (Gemini)

How Lingora talks to Google Gemini: text/vision, TTS, and the realtime Live WebSocket. Includes the level-based communication prompt (ported from the baseline), the fallback ladder, and content-safety handling.

**Model inventory** (defaults; override via env):
| Use | Model | Source env |
|---|---|---|
| Text tutoring (Edge Function + direct fallback) | `gemini-2.5-flash` | `GEMINI_TEXT_MODEL` |
| Live realtime (WebSocket) | `gemini-2.5-flash-exp` (audio-capable Live model) | `GEMINI_LIVE_MODEL` |
| Text-to-speech (relay mode) | `gemini-2.5-flash-preview-tts` | `GEMINI_TTS_MODEL` |

Use **one SDK**: `@google/genai` (unified) — covers REST, Live, tools; supersede the baseline's mixed `@google/generative-ai` + `@google/genai`.

---

## 1. Access topology & the fallback ladder

Keys are loaded from env: renderer uses `VITE_GEMINI_API_KEY`; Edge Functions / Electron main use `GEMINI_API_KEY` (server-side). **The renderer only ever holds a VITE_-prefixed (browser-safe) key** used for direct Live + fallback; the authoritative path goes through the Edge Function where the server key lives.

For **text chat** (`process-gemini-chat`):
1. **Edge Function (preferred).** Renderer → Edge Function (Supabase relay) → Gemini `streamGenerateContent`. Server holds the key, enforces auth, persists (RLS-correct).
2. **Direct client-side Gemini (network fallback).** If the Edge Function is unreachable (network, function 5xx), the renderer calls `@google/genai` `generateContentStream` with `VITE_GEMINI_API_KEY` and a system prompt derived from `focusArea` + `userLevel`. Provider tag surfaced: `direct-gemini-fallback`.
3. **Canned safe response.** On Gemini 4xx/prohibited/cancellation, render a neutral message ("I couldn't generate a response just now — please try rephrasing.") and surface `error`. Never a blank or hung spinner.

For **live voice** see `10-LIVE-CONVERSATION.md`. Two modes — direct first, relay on failure; the ladder terminates with the text box (always available).

Implementation (`shared/api/gemini.ts`):
```ts
export interface ChatOutcome { success: boolean; provider: 'edge'|'direct-gemini'|'canned'; stream?: AsyncIterable<StreamItem>; response?: string; error?: string; sessionId?: string }
export async function chat(text: string, opts: ChatOpts): Promise<ChatOutcome>
```
`opts = { focusArea, userLevel, language, sessionId, history }`.

---

## 2. Level-based communication prompt (canonical, ported + tidied)

The tutor adapts grammar, vocabulary, sentence length and teaching depth to the learner's band. The matrix below is the source of truth; inject the user's resolved CEFR level (from `user_proficiency_profiles`/`user_profiles.placement_level`, defaulting to A1) into the system instruction. Keep "dual track": Basic = casual conversation (no readability constraints), Elementary..Advanced = structured learning with Flesch–Kincaid ranges.

### 2.1 Base system instruction (all levels)
```
You are an AI language tutor in the Lingora app teaching English using a unified
proficiency system combining Flesch-Kincaid readability and CEFR levels. Adapt your
responses to the user's assigned level. Identify or inference the level once and keep it.
Do not overwhelm beginners or bore advanced learners — be engaging, supportive, progressive.

- Keep responses concise, clear, encouraging.
- Correct mistakes gently, ONE issue at a time, with a proposed fix and an invitation to try it.
- End with a short follow-up question or task that invites the learner to practice.
- Use positive reinforcement ("Nicely put." "Let's try that again.")
- Stay culturally neutral and inclusive.
- If a learner's input is far above/below their level, suggest adjusting — briefly, kindly.
- Avoid calling functions unless the learner explicitly asks for an action.
```

### 2.2 Level matrix (append the matching block to the system instruction)

| Level | CEFR | Flesch–Kincaid | Tense / grammar | Vocabulary | Sentence length | Tone |
|---|---|---|---|---|---|---|
| **Basic** | A1 | n/a | simple present only | top 500 everyday words ("hello," "eat," "house") | 5–10 words | repetition, role-play, greetings |
| **Elementary** | A2 | 0–1 | simple past/present; `and/but` | first 1,000 words | 8–12 words | pictures/stories context |
| **Pre-Intermediate** | B1 | 1–1.5 | future, simple conditionals | 1,000–2,000 words | 10–15 words | opinions, plans, brief narratives |
| **Intermediate** | B2 | 1.5–2.5 | passive voice, modals, idioms | 2,000–4,000 words | 12–20 words | analysis, comparison, debate |
| **Upper-Intermediate** | C1 | 2.5–3.5 | subjunctives, inversions, academic register | 4,000+ words | 15–25 words | abstract ideas, current events |
| **Advanced** | C2 | 3.5–4.5 | unrestricted, native-like, specialised | specialised | 20+ words | nuanced topics; treat as proficient — no babying |

Mapping from `userLevel` string alias → CEFR: `beginner→A1, elementary→A2, intermediate→B1..B2, pre-intermediate→B1, upper-intermediate→C1, advanced→C2`.

### 2.3 Live-voice constraint (overrides length for the live model)
For `process-live-conversation` and the Live system instruction: **15–30 words, 1–2 sentences, singular "you".** Streaming brevity matters more than depth in realtime voice.

### 2.4 Focus-area system prompt fragments
Append to the base instruction by `focus_area`:
- `conversation` — "Stay in character. Prioritise back-and-forth; ask one question at a time; correct only major errors."
- `grammar` — "Focus on grammar form. Provide one mini-explanation, then a drill-style prompt."
- `vocabulary` — "Introduce 1–2 relevant words in context; give a definition and example, then a recall prompt."
- `writing` — "Give writing feedback on one structural point; suggest a rewrite; ask for a follow-up."
- `testing` — "Pose a CEFR-scale task; evaluate the answer briefly; advance or revisit."

### 2.5 Self-evaluation nudge (kept from the baseline)
Add a trailing instruction: "After each response, internally rate whether it matches the target Flesch–Kincaid band and CEFR vocabulary; if not, adjust the next response."

---

## 3. Generation parameters per mode

| Mode | Model | temperature | topP | topK | maxOutputTokens | responseModalities |
|---|---|---|---|---|---|---|
| Text chat (edge) | gemini-2.5-flash | 0.6 | 0.7 | 20 | 200 | [TEXT] |
| Text chat (direct fallback) | gemini-2.5-flash | 0.7 | 0.95 | 40 | 2048 | [TEXT] |
| Live (direct WS) | gemini-2.5-flash-exp | 0.7 | 0.95 | — | — | [AUDIO] (configurable to [AUDIO,TEXT]) |
| Live relay chat | gemini-2.5-flash | 0.7 | 0.95 | 40 | 256 | [TEXT] |
| TTS (relay) | gemini-2.5-flash-preview-tts | — | — | — | — | [AUDIO] voice=Kore (selectable) |

---

## 4. Live API configuration (direct mode)

Built in `useLiveAPI`. Defaults:
```ts
const config: LiveConnectConfig = {
  systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,            // section 2.1 + the live-voice constraint (2.3)
  tools: DEFAULT_TOOLS,                                     // schedule_practice_session, record_progress, translate_text, fetch_dictionary_definition
  responseModalities: [Modality.AUDIO],                     // [AUDIO,TEXT] if transcript wanted server-side
  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },   // Voice selector UI overrides
};
const model = 'gemini-2.5-flash-exp';
```
`DEFAULT_TOOLS` exposes the function declarations listed in §6. The tool responses are wired in the renderer; tools must **not** auto-fire (instruction includes the guard in 2.1).

Connection contract and event mapping (`genai-live-client.ts` pattern) is in `10-LIVE-CONVERSATION.md`.

---

## 5. TTS playback (relay mode)

The relay TTS returns `audioData: { data: base64, mimeType }`. Gemini TTS emits **raw `audio/L16;codec=pcm;rate=24000`** (16-bit PCM, mono, 24 kHz). Browsers don't play raw L16 directly; wrap it in a WAV container:
```
header (44 bytes):  RIFF / size / WAVE / fmt  (PCM=1, mono, 24000, byteRate=48000, blockAlign=2, bits=16) / data / size
payload:           the L16 bytes, unchanged
then Blob('audio/wav') → URL.createObjectURL → new Audio(url).play()
```
Detect the rate from `rate=(\d+)` in the mimeType; default 24000. On play failure, log + surface a gentle "couldn't play audio" toast, keep the transcript. (Direct mode uses streaming PCM via `AudioStreamer.addPCM16` instead — see live doc.)

---

## 6. Function-calling tools (live)

Built-in declarations (used in `tools`); wire responses on the renderer:

| Tool | Args | Renderer handling |
|---|---|---|
| `schedule_practice_session` | topic:String, level:enum, duration_min:Int(5–120) | Write a `study_reminders` row; confirm in transcript. |
| `record_progress` | skill:enum(speaking…pronunciation), score:Number(0–100), notes?:String | Persist to `user_module_progress`/`learning_sessions`. |
| `translate_text` | text, target_language | Return the translated line; store as metadata. |
| `fetch_dictionary_definition` | word | Look up `user_vocabulary`/dictionary; insert the result into the live context. |

Tool-calls must only run when the learner explicitly asks (guard in system instruction). Never auto-persist progress without user intent.

---

## 7. Content safety

- Treat `finishReason` `SAFETY` / `PROHIBITED_CONTENT` / `RECITATION` as a soft failure → canned neutral response, no raw leakage.
- Set Gemini `safetySettings` to educational expectations (the default blocks are reasonable; relax `HARM_CATEGORY_HARASSMENT` and `HARM_CATEGORY_SEXUALLY_EXPLICIT` to `BLOCK_ONLY_HIGH` only for adult learner tutoring with the app rated appropriately — record the decision in `16-SECURITY.md` §content-safety).
- Never echo user-trusted content back unfiltered in logs; mask.
- Sampling QA: 1% of sessions sampled by an operator app for prompt-adherence/safety.

---

## 8. Keys, cost, and latency

- Browser-safe key (`VITE_*`) is used for Live + dire fallback. On the request to model: nothing more. Keep the server key in Edge Functions only.
- Bound `maxOutputTokens` per focus area to limit blast radius.
- Live latency target end-to-end ≤ 1500 ms (capture as a perf mark). Chat first-token target ≤ 800 ms warm.
- Cost guard: per-user daily token cap stored in `system_settings` (key `daily_ai_token_budget`, default 200k) and enforced in the Edge Function (best-effort; rely on the Supabase project's own rate limiting too).

---

## 9. Error → UI mapping

| Outcome | UI |
|---|---|
| Edge streaming fails 5xx | auto-fallback to direct; surface "Switched to local model"; never spin forever |
| Direct fails (key invalid/no network) | canned neutral; Retry button |
| Prohibited content | canned neutral; no transcript of the blocked fragment |
| STT unavailable | typing box remains; inline hint; no error toast spam |
| Live connect > 4s direct | switch to relay; status badge updates ("Connected via relay") |

This matches the UX spec §3.4.
