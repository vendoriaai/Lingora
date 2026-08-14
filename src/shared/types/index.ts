// Domain types shared by main / preload / renderer. Imported from @shared/types.

export type FocusArea =
  | 'conversation'
  | 'grammar'
  | 'vocabulary'
  | 'writing'
  | 'testing'
  | 'default';

/** A single chat request forwarded to the AI service (Edge fn or direct Gemini). */
export interface ChatReq {
  message: string;
  sessionId?: string;
  /** CEFR level A1–C2, shaping the system prompt (09-AI-INTEGRATION). */
  userLevel?: string;
  focusArea?: FocusArea;
  language?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  streaming?: boolean;
}

/** A streamed token / final turn / audio chunk. */
export interface StreamItem {
  chunk?: string;
  fullResponse?: string;
  audioData?: ArrayBuffer;
  done: boolean;
}

/** Cancelable async stream handle returned by ai.generateResponseStream. */
export interface StreamHandle {
  stream: AsyncIterable<StreamItem>;
  cancel(): void;
  sessionId: string;
}

/** Live voice session start options. */
export interface LiveSessionOpts {
  userLevel?: string;
  focusArea?: FocusArea;
  language?: string;
  mode?: 'direct' | 'relay';
  voice?: string;
}

/** Pronunciation report returned by audio.analyze. */
export interface PronReport {
  similarity: number; // 0..1 vs targetText
  transcript: string;
  feedback: string;
}

/** Persisted conversation turn (→ conversation_history row under RLS). */
export interface PersistTurn {
  userId: string;
  sessionId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  focusArea?: FocusArea;
  metadata?: Record<string, unknown>;
}

/** Patch applied to user_progress (XP, streak, level). */
export interface ProgressPatch {
  xpDelta?: number;
  streakDelta?: number;
  cefrLevel?: string;
  language?: string;
}

/** Snapshot of a user's progress per (user, language). */
export interface UserProgress {
  userId: string;
  language: string;
  currentLevel: number;
  totalXp: number;
  dailyStreak: number;
  cefrLevel: string | null;
  updatedAt: string;
}

/** AI settings snapshot (system_settings + user prefs merged). */
export interface AiSettings {
  textModel: string;
  liveModel: string;
  ttsModel: string;
  sttProvider: 'browser' | 'google' | 'deepgram' | 'assemblyai';
  focusArea: FocusArea;
}

/** Notification inbox item pushed via event:notification. */
export interface NotificationInboxItem {
  id: string;
  title: string;
  body?: string;
  type: 'system' | 'course' | 'user' | 'broadcast';
  createdAt: string;
  isRead: boolean;
}

/** Local cache export/import payload (offline store snapshot). */
export interface BackupBlob {
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

export type Unsubscribe = () => void;
export type Theme = 'system' | 'light' | 'dark';
