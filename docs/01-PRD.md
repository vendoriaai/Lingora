# 01 — Product Requirements Document (PRD)

**Product:** Lingora — voice-first AI language learning.
**Status:** Spec for v1 build. Owner: product.
**See also:** `00-OVERVIEW.md` (vision), `06-UI-UX-SPEC.md` (screens), `17-ROADMAP.md` (phasing).

---

## 1. Problem & opportunity

Adult English learners can read and drill apps, but they rarely *speak*. Speaking is where fluency is built and where most apps stop helping. Learners need: (a) low-friction spoken practice with a patient AI, (b) measurable placement (CEFR) and progress, (c) structured curriculum they can follow, and (d) correction without judgment. Existing tools either gamify rote vocabulary or are too expensive for daily use. Lingora makes **live spoken practice the center** and wraps it in a credibly-structured course + assessment system.

## 2. Goals & success metrics

| Goal (v1) | Success metric (target) |
|---|---|
| Learners practice speaking regularly | ≥ 40% of weekly active users complete ≥ 1 live session/week |
| Learners perceive progress | ≥ 60% of assessed users move up ≥ 1 CEFR sub-level within 90 days |
| Reach on desktop + web | Working Electron build (Win/macOS/Linux) + Netlify web deploy |
| Trustworthy outputs | < 1% of AI responses flagged unsafe/incorrect by sampling |
| Buildability | An engineer/agent builds the MVP strictly from this doc set |

Non-goal metrics (v1): monetization, MAU scale targets — those belong to v2 once the product is proven.

## 3. Personas

### P1 — Maya, the motivated learner (primary)
- 28, software designer, intermediate English (B1). Wants to advance to B2/C1 for work abroad.
- Frustrations: can read/write fine, freezes when speaking; apps give vocabulary but no real conversation; group classes are intimidating and infrequent.
- Needs: private spoken practice any time, gentle correction, structure, visible progression, proof of level (CEFR) she can show employers.

### P2 — Tom, the busy beginner
- 34, plumber migrating to an English-speaking country. A1/A2.
- Needs: extremely simple, encouraging interactions; everyday vocabulary; voice that's not scary; works offline on a bad connection.

### P3 — Priya, the instructor/author
- 41, runs an English coaching business. Creates courses, lessons, and assessment items.
- Needs: a course wizard, material upload (audio/video/PDF), CEFR tagging, per-learner visibility, the ability to sequence prerequisites.

### P4 — Alex, the administrator
- Platform operator at an education org deploying Lingora to 200 users.
- Needs: user/role management, content moderation, notifications, analytics, audit-grade access control, system-wide settings.

## 4. User stories (grouped by feature)

### 4.1 Authentication & profile
- US-A1: As a new user, I can sign up with email or Google so I can start learning.
- US-A2: As a user, my profile is created automatically on signup so I don't hit empty-state errors.
- US-A3: As a user, I can set my target language, native language, and a public username (3–32 chars, `A–Z a–z 0–9 . _`).
- US-A4: As a user, I can switch to dark mode and the choice persists across sessions.
- US-A5 (accessibility): As a keyboard-only user, I can complete signup, assessment, and a live session without a mouse.

### 4.2 Onboarding & placement
- US-O1: As a new user, I'm offered a placement assessment so my starting CEFR level is known.
- US-O2: As a skipper, I can defer placement and start at "Basic" with the option to assess later.
- US-O3: After completing an assessment, my proficiency profile and recommended learning path appear.

### 4.3 AI tutor chat (text + voice)
- US-C1: As a learner, I open Chat and ask a question in my target language; the tutor replies at my level.
- US-C2: As a learner, the tutor's reply is short, encouraging, and ends with a practice prompt.
- US-C3: As a learner, the tutor corrects one error at a time, gently.
- US-C4: As a learner, the tutor's response is streamed (tokens appear as generated) for perceived speed.
- US-C5: As a learner, I can hear responses spoken aloud (TTS) and the tone/rate match my level.
- US-C6: As a learner, my conversation history persists, scoped to my account.
- US-C7: As a learner, if the AI service is down, I see a clear message and can re-send — never a silent failure.

