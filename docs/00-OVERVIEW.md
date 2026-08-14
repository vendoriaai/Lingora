# 00 — Lingora Overview

> **Speak the world into fluency.**

## What is Lingora

Lingora is a voice-first, AI-powered language-learning application delivered as a cross-platform **Electron desktop app** and a **web app** (the same renderer served via Netlify). Users practice English (and, in later phases, other languages) by talking with an AI tutor in real time, taking courses and lessons, building vocabulary, drilling grammar, and taking CEFR-aligned placement and progress assessments. Authors and operators manage everything through an admin/authoring suite.

It is a deliberate rebuild of an existing product, **EdLingo**. The product space and feature set are the same. The identity, architecture, data model, and UX are new — and the new data model fixes every structural defect the original accumulated over 45 migrations of iterative patching.

## Why a rebuild, not a refactor

The original system worked, but its internals had rotted:

- A database schema shaped by 45 competing migrations: two enrollment tables, two notification tables, two `system_settings` definitions, a `lessons` table whose own getter function referenced columns a later migration had dropped, and RLS policies that queried a `user_id` column that did not exist on `user_profiles` (whose primary key *is* the auth id) — so the policies matched nothing.
- Two parallel database-access patterns: a PostgREST MCP bridge in one set of services and the standard Supabase JS client in another, with service-role keys bypassing RLS from the client.
- A chat Edge Function that persisted messages to a `chat_messages` table that was never created — silent, permanent persistence failure.
- Edge Functions that performed no server-side auth verification, trusting the Supabase gateway alone.
- A repository root polluted with hundreds of kilobytes of committed build artifacts and dozens of ad-hoc `fix-*.js` scripts.
- UI/Copy hard-coded in English throughout, despite the product teaching languages.

Rebuilding lets us encode the *lessons* of that system into a clean contract set rather than carrying the scar tissue forward.

## Target users (summary — full personas in `01-PRD.md`)

- **Learners** — adults learning English for work, study, or migration; want speaking practice and measurable progress.
- **Instructors / authors** — create and curate courses, lessons, and assessment content.
- **Administrators** — manage users, roles, content, analytics, and system settings.

## Core capabilities

1. **AI tutor chat** — streaming, level-adaptive text/voice tutoring (Gemini).
2. **Live voice conversation** — real-time spoken practice with Gemini Live (direct WebSocket) and a Supabase-relay SSE fallback; STT input, TTS playback, session persistence.
3. **Courses, terms, lessons** — structured curriculum with materials (audio/video/text/quiz/PDF/images), prerequisites, and per-lesson progress.
4. **Vocabulary** — personal word lists with spaced-review mastery tracking.
5. **Grammar** — leveled grammar lessons and exercises.
6. **Assessment & CEFR** — placement + periodic assessment; per-skill scoring; proficiency profile; readability/CEFR alignment of content.
7. **Progression** — prerequisite gating, score thresholds, conversation-turn requirements, study-time gates.
8. **Admin/authoring** — dashboards, course wizard, question management, notifications, certificates, study reminders, analytics.
9. **Progress & gamification** — XP, streaks, levels, badges, leaderboards, certificates.
10. **Offline-first** — local-store cache with sync queue for core learning when offline.

## Key improvements over the baseline

| Area | Baseline (EdLingo) | Lingora |
|---|---|---|
| Identity | EdLingo, dark/white, blue accents, ad-hoc styling | Lingora, dedicated design system, indigo/coral/violet, dark mode first-class |
| Repo hygiene | committed `dist` chunks + ~40 `fix-*.js` in root | strict `.gitignore`; scripts in `scripts/`; no artifacts committed |
| DB access | split: PostgREST MCP bridge + Supabase JS, service-role in client | single Supabase JS client + RLS; service-role server-side only |
| Schema | 45 migrations, duplicate/contradictory tables, broken RLS, broken `lessons` getter | one linearised schema, single source per concept, audited RLS |
| Admin gating | email-domain `is_admin()` + `user_roles` table (two systems) | `user_roles` table only, one policy pattern |
| Edge function auth | none (trusted the gateway) | JWT verification on every function |
| Chat persistence | wrote to a non-existent `chat_messages` table | persists to `conversation_history` (exists, RLS'd) |
| State management | mix of providers, contexts, raw `window.electronAPI` | Zustand stores + typed `lingoraAPI`; clear data flow |
| IPC | untyped `ipcRenderer.invoke` strings | typed contract generated from one source |
| i18n | none (English hard-coded) | full string externalisation from day one |
| Accessibility | informal | WCAG 2.1 AA target, keyboard-first, reduced-motion |
| STT in live | browser SpeechRecognition only (fails in Electron) | provider-pluggable (browser / Google / Deepgram / AssemblyAI), browser as fallback |
| Testing | ad-hoc `test-*.js` + `test-*.html` debug pages | Vitest unit/integration + Playwright E2E with coverage targets |

## Design principles

1. **Voice is the primary interaction.** Everything else supports speaking practice.
2. **Boring, safe, typed.** One state library, one DB client, one UI primitive set. Novelty costs are not paid here.
3. **RLS is the security model, not a feature flag.** If a query can't be expressed safely under RLS, redesign the query.
4. **Offline-resilient, cloud-truthed.** Local cache degrades gracefully; the Supabase DB is the source of truth when online.
5. **Measurable progress.** Every learning action maps to XP, CEFR sub-skill, or a progression gate.
6. **Accessible by default.** Not a retrofit.
7. **Buildable by an AI.** These docs are the contract. Avoid implicit knowledge.

## Non-goals (for v1)

- A mobile native app (the responsive web build covers mobile).
- Multi-target-language *content* authoring (v1 teaches English; the architecture supports more later).
- A from-scratch STT/TTS engine (use Gemini TTS + a provider for STT).
- Classroom/LMS features beyond course + enrollment + progress.

## Glossary

- **CEFR** — Common European Framework of Reference: A1 (Beginner) → C2 (Mastery).
- **Flesch–Kincaid** — readability score; higher = easier. Used alongside CEFR to level content.
- **Live session** — bidirectional realtime spoken exchange with the Gemini Live API.
- **Relay mode** — server-side (Supabase Edge Function) SSE streaming when the direct live WebSocket can't be opened (e.g. desktop firewall).
- **Module** — a unit of a learning path (lesson/assignment/test/conversation) with prerequisites.
- **Triplet** — (user, course, lesson) relationship central to progress tracking.
- **RLS** — Postgres Row-Level Security; per-row access control enforced in the database.
- **Edge Function** — Supabase-hosted Deno function (HTTPS endpoint).
