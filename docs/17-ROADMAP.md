# 17 — Roadmap

Phased delivery. Each phase is **independently runnable and demoable** and matches the vertical slice in `AGENTS.md` §2. Target: v1完毕 (MVP through Phase 4) shippable; Phases 5–7 polish to release.

---

## Phase 0 — Foundation (week 1–2)
- Repository scaffold per `13-PROJECT-STRUCTURE.md`.
- Vite + Electron + React + TS strict + ESLint/Prettier; project references.
- Tailwind + Radix + design tokens from `05-DESIGN-SYSTEM.md`; `shared/ui` base components; `/dev/ui-kit` page; axe baseline 0.
- Supabase project + apply `0000_init.sql` + storage buckets; `verify-schema` script green in CI.
- `db:types` gen wired.
- CI skeleton (lint/typecheck/unit).
**Exit:** Build runs; schema matches spec; kit page renders in light/dark; an empty sign-in form exists.

## Phase 1 — Auth + shell (week 2–3)
- Electron main/preload/renderer with `contextIsolation`; `lingoraAPI` per `11-IPC-CONTRACT.md` (real methods stubbed via web adapter for parity tests).
- Supabase Auth: email + Google; `handle_new_user` trigger; `user_profiles`/`user_roles` confirmed; missing-profile backfill.
- App shell: Sidebar/Header/BottomNav, ThemeProvider (system/light/dark persisted), i18n shell (`en`), routing, `ProtectedRoute`.
- Onboarding stepper (goal/username/placement offer).
**Exit:** Sign up → land on a real (empty) dashboard; role-aware redirects; CRT navigation works.

## Phase 2 — Learning core (week 3–5)
- Dashboard hero (Speak orb) + progress strip (xp/streak/CEFR) + continue learning.
- `process-gemini-chat` Edge Function (streaming SSE, JWT-verified, persists to `conversation_history`).
- Chat + EnhancedChat pages; ChatStore streaming; TTS playback per assistant message.
- Vocabulary (add + spaced review + frontend cards), Grammar lessons/exercises.
- `user_progress` increments (xp via `awardXp`, streak bump); `learning_sessions` writes.
- Lagging: TTS voice settings; offline cache hydration.
**Exit:** Lean can talk to the tutor, save words, drill grammar, see xp/streak update; persistence correct under RLS.

## Phase 3 — Courses, lessons, progression (week 5–7)
- Course catalog + course detail (Overview/Curriculum/Reviews).
- Lesson player: audio/video/text/quiz/pdf/image; PDF highlight → vocabulary.
- Enrollment table (`course_enrollments`), per-lesson `user_lesson_progress`, prerequisite trees via `evaluateModuleAccess`.
- Course, term, lesson creation backoffice (early admin slice, required to author course(s)).
- Wishlist, reviews (admin-approved).
**Exit:** Bob can take a course, complete lessons, unlock prerequisites, review, wishlist.

## Phase 4 — Assessment + CEFR (week 7–8)
- CEFR question bank; assessment sessions + tasks; per-skill scoring; proficiency profile upsert trigger.
- Placement flow; results page (CEFR/IELTS-equivalent/strengths/recommended path); retest scheduling (`next_assessment_due`).
- `unifiedLevelService` (FK→CEFR) + `text_simplifications` cache for content levelling.
**Exit:** Onboarding placement runs end-to-end; dashboard reflects recommended path; content tiles level tag = learner's band.

## Phase 5 — Live conversation (flagship; week 8–10)
- Direct mode: `GenAILiveClient` + `AudioStreamer` + worklets; orb + control tray + status badge.
- Relay mode: `process-live-conversation` SSE + L16→WAV playback; mode-selection auto fallback.
- STT provider-pluggable (browser default) with text fallback + banner.
- Settings dialog (voice, modality, language, focus area, level).
- Session insights panel; persistence to live tables + `learning_sessions` + XP/streak.
**Exit:** Manual audio smoke green; text-path E2E green; relay fallback verified by toggling key.

## Phase 6 — Admin + analytics (week 10–11)
- Admin shell; Users (role assign by super_admin), Course wizard (`upsert_lessons_with_materials`), CEFR questions, Notifications broadcast (`admin_dispatch_notification`) + Realtime push, Analytics (enrollments/completions/engagement), Settings.
- Certificates + verification codes on course completion; leaderboard opt-in.
**Exit:** Admin can author + publish a course; students complete it; certificate verifiable; admin can broadcast to user/course/all.

## Phase 7 — Polish & release (week 11–12)
- Offline cache + sync queue end-to-end; offline banner; reconnect drain.
- Observability: logger, perf marks (chat first-token, live-connect, lesson-load); error reporting opt-in.
- A11y pass (axe 0 on kit + key routes), reduced-motion, focus-visible, transcripts.
- i18n: ship `es` + `fr` catalogs (freundly UI copy only; English content first).
- E2E golden flow green; schema-verify green; `npm audit` clean of high/critical.
- Package Electron targets (Win/mac notarize + Linux AppImage); Netlify prod deploy; auto-update feed (GitHub Releases).
**Exit:** **v1 release** criteria met (`01-PRD.md` §11).

---

## Post-v1 (backlog, not committed to v1)
- Multi-target-language content authoring (Spanish/French tutors).
- Provider STT (Google/Deepgram/AssemblyAI) live in production.
- Leaderboards expansion; community/peer chat.
- Billing/payments + a free/paid entitlement model.
- Mobile-native apps (RN) if web + Electron insufficient.
- Realtime multi-user live rooms (group practice).
- Fine-tuned tutor voices; custom voice cloning (with consent).
- On-device model for offline STT (Whisper.cpp) via Electron.