### 4.4 Live voice conversation (flagship)
- US-L1: As a learner, I open Live Conversation and, with one tap, start talking with the AI tutor by voice.
- US-L2: As a learner, the tutor speaks back in real time with natural voice.
- US-L3: As a learner, I can interrupt the tutor mid-sentence (barge-in) and it stops.
- US-L4: As a learner, if direct live connection can't be established (firewall), the app falls back to a relay mode and tells me it did.
- US-L5: As a learner, I can also type messages when I can't/don't want to speak.
- US-L6: As a learner, my live session (turns, duration, words spoken) is saved to my history.
- US-L7: As a learner, if STT is unavailable (e.g. desktop network restriction), typing still works and I'm informed.
- US-L8: As a learner, I can adjust voice, modality (audio/text), and response language via a settings dialog.

### 4.5 Courses, lessons, materials
- US-K1: As a learner, I browse a catalog of courses filtered by language and CEFR level.
- US-K2: As a learner, I enroll in a course and see it on my dashboard with progress.
- US-K3: As a learner, I open a course, see its terms (modules) and lessons in order with prerequisites.
- US-K4: As a learner, I consume lessons with mixed media (audio, video, text, quiz, PDF) — I can highlight words in PDFs and save them to my vocabulary.
- US-K5: As a learner, completing a lesson records my score, time spent, and XP; prerequisites unlock next lessons.
- US-K6: As a learner, I can add a course to a wishlist.
- US-K7: As a learner, I can review a completed course (1–5 stars + text).

### 4.6 Vocabulary
- US-V1: As a learner, I can add a word with translation, definition, example sentence, and difficulty.
- US-V2: As a learner, words due for spaced review surface so I don't forget them.
- US-V3: As a learner, my mastery level (0–5) advances as I review correctly.

### 4.7 Grammar
- US-G1: As a learner, I can browse leveled grammar lessons with clear explanations and examples.
- US-G2: As a learner, I complete grammar exercises and get feedback.

### 4.8 Assessment & CEFR
- US-M1: As a learner, I take a placement assessment across skills (grammar, vocabulary, speaking, listening, reading, writing).
- US-M2: As a learner, I receive a CEFR level, an IELTS-equivalent score, and per-skill breakdown with strengths/weaknesses.
- US-M3: As a learner, the system recommends a learning path to my target level and schedules the next assessment.
- US-M4: As a learner, content I'm given is leveled to my CEFR band (readability/CEFR alignment), simplifying text when it's above my level.

### 4.9 Progress, gamification, progression
- US-P1: As a learner, I earn XP for learning actions; XP maps to a level and a streak.
- US-P2: As a learner, I see daily streaks and reminders to keep them.
- US-P3: As a learner, I unlock badges for milestones.
- US-P4: As a learner, I appear on leaderboards opt-in only.
- US-P5: As a learner, completing a course issues a verifiable certificate with a unique verification code.
- US-P6: As a learner, progression to the next module requires completing prerequisites, hitting score thresholds, and meeting conversation-turn requirements.

### 4.10 Admin / authoring
- US-D1: As an admin, I manage users, roles (student/instructor/admin/super_admin), and a course's instructor.
- US-D2: As an author, I use a course wizard to create a course with metadata, terms, and lessons.
- US-D3: As an author, I upload lesson materials (audio/video/text/quiz/PDF/images) to Supabase Storage.
- US-D4: As an author, I create/manage CEFR-tagged assessment questions.
- US-D5: As an admin, I broadcast notifications (all/course/user) and users see them in-app with realtime push.
- US-D6: As an admin, I see analytics: enrollments, completions, dropouts, time spent, engagement.
- US-D7: As an admin, I configure system-wide settings (feature flags, AI params) with public/private visibility.

### 4.11 Offline & sync
- US-S1: As a learner, the app keeps working offline for cached lessons, vocabulary, and chat drafting.
- US-S2: As a learner, when back online, my progress syncs and conflicts resolve to cloud-truth transparently.

## 5. Functional requirements (FR)

### FR-1 Authentication & accounts
- FR-1.1 Email/password + Google OAuth via Supabase Auth. JWT-based session.
- FR-1.2 Auto-provision `user_profiles` on signup via Postgres trigger (SECURITY DEFINER).
- FR-1.3 Roles: `student` (default), `instructor`, `admin`, `super_admin` (via `user_roles`).
- FR-1.4 If a profile row is missing (legacy/migration), call `create_missing_user_profile()` with the auth id.
- FR-1.5 Username uniqueness (case-insensitive partial index) + format check (`^[A-Za-z0-9._]{3,32}$`).

