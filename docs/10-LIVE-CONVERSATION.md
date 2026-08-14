# 10 — Live Conversation Subsystem

The flagship. Real-time spoken practice with Gemini. Two transport modes (direct WebSocket preferred, Supabase-relay SSE fallback), a full audio pipeline (capture → worklet → send; receive → PCM/WAV → playback), STT input, TTS playback, session persistence, and a settings UI. This doc is the spec for `renderer/features/live/`.

---

## 1. Modes & selection

| Mode | Transport | Music | When |
|---|---|---|---|
| **Direct** | `@google/genai` Live WebSocket (renderer → `wss://generativelanguage.googleapis.com`) | Model streams PCM chunks | Primary. Requires outbound WSS + a browser-safe `VITE_GEMINI_API_KEY`. |
| **Relay** | HTTP SSE to `process-live-conversation` Edge Function | One TTS `audio/L16→WAV` blob after text completes | Fallback when direct fails (network/no-key/blocked). |
| **Text-only** | Either mode without audio | — | Always available when STT/mic fails. |

Selection algorithm (`useLiveConversation`):
```
on start:
  if hasBrowserKey:
    mode = 'direct'; try connect(model, config)
    if !connected within 4000ms OR connect throws -> mode='relay'
  else:
    mode = 'relay'
  setStatus(Idle -> Connecting -> Connected [via relay])
persist: live_conversation_sessions(mode) on connected
```
The active mode is always visible on the `StatusBadge` ("Connected" vs "Connected via relay").

---

## 2. Component map (live feature)

```
features/live/
  lib/
    genai-live-client.ts     GenAILiveClient (EventEmitter; wraps live.connect)
    audio-streamer.ts        AudioStreamer (Web Audio playback, PCM16->Float32, scheduled queue)
    audio-recorder.ts        mic capture, resample to PCM16/24k mono
    audioworklet-registry.ts cached worklets per AudioContext
    worklets/
      vol-meter.ts           input volume reporter
      audio-processing.ts    PCM framing on input
    session-insights-store.ts zustand store: turns/words/engagement/volumes
    wav.ts                   L16 -> WAV header helper (relay playback)
    pcm-utils.ts             base64<->AB, Int16<->Float32
  components/
    ControlTray.tsx, StatusBadge, AudioPulse, SettingsDialog, SidePanel, InsightsCharts, Logger(dev)
  hooks/
    useLiveApi.ts            owns client + AudioStreamer + volume; connect/disconnect
    use-live-stream.ts       realtime send/receive adaptation (mode-aware)
  store.ts                   LiveStore: mode, connected, messages, partial, volume, config, session
  service.ts                 persistSessionStart/End, persistTurn, toggleSettings
  useLiveConversation.ts    PUBLIC hook: combines everything for pages
```

## 3. The GenAI Live client (`genai-live-client.ts`)

Event-emitting wrapper around `client.live.connect({ model, config, callbacks })`. Events: `open`, `setupcomplete`, `content`, `audio` (ArrayBuffer), `interrupted`, `turncomplete`, `toolcall`, `toolcallcancellation`, `error`, `close`. Status `disconnected|connecting|connected`.

`onmessage` dispatch:
- `setupComplete` → emit `setupcomplete`.
- `toolCall` → `toolcall`; `toolCallCancellation` → `toolcallcancellation`.
- `serverContent`:
  - `interrupted` → `interrupted`.
  - `turnComplete` → `turncomplete`.
  - `modelTurn.parts`: separate `inlineData mimeType audio/pcm` parts → base64 → ArrayBuffer → emit `audio`; remaining parts → emit `content`.

Send methods:
- `sendRealtimeInput(chunks [{mimeType,data}])` — audio PCM and/or image JPG; `sendClientContent` under the hood.
- `send(parts, turnComplete=true)` — text/Part turns.
- `sendToolResponse(toolResponse)`.

Key guard: in `connect`, bail fast with a clear error if no API key (avoid an opaque 403): check `client.options.apiKey` / options.apiKey.