### FR-2 AI tutor
- FR-2.1 Gemini text chat via Edge Function `process-gemini-chat`, streaming SSE.
- FR-2.2 System prompt adapts to CEFR level per `09-AI-INTEGRATION.md` §level matrix.
- FR-2.3 Fallback ladder: Edge Function (Supabase relay) → direct client-side Gemini → a safe canned response. Never a blank screen.
- FR-2.4 Persist chat turns to `conversation_history` (RLS owner-only).
- FR-2.5 Content safety: filter blocked/prohibited responses to a neutral canned message and log.
- FR-2.6 Configurable focus area (conversation / grammar / vocabulary / writing / testing) shaping the system prompt.

### FR-3 Live conversation
- FR-3.1 Direct mode: Gemini Live WebSocket via `@google/genai` SDK from the renderer; PCM 16-bit 24 kHz capture; model audio as PCM-in-WAV for playback.
- FR-3.2 Relay mode: Supabase Edge Function `process-live-conversation` returning SSE text chunks + one TTS audio blob (L16→WAV).
- FR-3.3 Mode selection: try direct first; on failure (network/no-key/blocked) fall back to relay; surface the active mode to the user.
- FR-3.4 STT: pluggable provider (`STT_PROVIDER`); browser Web Speech as fallback; if STT unavailable, text input is always available.
- FR-3.5 TTS playback of model audio with volume meter (AudioWorklet).
- FR-3.6 Barge-in support: interrupting audio stops playback and clears the queue.
- FR-3.7 Session persistence: write to `live_conversation_sessions` (start/end) and `live_conversation_messages` (turns).
- FR-3.8 Settings: voice, response modality (audio/text), language.

### FR-4 Courses & curriculum
- FR-4.1 Course catalog with filters: language, CEFR level, category, active.
- FR-4.2 Course metadata: title, description, language, level/CEFR, duration weeks, hours/week, max students, price, instructor, objectives, prerequisites, syllabus, start/enrollment dates.
- FR-4.3 Course → terms (ordered) → lessons (ordered) hierarchy. Lessons support multiple materials each.
- FR-4.4 Materials types: podcast, video, text, quiz, pdf, image, audio.
- FR-4.5 Enrollment: one `course_enrollments` table, status (enrolled/in_progress/completed/withdrawn), progress %, last accessed.
- FR-4.6 Per-lesson progress: completed_at, xp_earned, time_spent, score.
- FR-4.7 PDF highlight → vocabulary save (with page + position metadata).
- FR-4.8 Review_html for courses.
- FR-4.9 Wishlist + ratings (1–5, approved flag).

### FR-5 Vocabulary
- FR-5.1 User vocab: word, translation, language, definition, example, difficulty, mastery (0–5), times reviewed, last reviewed.
- FR-5.2 Spaced-review: due = last_reviewed_at + (mastery+1) days.
- FR-5.3 Vocabulary SVG illustrations per category (family, food, travel, hello, goodbye …).

### FR-6 Grammar
- FR-6.1 Grammar lessons: title, description, language, level, content (JSONB), difficulty score, est. duration, tags, active.
- FR-6.2 Exercises with typed answers and feedback.

### FR-7 Assessment & CEFR
- FR-7.1 Assessment sessions: initial/periodic/placement; status lifecycle; per-skill scores; AI analysis; CEFR level; IELTS-equivalent; proficiency breakdown.
- FR-7.2 Per-task results recorded (`assessment_tasks`) typed by skill/CEFR; auto-update user profile on completion (trigger).
- FR-7.3 CEFR question bank (`cefr_assessment_questions`) typed by skill, CEFR, difficulty; managed by authors.
- FR-7.4 Proficiency profile (`user_proficiency_profiles`) per (user, language); next assessment due.
- FR-7.5 Readability/CEFR leveling service: Flesch–Kincaid → CEFR; `text_simplifications` cache; simplify text above the learner's level via AI.

### FR-8 Progression & gamification
- FR-8.1 XP + level: level = floor(total_xp / 100) + 1; streak increment on daily activity.
- FR-8.2 `learning_sessions` with type, language, duration, xp, accuracy, topics.
- FR-8.3 Content modules + `user_module_progress` (locked/available/in_progress/completed/failed).
- FR-8.4 Progression rules: prerequisite / score_threshold / conversation_requirement / time_gate.
- FR-8.5 Conversation engagement scoring (`conversation_engagement`): turn count, response times, vocabulary diversity, topic relevance, engagement score (0–100).
- FR-8.6 Badges, leaderboards (opt-in), certificates with unique verification codes.

### FR-9 Admin & notifications
- FR-9.1 Admin dashboards: users, courses, content, analytics.
- FR-9.2 Course wizard (create/update with materials upsert).
- FR-9.3 Notifications: broadcast to all / course / user; in-app; realtime push via Supabase Realtime.
- FR-9.4 Study reminders (daily/weekly, time, weekday).
- FR-9.5 System settings (JSONB key/value; public vs admin-only).

### FR-10 Offline & sync
- FR-10.1 Local-store cache (Electron `userData`) mirroring user progress, vocabulary, sessions, settings.
- FR-10.2 Sync queue with retry; last-sync watermark; cloud is authoritative on reconnection.

### FR-11 Nonfunctional (see dedicated docs)
- FR-11.1 Performance: dashboard < 2s TTI warm; chat first token < 800 ms; live voice end-to-end latency target < 1.5s.
- FR-11.2 Reliability: graceful degradation when Supabase/Gemini unavailable.
- FR-11.3 Accessibility: WCAG 2.1 AA.
- FR-11.4 i18n: en (default), es, fr.
- FR-11.5 Security: contextIsolation, RLS, server-side-edge auth, no client-side service-role keys (see `16-SECURITY.md`).

## 6. Acceptance criteria (format per story)

Each US must satisfy: given [context] when [action] then [observable outcome] under [state]. Concretely, the build must:

- A1 (signup): Given a new email, when the user submits signup, then a `user_profiles` row exists for `auth.uid()` and the user lands on onboarding (dashboard loading screen ≤ 1.5s).
- C2 (level response): Given a B1 learner, when they ask "Explain climate change", the reply uses sentences ≤ ~15 words, vocabulary ≤ ~2000 words, and ends with a practice question.
- L1/L4 (live start + fallback): Given mic granted and a valid Gemini key, when the user taps Start, then direct mode connects within 3s, the status badge shows "Connected"; if it can't, then relay mode engages within 4s and the badge shows "Connected via relay".
- K5 (lesson completion): Given a passed quiz, when submitted, then `user_lesson_progress` row exists with xp_earned and the next lesson's prerequisite gate evaluates true.
- M2 (assessment result): Given a completed assessment session, then `user_proficiency_profiles` is upserted with a CEFR level, IELTS-equivalent, and per-skill scores, and the dashboard shows the recommended path.

## 7. Scope & out-of-scope

**In scope (v1):** all FR-1..FR-11 above, English content, three UI languages (en/es/fr), desktop + web builds.
**Out of scope (v1):** native mobile apps, billing/payments, multi-target-language content authoring, in-app social/community, instructor live calls with learners, offline *live* voice (requires connectivity).

## 8. Constraints & assumptions

- A working Google Gemini API key and a Supabase project are prerequisites; cost is borne by the operator.
- The Electron build runs on Win/macOS/Linux; the renderer is the same code served on the web.
- Live voice requires mic permission and (for direct mode) outbound WebSocket to `generativelanguage.googleapis.com`; corporate firewalls motivate relay mode.

## 9. Deadweight / out-of-spec behaviors from the baseline (do NOT carry over)

- Silent failures (chat persistence to nonexistent table, RLS matching nothing) — Lingora fails loud in dev, graceful in prod with telemetry.
- Hard-coded English UI copy.
- Service-role keys shipped to the renderer.
- Two enrollment/notification/settings systems.

## 10. Dependencies & risks

| Risk | Mitigation |
|---|---|
| Gemini Live API availability/regions | relay-mode fallback; degrade to text chat |
| Mic permission denial | text input always available; clear guidance |
| Supabase project limits (realtime conns, function invocations) | pool realtime subscriptions; cache reads |
| AI output quality/safety | system prompt constraints; content filtering; sampling QA |
| Schema complexity | linearised, audited schema (`07-DATABASE-SCHEMA.md`) |

## 11. Release criteria (v1)

All Phase 0–7 items in `17-ROADMAP.md` delivered; E2E green for signup → assessment → chat → lesson → live session → certificate; Lighthouse a11y ≥ 95 on web build; no high/critical `npm audit` vulns; admin can author and publish a course end-to-end.