## 4. Audio pipeline

### 4.1 Capture (user mic → Gemini)
- `getUserMedia({ audio: { echoCancellation, noiseSuppression, autoGainControl, channelCount:1 } })`.
- Source → `audio-processing` worklet → frames emitted at PCM16/24kHz mono → base64 of each frame → `sendRealtimeInput([{ mimeType:'audio/pcm', data:b64 }])`.
- `vol-meter` worklet reports input volume → `setVolume()` + `SessionInsights.outVolume` + the `AudioPulse` UI.

### 4.2 Playback (Gemini audio → speakers)
- **Direct:** server audio parts (raw PCM16 24kHz) → `AudioStreamer.addPCM16(Uint8Array)`. AudioStreamer converts Int16→Float32, queues buffers; an `AudioContext` scheduler plays them with ~50 ms initial buffer; `gainNode` → destination. Barge-in (`interrupted` event) calls `stop()` and flushes the queue.
- **Relay:** one `audioData { data:b64, mimeType }` → `wav.ts` wraps L16 in a 44-byte WAV header → `Blob('audio/wav')` → `Audio(url).play()`. Sample rate parsed from `rate=(\d+)` in mimeType (default 24000); 1 channel 16-bit.

### 4.3 AudioContext handling
- One context per role: `audio-in` (capture analysis) and `audio-out` (playback). Resume on user-initiated connect (mobile browsers require this).
- `AudioStreamer` keeps a queue of `Float32Array` buffers; plays via `AudioBufferSourceNode`; reschedules the next packet using `scheduledTime + buffer.duration`. Implements `onComplete` callback when the queue drains.

## 5. Public hook — `useLiveConversation`

```ts
interface UseLiveConversation {
  mode: 'direct'|'relay'|'idle';
  connected: boolean;
  connecting: boolean;
  messages: LiveMessage[];
  partialResponse: string;
  volume: number;
  isListening: boolean;            // STT active
  sttAvailable: boolean;
  sttError: string | null;
  config: LiveConfig;              // voice, responseModality, language, focusArea, level
  start(): Promise<void>;
  stop(): Promise<void>;
  sendUtterance(text: string): Promise<void>;   // text input (always available)
  startListening(): void;           // start STT
  stopListening(): void;
  clearConversation(): void;
  setConfig(patch: Partial<LiveConfig>): void;
}
type LiveMessage = { id:string; role:'user'|'assistant'; text:string; timestamp:Date; audioUrl?:string }
```

### `start()`
1. Set `connecting`. Resolve `mode` per §1. Insert `live_conversation_sessions(is_active=true, mode)` OR queue for relay.
2. Direct: `useLiveApi.connect()`. Wire `on('audio')` → `AudioStreamer.addPCM16`; `on('content')` → append `partialResponse`; `on('turncomplete')` → commit assistant message + persist turn; `on('interrupted')` → stop audio; `on('error'/'close')` → fallback to relay then text.
3. Relay: open SSE event source via `supabaseGeminiService.sendLiveConversationMessage`-equivalent; iterate `stream` (`{ chunk?, fullResponse?, audioData?, done }`) — append partials, play audio once when received, commit on `done`.

### `sendUtterance(text)` (text path; works in both modes)
1. If streaming, ignore (debounce). Append a `user` message; set `isStreaming`.
2. Direct: `client.send([{text}], true)`.
3. Relay: POST to `process-live-conversation` with `streaming:true`; consume SSE; commit assistant turn on `done`.
4. Persist `user` and `assistant` turns to `live_conversation_messages` (and to `conversation_history` for the unified inbox if `focus_area==='conversation'`). Increment `messages_exchanged`.
5. Clear `partialResponse`; `isStreaming=false` in `finally`.

### `startListening/stopListening` (STT)
- Pluggable provider via `STT_PROVIDER` (browser by default).
- Browser: `SpeechRecognition`/`webkitSpeechRecognition` with `interimResults=true`, `lang` from locale; `onresult` accumulates `interim` and, on `isFinal`, calls `sendUtterance(final.trim())`.
- If `network` error from STT (common in Electron where the Web Speech endpoint is unreachable): set `sttAvailable=false`, show the banner ("Speech recognition isn't available here — type your messages"), and keep the text box active — never crash. This mirrors the baseline's graceful handling, made explicit in UX.
- Cloud provider (google/deepgram/assemblyai): capture mic → upload chunks → `transcribe-audio` Edge Function → interim/final callbacks drive `sendUtterance`. In v1 ship `browser` only; others are config-gated stubs.
- Mic permission denied/revoked: show guidance to allow mic; text path active; do not retry silently.

## 6. Settings dialog

- **Voice** — Gemini prebuilt voices (Kore / Puck / Charon / Fenrir / Aoede / Leda / Orus / Zephyr). Persisted in `user_settings` (local + `system_settings`? no, user).
- **Response modality** — `AUDIO` (default) | `TEXT` | `AUDIO+TEXT` (direct adds a textual part alongside).
- **Language** — flow language; default `English`; the system instruction and `speechConfig` language follow it where supported by the model.
- **Focus area** — conversation / grammar / vocabulary / writing / testing (changes the appended fragment per `09-AI-INTEGRATION.md` §2.4).
- **Level** — pulled from `user_proficiency_profiles`; advanced users can pin a level for the session.

## 7. Session insights (right panel)

Realtime metrics visible during a session:
- turns (user/ai), words spoken, minutes, avg response time
- input/output volume meters (worklet-driven)
- engagement score (0–100): weighted by response length, vocabulary diversity, response time, topic relevance (port the `ConversationEngagementService` math; see TDD §3.5)
- a small line chart of input volume; the `AudioPulse` visualisation on the orb.

On `stop()`: finalize `live_conversation_sessions` (set `ended_at`; the duration trigger computes `duration_seconds`), write a `learning_sessions` row (`session_type='live'`, `xp_earned` from engagement), and bump streak/XP via `awardXp`.

## 8. Barge-in & edge cases

- Barge-in: tapping the orb while the AI is speaking → `client.send([], false)` is not needed; the model detects audio input and the `interrupted` event fires; renderer flushes `AudioStreamer` and cancels the in-flight text partial.
- Reconnect: if the live socket drops mid-session, attempt one reconnect (direct); on failure, switch to relay without resetting the transcript; preserve prior `messages`.
- Empty response: if a turn completes with no text and no audio, surface the neutral canned message (mirrors baseline) rather than a blank bubble.
- Prohibited content (relay): show a canned safe message + a `system` log entry (dev logger).
- Tab/background: keep audio running; the Electron shell pauses background timer throttling via flags already set in main (`--disable-background-timer-throttling`).

## 9. Persistence summary

| Table | What |
|---|---|
| `live_conversation_sessions` | one row per conversation; start (mode, language, level, focus_area), end (ended_at, duration trigger) |
| `live_conversation_messages` | one row per turn (user/assistant/system) with `content`, optional `transcript`/`audio_url` |
| `learning_sessions` | mirror as `session_type='live'` with `xp_earned`, `duration_minutes`, `topics_covered` |
| `conversation_history` | also written when live is used in conversation focus, so the unified chat history already shows it |
| `user_progress` | `chat_messages++`, `conversation_time_seconds++`, possible `daily_streak` bump |

RLS per `07-DATABASE-SCHEMA.md` §10 — owner-only access via `auth.uid()`.

## 10. Testing

- Unit: `wav.ts` (L16→WAV header bytes), `pcm-utils` (Int16<->Float32 roundtrip), `session-insights` math, mode-selection function.
- Integration: mock `GenAILiveClient` via a fake EventEmitter to assert event→UI mapping (commit on `turncomplete`, flush on `interrupted`).
- E2E: text-only live flow against a stubbed Edge Function (SSE) ensures the persistence + UI path is green without a real Gemini call in CI; a manual "smoke" run hits the real API.
