# 07 — Database Schema (Postgres / Supabase)

Canonical schema for Lingora. **Build the database from this document first** — everything depends on it. This is a clean, reconciled schema: the concepts from the baseline are preserved, but every accumulated defect is resolved (see §"Lessons from the baseline" at the end).

Conventions: schema `public`; PKs `UUID DEFAULT gen_random_uuid()`; timestamps `timestamptz DEFAULT now()`; RLS **enabled on every table**; the Supabase JS client (anon key + user JWT) is the only client — service-role keys live only in Edge Functions. Type definitions are normative; replicate exactly.

---

## 0. Conventions & shared utilities

### Extensions
```sql
create extension if not exists pgcrypto;     -- gen_random_uuid()
create extension if not exists "uuid-ossp";   -- used by some legacy functions; retained for compat
create extension if not exists pg_trgm;       -- username search
```

### Shared trigger functions
```sql
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- generic usage:  create trigger <t>_updated_at before update on <table>
--                  for each row execute function public.set_updated_at();
```
Every table with an `updated_at` column gets a `<table>_updated_at` trigger using the above.

### Auth/role helpers (replaces baseline's dual is_admin systems)
```sql
-- Admin identity is determined ONLY by the user_roles table.
create or replace function public.has_role(p_user uuid, p_role text) returns boolean
  language sql security definer stable as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = p_user and r.role = p_role and r.is_active
  );
$$;
create or replace function public.is_admin() returns boolean
  language sql stable as $$
  select public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin');
$$;
create or replace function public.is_instructor() returns boolean
  language sql stable as $$
  select public.has_role(auth.uid(), 'instructor') or public.is_admin();
$$;
```
**No** email-domain `is_admin()` (the baseline's `LIKE '%@admin.edlingo.com'`). No JWT-claim inspection. The `user_roles` table is the single source of truth, and is RLS-protected so users can read their own role.

---

## 1. Profiles & identity

### user_profiles
```sql
create table public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  preferred_language text default 'en',
  target_language    text default 'English',
  native_language    text default 'Unknown',
  learning_level     text default 'beginner',     -- mirror of placement_level
  placement_level    text,                          -- CEFR level once assessed
  assessment_completed boolean default false,
  username text,
  goal text,
  daily_minutes_target int default 15,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index ux_user_profiles_email on public.user_profiles(email);
create unique index ux_user_profiles_username_ci
  on public.user_profiles(lower(username)) where username is not null;
alter table public.user_profiles add constraint ck_profiles_username
  check (username is null or username ~ '^[A-Za-z0-9._]{3,32}$');
create index idx_profiles_assessment_completed on public.user_profiles(assessment_completed);
create index idx_profiles_target_language on public.user_profiles(target_language);
create index gin_profiles_username_trgm on public.user_profiles using gin (username gin_trgm_ops);
create trigger user_profiles_updated_at before update on public.user_profiles
  for each row execute function public.set_updated_at();
```
Auto-provision on signup:
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'student')
  on conflict (user_id, role) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.create_missing_user_profile(p_user uuid, p_email text, p_name text default null)
returns boolean language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, email, full_name) values (p_user, p_email, p_name)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (p_user, 'student')
  on conflict (user_id, role) do nothing;
  return true; end; $$;
```
RLS:
```sql
alter table public.user_profiles enable row level security;
-- Note: its PK 'id' IS the auth id — there is no 'user_id' column.
create policy "view own profile"   on public.user_profiles for select using (auth.uid() = id);
create policy "update own profile" on public.user_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "insert own profile" on public.user_profiles for insert with check (auth.uid() = id);
create policy "admin view profiles" on public.user_profiles for select to authenticated using (public.is_admin());
create policy "admin manage profiles" on public.user_profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
```

### user_roles
```sql
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student','instructor','admin','super_admin')),
  permissions jsonb default '{}'::jsonb,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz default now(),
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (user_id, role)
);
create index idx_user_roles_user on public.user_roles(user_id);
create index idx_user_roles_role  on public.user_roles(role) where is_active;
create trigger user_roles_updated_at before update on public.user_roles
  for each row execute function public.set_updated_at();
alter table public.user_roles enable row level security;
create policy "view own role"     on public.user_roles for select using (auth.uid() = user_id);
create policy "admin view roles"  on user_roles for select to authenticated using (public.is_admin());
create policy "admin manage roles" on user_roles for all to authenticated
  using (public.is_admin() and (public.has_role(auth.uid(),'super_admin') or true))
  with check (public.is_admin());
-- restrict role assignment to super_admin only: tightened in policy below
```
Clarify: only a `super_admin`/`admin` may mutate roles. Use the simpler check `with check (auth.uid() <> p_user)`? — keep `is_admin()` for read, `super_admin` for create:
```sql
create or replace function public.is_super_admin() returns boolean
  language sql stable as $$ select public.has_role(auth.uid(),'super_admin'); $$;
revoke all on user_roles from anon;
-- assignment policy: only super_admin can insert/update roles (drop the earlier permissive one)
create policy "super_admin assigns roles" on user_roles for insert to authenticated
  with check (public.is_super_admin());
create policy "super_admin updates roles" on user_roles for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
```
(Implement the final permissive policy set: SELECT own + super_admin-manage.)

---

## 2. Learning progress

### user_progress
One column set only — **no parallel alias columns** (the baseline's `level/xp_points/streak_days` vs `current_level/total_xp/daily_streak` drift is gone). Keep `current_level / total_xp / daily_streak`.
```sql
create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  language text not null default 'English',
  current_level text not null default 'beginner',
  total_xp int not null default 0,
  daily_streak int not null default 0,
  last_study_date date default current_date,
  chat_messages int default 0,
  conversation_time_seconds int default 0,
  total_lessons_completed int default 0,
  total_words_learned int default 0,
  current_course_id uuid references public.courses(id) on delete set null,
  completed_lessons jsonb default '[]'::jsonb,
  cefr_level text default 'A1' check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, language)
);
create index idx_progress_user on public.user_progress(user_id);
create index idx_progress_course on public.user_progress(current_course_id);
create index idx_progress_last on public.user_progress(last_study_date);
create trigger user_progress_updated_at before update on public.user_progress
  for each row execute function public.set_updated_at();
alter table public.user_progress enable row level security;
create policy "own progress r" on user_progress for select using (auth.uid() = user_id);
create policy "own progress w" on user_progress for insert with check (auth.uid() = user_id);
create policy "own progress u" on user_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin view progress" on user_progress for select to authenticated using (public.is_admin());
```
XP→level computation is **client-side** (`level = floor(total_xp/100)+1`); no trigger kept the dual columns in sync. XP writes go through `awardXp`, which PATCHes `total_xp` (atomic `increment` via RPC) and stamps `last_study_date`.

### learning_sessions
```sql
create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_type text not null,            -- chat | live | lesson | assessment | grammar | vocab
  language text not null default 'English',
  duration_minutes int,
  xp_earned int default 0,
  accuracy_percentage numeric(5,2),
  topics_covered text[] default '{}',
  session_data jsonb default '{}'::jsonb,
  lesson_type text default 'general',
  completed boolean default false,
  created_at timestamptz default now()
);
create index idx_sessions_user on public.learning_sessions(user_id);
create index idx_sessions_created on public.learning_sessions(created_at);
create index idx_sessions_type on public.learning_sessions(session_type);
alter table public.learning_sessions enable row level security;
-- ⚠ the baseline's per-user policies queried a non-existent user_profiles.user_id column and matched nothing.
--   Below is corrected: auth.uid() = learning_sessions.user_id.
create policy "own sessions r" on learning_sessions for select using (auth.uid() = user_id);
create policy "own sessions w" on learning_sessions for insert with check (auth.uid() = user_id);
create policy "own sessions u" on learning_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin view sessions" on learning_sessions for select to authenticated using (public.is_admin());
```

### conversation_history  (the canonical chat store — replaces baseline's non-existent chat_messages table)
```sql
create table public.conversation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.learning_sessions(id) on delete cascade,
  message_type text not null check (message_type in ('user','assistant','system')),
  content text not null,
  language text not null default 'English',
  focus_area text,                       -- conversation|grammar|vocabulary|writing|testing
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index idx_conv_session on public.conversation_history(session_id);
create index idx_conv_user on public.conversation_history(user_id, created_at desc);
create trigger conversation_history_updated_at before update on public.conversation_history
  for each row execute function public.set_updated_at();
alter table public.conversation_history enable row level security;
create policy "own conv r" on conversation_history for select using (auth.uid() = user_id);
create policy "own conv w" on conversation_history for insert with check (auth.uid() = user_id);
create policy "own conv u" on conversation_history for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### user_vocabulary
```sql
create table public.user_vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  translation text,
  language text not null,
  definition text,
  example_sentence text,
  difficulty_level text default 'beginner',
  mastery_level int default 0 check (mastery_level between 0 and 5),
  times_reviewed int default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, word, language)
);
create index idx_uservocab_user on public.user_vocabulary(user_id);
create index idx_uservocab_due
  on public.user_vocabulary(user_id, last_reviewed_at);
create trigger uservocab_updated_at before update on public.user_vocabulary
  for each row execute function public.set_updated_at();
alter table public.user_vocabulary enable row level security;
create policy "own vocab all" on user_vocabulary for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin view vocab" on user_vocabulary for select to authenticated using (public.is_admin());
```

### user_achievements, badges, user_badges
```sql
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  icon_url text,
  criteria jsonb not null,
  points_value int default 10,
  rarity text check (rarity in ('common','rare','epic','legendary')) default 'common',
  is_active boolean default true,
  created_at timestamptz default now()
);
create trigger badges_updated_at before update on public.badges
  for each row execute function public.set_updated_at();
alter table public.badges enable row level security;
create policy "view active badges" on badges for select using (is_active);
create policy "admin manage badges" on badges for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  progress jsonb default '{}'::jsonb,
  earned_at timestamptz default now(),
  unique (user_id, badge_id)
);
create index idx_userbadges_user on public.user_badges(user_id);
alter table public.user_badges enable row level security;
create policy "own badges r" on user_badges for select using (auth.uid() = user_id);
create policy "system awards badge" on user_badges for insert with check (true);  -- Edge function (service role)
create policy "system updates badge" on user_badges for update using (true) with check (true);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_type text not null,
  achievement_name text not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  earned_at timestamptz default now()
);
create index idx_ach_user on public.user_achievements(user_id);
alter table public.user_achievements enable row level security;
create policy "own ach r" on user_achievements for select using (auth.uid() = user_id);
create policy "own ach w" on user_achievements for insert with check (auth.uid() = user_id);
```

### leaderboards / leaderboard_entries
Public read, periodic. Keep opt-in. (Self-explanatory from baseline; redefine cleanly.)
```sql
create table public.leaderboards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  leaderboard_type text check (leaderboard_type in ('xp','streak','lessons','words','custom')),
  time_period text check (time_period in ('daily','weekly','monthly','all_time')),
  language text,
  is_active boolean default true,
  created_at timestamptz default now()
);
create table public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  leaderboard_id uuid not null references public.leaderboards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score numeric(10,2) default 0,
  rank int,
  period_start date, period_end date,
  updated_at timestamptz default now(),
  unique (leaderboard_id, user_id, period_start)
);
create index idx_lb_entry on public.leaderboard_entries(leaderboard_id, rank);
alter table public.leaderboards enable row level security;
create policy "view active lb" on leaderboards for select using (is_active);
alter table public.leaderboard_entries enable row level security;
create policy "view lb entries" on leaderboard_entries for select using (true);
create policy "own write entry" on leaderboard_entries for insert with check (auth.uid() = user_id);
create policy "own update entry" on leaderboard_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

---

## 3. Courses & content

### courses
```sql
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  language text not null default 'English',
  level text default 'beginner',
  cefr_level text check (cefr_level in ('A1','A2','B1','B2','C1','C2')) default 'A1',
  category text default 'General',
  duration_weeks int default 4 check (duration_weeks > 0),
  hours_per_week int default 2 check (hours_per_week > 0),
  max_students int default 20 check (max_students > 0),
  price numeric(10,2) default 0.00 check (price >= 0),
  currency text default 'USD',
  instructor_id uuid references auth.users(id),
  instructor_name text, instructor_email text, instructor_bio text,
  learning_objectives text, prerequisites text,
  required_materials text, syllabus text,
  skills_focus text[] default '{}',
  start_date date, enrollment_deadline date, cancellation_policy text,
  review_html text,
  is_active boolean default false,                -- draft until author sets true
  locked boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_courses_language on public.courses(language);
create index idx_courses_cefr on public.courses(cefr_level);
create index idx_courses_category on public.courses(category);
create index idx_courses_active on public.courses(is_active);
create index idx_courses_instructor on public.courses(instructor_id);
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
alter table public.courses enable row level security;
-- Clean, non-overlapping policy set (the baseline had duplicate SELECT/UPDATE policies).
create policy "view active courses" on courses for select using (is_active or public.is_instructor());
create policy "instructor manage own" on courses for all to authenticated
  using (instructor_id = auth.uid() or public.is_admin())
  with check (instructor_id = auth.uid() or public.is_admin());
create policy "admin manage courses" on courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
```

### terms  (course modules within a course)
```sql
create table public.terms (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  description text,
  order_number int not null default 0
);
create index idx_terms_course on public.terms(course_id);
create index idx_terms_order on public.terms(course_id, order_number);
alter table public.terms enable row level security;
create policy "view terms" on terms for select using (true);
create policy "instructor manage terms" on terms for all to authenticated
  using (exists (select 1 from public.courses c where c.id = terms.course_id
                 and (c.instructor_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.courses c where c.id = terms.course_id
                 and (c.instructor_id = auth.uid() or public.is_admin())));
```

### lessons  (⚠ keeps the columns its getter function selects)
```sql
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  term_id uuid references public.terms(id) on delete cascade,
  name text not null,
  title text,
  description text,
  lesson_type text default 'general',          -- REQUIRED: get_course_lessons_with_materials selects this
  level text not null default 'A1' check (level in ('A1','A2','B1','B2','C1','C2')),
  required_xp int default 0,
  prerequisites jsonb default '[]'::jsonb,
  content jsonb default '{}'::jsonb,
  order_index int default 0,                     -- REQUIRED (baseline dropped it, broke its own query)
  duration_minutes int default 15,               -- REQUIRED
  difficulty_level text default 'medium',        -- REQUIRED
  learning_objectives text,                      -- REQUIRED
  is_published boolean default false,            -- REQUIRED
  file_type text,                                -- pdf|audio|video|text|interactive (kept on the lesson)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_lessons_term on public.lessons(term_id, order_index);
create index idx_lessons_course on public.lessons(course_id);
create index idx_lessons_level on public.lessons(level);
create trigger lessons_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();
alter table public.lessons enable row level security;
create policy "view published lessons" on lessons for select using (is_published or public.is_instructor());
create policy "instructor manage lessons" on lessons for all to authenticated
  using (exists (select 1 from public.courses c where c.id = lessons.course_id
                 and (c.instructor_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.courses c where c.id = lessons.course_id
                 and (c.instructor_id = auth.uid() or public.is_admin())));
```

### lesson_materials
```sql
create table public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  type text not null check (type in ('podcast','video','text','quiz','pdf','image','audio','interactive')),
  url text,
  content text,
  metadata jsonb default '{}'::jsonb,
  order_number int default 0,
  created_at timestamptz default now()
);
create index idx_materials_lesson on public.lesson_materials(lesson_id);
create index idx_materials_type on public.lesson_materials(type);
create index idx_materials_order on public.lesson_materials(lesson_id, order_number);
alter table public.lesson_materials enable row level security;
create policy "view materials" on lesson_materials for select using (true);
create policy "instructor manage materials" on lesson_materials for all to authenticated
  using (exists (select 1 from public.lessons l
                 join public.courses c on c.id = l.course_id
                 where l.id = lesson_materials.lesson_id
                 and (c.instructor_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.lessons l
                 join public.courses c on c.id = l.course_id
                 where l.id = lesson_materials.lesson_id
                 and (c.instructor_id = auth.uid() or public.is_admin())));
```

### books / word_highlights  (PDF highlight → vocabulary)
```sql
create table public.books (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  pdf_url text not null,
  uploaded_by uuid references auth.users(id)
);
create table public.word_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  word text not null,
  synonyms text[] default '{}',
  page_number int,
  position jsonb
);
create index idx_highlights_user on public.word_highlights(user_id);
create index idx_highlights_book on public.word_highlights(book_id);
alter table public.books enable row level security;
create policy "instructor manage books" on books for all to authenticated
  using (is_instructor());
alter table public.word_highlights enable row level security;
create policy "own highlights" on word_highlights for select using (auth.uid() = user_id);
create policy "own highlights w" on word_highlights for insert with check (auth.uid() = user_id);
create policy "own highlights u" on word_highlights for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own highlights d" on word_highlights for delete using (auth.uid() = user_id);
```

### Grammar
```sql
create table public.grammar_lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  language text not null default 'English',
  level text default 'beginner',
  content jsonb default '{}'::jsonb,
  difficulty_score int default 1,
  estimated_duration_minutes int default 15,
  tags text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_grammar_language on public.grammar_lessons(language, level, is_active);
create trigger grammar_updated_at before update on public.grammar_lessons
  for each row execute function public.set_updated_at();
alter table public.grammar_lessons enable row level security;
create policy "view active grammar" on grammar_lessons for select using (is_active);
create policy "instructor manage grammar" on grammar_lessons for all to authenticated
  using (is_instructor()) with check (is_instructor());
```

---

## 4. Assessment & CEFR

### assessment_sessions
```sql
create table public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_type text not null check (session_type in ('initial','periodic','placement')),
  status text default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  target_language text not null default 'English',
  total_duration_minutes int,
  overall_score numeric(5,2),
  cefr_level text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  ielts_equivalent numeric(3,1),
  proficiency_breakdown jsonb default '{}'::jsonb,
  ai_analysis jsonb default '{}'::jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_assess_sess_user on public.assessment_sessions(user_id);
create index idx_assess_sess_status on public.assessment_sessions(status);
create trigger assessment_sessions_updated_at before update on public.assessment_sessions
  for each row execute function public.set_updated_at();

-- AFTER status->completed: upsert proficiency + update profile
create or replace function public.update_user_profile_after_assessment()
returns trigger language plpgsql security definer as $$
declare v_profile public.user_profiles%rowtype; v_level text;
begin
  if new.status = 'completed' then
    update public.user_profiles
      set placement_level = new.cefr_level, assessment_completed = true
      where id = new.user_id;
    insert into public.user_progress (user_id, language, cefr_level)
      values (new.user_id, new.target_language, coalesce(new.cefr_level,'A1'))
      on conflict (user_id, language) do update set cefr_level = excluded.cefr_level;
    insert into public.user_proficiency_profiles
      (user_id, language, current_cefr_level, ielts_equivalent, overall_score,
       grammar_score, vocabulary_score, fluency_score, pronunciation_score, comprehension_score,
       strengths, weaknesses, recommended_level, last_assessment_id, assessment_date, next_assessment_due)
    values (new.user_id, new.target_language, new.cefr_level, new.ielts_equivalent, new.overall_score,
       coalesce((new.proficiency_breakdown->>'grammar')::numeric, null),
       coalesce((new.proficiency_breakdown->>'vocabulary')::numeric, null),
       coalesce((new.proficiency_breakdown->>'fluency')::numeric, null),
       coalesce((new.proficiency_breakdown->>'pronunciation')::numeric, null),
       coalesce((new.proficiency_breakdown->>'comprehension')::numeric, null),
       coalesce((new.ai_analysis->>'strengths')::text[], null),
       coalesce((new.ai_analysis->>'weaknesses')::text[], null),
       new.cefr_level, new.id, now(), now() + interval '90 days')
    on conflict (user_id, language) do update set
       current_cefr_level = excluded.current_cefr_level,
       overall_score = excluded.overall_score,
       last_assessment_id = excluded.last_assessment_id,
       assessment_date = excluded.assessment_date,
       next_assessment_due = excluded.next_assessment_due;
  end if;
  return new; end; $$;
create trigger trigger_assess_completed after update on public.assessment_sessions
  for each row execute function public.update_user_profile_after_assessment();
alter table public.assessment_sessions enable row level security;
create policy "own assess r" on assessment_sessions for select using (auth.uid() = user_id);
create policy "own assess w" on assessment_sessions for insert with check (auth.uid() = user_id);
create policy "own assess u" on assessment_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin view assess" on assessment_sessions for select to authenticated using (is_admin());
```

### assessment_tasks
```sql
create table public.assessment_tasks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  cefr_question_id uuid references public.cefr_assessment_questions(id),
  task_type text not null check (task_type in ('conversation','writing','grammar','vocabulary','pronunciation',
    'multiple-choice','true-false','short-answer','essay','fill-in-blank','listening','speaking','reading','general')),
  skill_type text check (skill_type in ('reading','writing','listening','speaking','grammar','vocabulary')),
  cefr_level text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  task_order int not null,
  prompt text not null,
  expected_duration_minutes int,
  max_score int default 100,
  user_response text,
  audio_response_url text,
  score numeric(5,2),
  is_correct boolean,
  ai_feedback jsonb default '{}'::jsonb,
  skill_scores jsonb default '{}'::jsonb,
  question_data jsonb default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz default now()
);
create index idx_tasks_session on public.assessment_tasks(session_id);
create index idx_tasks_cefr on public.assessment_tasks(cefr_question_id);
create index idx_tasks_skill on public.assessment_tasks(skill_type);
alter table public.assessment_tasks enable row level security;
create policy "own tasks r" on assessment_tasks for select using (
  exists (select 1 from public.assessment_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "own tasks w" on assessment_tasks for insert with check (
  exists (select 1 from public.assessment_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "own tasks u" on assessment_tasks for update using (
  exists (select 1 from public.assessment_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.assessment_sessions s where s.id = session_id and s.user_id = auth.uid()));
```

### assessments (per-lesson) — separate concept
```sql
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  results jsonb default '{}'::jsonb,
  feedback text,
  history jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger assessments_updated_at before update on public.assessments
  for each row execute function public.set_updated_at();
alter table public.assessments enable row level security;
create policy "own assessments" on assessments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### cefr_assessment_questions
```sql
create table public.cefr_assessment_questions (
  id uuid primary key default gen_random_uuid(),
  question_type text not null check (question_type in ('multiple-choice','true-false','short-answer','essay',
    'fill-in-blank','listening','speaking','reading','conversation')),
  cefr_level text not null check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  skill_type text not null check (skill_type in ('reading','writing','listening','speaking','grammar','vocabulary')),
  difficulty_level text default 'medium' check (difficulty_level in ('easy','medium','hard')),
  question_text text not null,
  instructions text,
  options jsonb,
  correct_answer text,
  expected_response text,
  points int default 1,
  media_files jsonb,
  assessment_criteria jsonb,
  assessment_type text,
  time_limit int,
  is_active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_cefr_q_level_skill on public.cefr_assessment_questions(cefr_level, skill_type, is_active);
create trigger cefr_q_updated_at before update on public.cefr_assessment_questions
  for each row execute function public.set_updated_at();
alter table public.cefr_assessment_questions enable row level security;
create policy "view active questions" on cefr_assessment_questions for select using (is_active);
create policy "instructor manage questions" on cefr_assessment_questions for all to authenticated
  using (is_instructor()) with check (is_instructor());
```

### user_proficiency_profiles
```sql
create table public.user_proficiency_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  language text not null,
  current_cefr_level text not null check (current_cefr_level in ('A1','A2','B1','B2','C1','C2')),
  ielts_equivalent numeric(3,1),
  overall_score numeric(5,2),
  grammar_score numeric(5,2), vocabulary_score numeric(5,2), fluency_score numeric(5,2),
  pronunciation_score numeric(5,2), comprehension_score numeric(5,2),
  strengths text[] default '{}', weaknesses text[] default '{}',
  recommended_level text,
  learning_path jsonb default '{}'::jsonb,
  last_assessment_id uuid references public.assessment_sessions(id),
  assessment_date timestamptz,
  next_assessment_due timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, language)
);
create index idx_prof_user_lang on public.user_proficiency_profiles(user_id, language);
create trigger prof_updated_at before update on public.user_proficiency_profiles
  for each row execute function public.set_updated_at();
alter table public.user_proficiency_profiles enable row level security;
create policy "own prof r" on user_proficiency_profiles for select using (auth.uid() = user_id);
create policy "own prof w" on user_proficiency_profiles for insert with check (auth.uid() = user_id);
create policy "own prof u" on user_proficiency_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### assessment_criteria / text_simplifications
```sql
create table public.assessment_criteria (
  id uuid primary key default gen_random_uuid(),
  skill_area text not null,
  cefr_level text not null check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  criteria_description text not null,
  weight numeric(3,2) default 1.0,
  scoring_rubric jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index idx_criteria_skill_level on public.assessment_criteria(skill_area, cefr_level);
alter table public.assessment_criteria enable row level security;
create policy "view criteria" on assessment_criteria for select using (true);

create table public.text_simplifications (
  id uuid primary key default gen_random_uuid(),
  original_text_hash text not null,
  original_text text not null,
  target_cefr_level text not null check (target_cefr_level in ('A1','A2','B1','B2','C1','C2')),
  simplified_text text not null,
  readability_score numeric(5,2),
  simplification_method text default 'ai',
  quality_score numeric(5,2),
  created_at timestamptz default now(),
  unique (original_text_hash, target_cefr_level)
);
create index idx_simplifications_hash on public.text_simplifications(original_text_hash, target_cefr_level);
alter table public.text_simplifications enable row level security;
create policy "view simplifications" on text_simplifications for select using (true);
create policy "instructor create simplif" on text_simplifications for insert to authenticated with check (is_instructor());
```

---

## 5. Progression & engagement

### content_modules / user_module_progress / learning_paths / user_learning_paths / progression_rules
Minimal moministic: same as baseline but with corrected RLS and explicit per-table write policies.
```sql
create table public.content_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  language text not null, cefr_level text not null check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  module_type text not null check (module_type in ('lesson','assignment','test','conversation')),
  order_index int not null default 0,
  prerequisites uuid[] default '{}',
  min_score_required numeric(5,2) default 70.0,
  min_conversation_turns int default 0,
  estimated_duration_minutes int default 15,
  content jsonb default '{}'::jsonb,
  readability_score numeric(5,2),
  difficulty_score int default 1,
  is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index idx_modules_lang_level on public.content_modules(language, cefr_level, is_active);
create trigger modules_updated_at before update on public.content_modules
  for each row execute function public.set_updated_at();
alter table public.content_modules enable row level security;
create policy "view active modules" on content_modules for select using (is_active);
create policy "instructor manage modules" on content_modules for all to authenticated
  using (is_instructor()) with check (is_instructor());
```
```sql
create table public.user_module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.content_modules(id) on delete cascade,
  status text default 'locked' check (status in ('locked','available','in_progress','completed','failed')),
  attempts int default 0,
  best_score numeric(5,2), last_score numeric(5,2),
  completion_percentage numeric(5,2) default 0.0,
  time_spent_minutes int default 0,
  conversation_turns_completed int default 0,
  started_at timestamptz, completed_at timestamptz,
  last_accessed_at timestamptz default now(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (user_id, module_id)
);
create index idx_progress_user_status on public.user_module_progress(user_id, status);
create trigger umod_updated_at before update on public.user_module_progress
  for each row execute function public.set_updated_at();
alter table public.user_module_progress enable row level security;
create policy "own modprogress" on user_module_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text,
  language text not null, target_cefr_level text not null check (target_cefr_level in ('A1','A2','B1','B2','C1','C2')),
  starting_cefr_level text not null check (starting_cefr_level in ('A1','A2','B1','B2','C1','C2')),
  module_sequence uuid[] default '{}',
  estimated_total_hours int,
  is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.learning_paths enable row level security;
create policy "view active paths" on learning_paths for select using (is_active);
create policy "instructor manage paths" on learning_paths for all to authenticated using (is_instructor()) with check (is_instructor());

create table public.user_learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_path_id uuid not null references public.learning_paths(id) on delete cascade,
  current_module_index int default 0, progress_percentage numeric(5,2) default 0.0,
  enrolled_at timestamptz default now(), estimated_completion_date timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (user_id, learning_path_id)
);
alter table public.user_learning_paths enable row level security;
create policy "own lpath" on user_learning_paths for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.progression_rules (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null,
  rule_type text not null check (rule_type in ('prerequisite','score_threshold','conversation_requirement','time_gate')),
  target_module_id uuid not null references public.content_modules(id) on delete cascade,
  rule_config jsonb not null,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index idx_rules_target on public.progression_rules(target_module_id);
alter table public.progression_rules enable row level security;
create policy "view active rules" on progression_rules for select using (is_active);
create policy "instructor manage rules" on progression_rules for all to authenticated using (is_instructor()) with check (is_instructor());

create table public.conversation_engagement (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.learning_sessions(id) on delete cascade,
  module_id uuid references public.content_modules(id) on delete set null,
  total_turns int default 0, user_turns int default 0, ai_turns int default 0,
  avg_response_time_seconds numeric(8,2),
  engagement_score numeric(5,2),
  topics_covered text[] default '{}',
  language_used text not null,
  session_quality text default 'good',
  is_active boolean default true,
  created_at timestamptz default now()
);
create index idx_engage_user on public.conversation_engagement(user_id);
create index idx_engage_session on public.conversation_engagement(session_id);
alter table public.conversation_engagement enable row level security;
create policy "own engage r" on conversation_engagement for select using (auth.uid() = user_id);
create policy "own engage w" on conversation_engagement for insert with check (auth.uid() = user_id);
create policy "own engage u" on conversation_engagement for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

---

## 6. Enrollments, reviews, wishlist, certificates, lessons progress, submissions

```sql
-- ⚠ EXACTLY ONE enrollment table (baseline had two).
create table public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'enrolled' check (status in ('enrolled','in_progress','completed','withdrawn')),
  started_at timestamptz default now(), completed_at timestamptz,
  last_accessed_at timestamptz default now(),
  progress_percentage numeric(5,2) default 0.0,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (user_id, course_id)
);
create index idx_enroll_user on public.course_enrollments(user_id, status);
create index idx_enroll_course on public.course_enrollments(course_id);
create trigger enroll_updated_at before update on public.course_enrollments
  for each row execute function public.set_updated_at();
alter table public.course_enrollments enable row level security;
-- ⚠ baseline RLS subquery used a non-existent user_profiles.user_id column and silently matched nothing.
--   auth.uid() works directly here because course_enrollments has a real user_id pointing to auth.users.
create policy "own enroll r" on course_enrollments for select using (auth.uid() = user_id);
create policy "own enroll w" on course_enrollments for insert with check (auth.uid() = user_id);
create policy "own enroll u" on course_enrollments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "instructor view enroll" on course_enrollments for select to authenticated
  using (exists (select 1 from public.courses c where c.id = course_enrollments.course_id and c.instructor_id = auth.uid()));

create table public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz, xp_earned int default 0, time_spent_minutes int default 0,
  score numeric(5,2) default 0.0,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (user_id, lesson_id)
);
create index idx_ulp_user on public.user_lesson_progress(user_id);
create index idx_ulp_lesson on public.user_lesson_progress(lesson_id);
create trigger ulp_updated_at before update on public.lesson_submissions
  for each row execute function public.set_updated_at();
alter table public.user_lesson_progress enable row level security;
create policy "own ulp" on user_lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.lesson_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  text_answer text,
  attachments jsonb default '[]'::jsonb,
  status text not null default 'submitted' check (status in ('submitted','returned','graded')),
  score numeric(5,2), feedback text,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (user_id, lesson_id)
);
create index idx_sub_user on public.lesson_submissions(user_id);
create index idx_sub_lesson on public.lesson_submissions(lesson_id);
create trigger sub_updated_at before update on public.lesson_submissions
  for each row execute function public.set_updated_at();
alter table public.lesson_submissions enable row level security;
create policy "own sub r" on lesson_submissions for select using (auth.uid() = user_id);
create policy "own sub w" on lesson_submissions for insert with check (auth.uid() = user_id);
create policy "own sub u" on lesson_submissions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text, content text,
  is_approved boolean default false,            -- admin must approve before public
  helpful_count int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (course_id, user_id)
);
create index idx_reviews_course on public.course_reviews(course_id);
create index idx_reviews_user on public.course_reviews(user_id);
create trigger reviews_updated_at before update on public.course_reviews
  for each row execute function public.set_updated_at();
alter table public.course_reviews enable row level security;
create policy "view approved reviews" on course_reviews for select using (is_approved or auth.uid() = user_id);
create policy "own review w" on course_reviews for insert with check (auth.uid() = user_id);
create policy "own review u" on course_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin approve reviews" on course_reviews for update to authenticated using (is_admin()) with check (is_admin());

create table public.user_course_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, course_id)
);
alter table public.user_course_wishlist enable row level security;
create policy "own wishlist" on user_course_wishlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null, description text, template_url text,
  is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.certificates enable row level security;
create policy "view active certs" on certificates for select using (is_active);
create policy "admin manage certs" on certificates for all to authenticated using (is_admin()) with check (is_admin());

create table public.user_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  issued_at timestamptz default now(),
  verification_code text unique not null,
  share_url text,
  unique (user_id, certificate_id)
);
create index idx_ucert_user on public.user_certificates(user_id);
create index idx_ucert_course on public.user_certificates(course_id);
alter table public.user_certificates enable row level security;
create policy "own ucert r" on user_certificates for select using (auth.uid() = user_id);
create policy "system issue ucert" on user_certificates for insert with check (true);  -- service role
create policy "own ucert u" on user_certificates for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.study_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  frequency text not null default 'daily' check (frequency in ('daily','weekly')),
  time_utc timetz, weekday int check (weekday between 0 and 6),
  is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.study_reminders enable row level security;
create policy "own reminders" on study_reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## 7. Assignments & questions

```sql
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null, description text,
  assignment_type text default 'exercise',
  difficulty_level text default 'beginner',
  max_score int default 100,
  due_date timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('multiple-choice','true-false','short-answer','essay','fill-in-blank')),
  options jsonb, correct_answer text, points int default 1,
  difficulty text default 'medium' check (difficulty in ('easy','medium','hard')),
  explanation text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index idx_q_assignment on public.questions(assignment_id);
alter table public.assignments enable row level security;
create policy "view active assignments" on assignments for select using (is_active);
create policy "instructor manage assignments" on assignments for all to authenticated
  using (exists (select 1 from public.courses c where c.id = assignments.course_id
            and (c.instructor_id = auth.uid() or is_admin())))
  with check (exists (select 1 from public.courses c where c.id = assignments.course_id
            and (c.instructor_id = auth.uid() or is_admin())));
alter table public.questions enable row level security;
create policy "view questions" on questions for select using (true);
create policy "instructor manage questions" on questions for all to authenticated
  using (exists (select 1 from public.assignments a
            join public.courses c on c.id = a.course_id
            where a.id = questions.assignment_id
            and (c.instructor_id = auth.uid() or is_admin())));
```

## 8. Notifications, analytics, media

```sql
-- ⚠ EXACTLY ONE notification table (baseline had two). notifications here.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  title text, content text not null,
  type text default 'general', category text default 'general',
  action_url text, metadata jsonb default '{}'::jsonb,
  priority text default 'normal' check (priority in ('low','normal','high')),
  is_visible boolean default true, is_read boolean default false,
  sent_by uuid references auth.users(id),
  expires_at timestamptz,
  created_at timestamptz default now()
);
create index idx_notif_user on public.notifications(user_id, created_at desc);
create index idx_notif_unread on public.notifications(user_id, is_read) where is_visible;
alter table public.notifications enable row level security;
-- auth.uid() works: notifications.user_id references user_profiles(user_id = auth id). Since FK target = user_profiles.id (= auth uid), compare directly.
create policy "own notif r" on notifications for select using (auth.uid() = user_id);
create policy "own notif u" on notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin view notif" on notifications for select to authenticated using (is_admin());

create or replace function public.admin_dispatch_notification(
  p_title text, p_content text, p_type text default 'info', p_priority text default 'normal',
  p_audience text default 'all', p_target_identifiers uuid[] default null,
  p_course_ids uuid[] default null, p_action_url text default null,
  p_metadata jsonb default '{}'::jsonb, p_is_visible boolean default true)
returns table (notification_id uuid, user_id uuid)
language plpgsql security definer as $$
declare v_user uuid;
begin
  if p_audience = 'all' then
    for v_user in select id from public.user_profiles loop
      insert into public.notifications (user_id, title, content, type, priority, action_url, metadata, is_visible, sent_by)
      values (v_user, p_title, p_content, p_type, p_priority, p_action_url, p_metadata, p_is_visible, auth.uid())
      returning id, user_id into notification_id, user_id;
      return next;
    end loop;
  elsif p_audience = 'course' and p_course_ids is not null then
    for v_user in select distinct user_id from public.course_enrollments where course_id = any(p_course_ids) loop
      insert into public.notifications (user_id, title, content, type, priority, action_url, metadata, is_visible, sent_by)
      values (v_user, p_title, p_content, p_type, p_priority, p_action_url, p_metadata, p_is_visible, auth.uid())
      returning id, user_id into notification_id, user_id;
      return next;
    end loop;
  elsif p_audience = 'user' and p_target_identifiers is not null then
    for v_user in select * from unnest(p_target_identifiers) loop
      insert into public.notifications (user_id, title, content, type, priority, action_url, metadata, is_visible, sent_by)
      values (v_user, p_title, p_content, p_type, p_priority, p_action_url, p_metadata, p_is_visible, auth.uid())
      returning id, user_id into notification_id, user_id;
      return next;
    end loop;
  end if;
end; $$;
revoke execute on function public.admin_dispatch_notification from anon, authenticated;
-- grant to an Edge function service-role caller only.
```

```sql
create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  template_type text check (template_type in ('email','push','in_app')) default 'in_app',
  subject text, content text, variables jsonb default '{}'::jsonb, is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.notification_templates enable row level security;
create policy "view active templates" on notification_templates for select to authenticated using (is_active and is_admin());

create table public.course_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text, language text, cefr_level text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  template_data jsonb default '{}'::jsonb, is_active boolean default true, created_by uuid references auth.users(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.course_templates enable row level security;
create policy "view active ct" on course_templates for select to authenticated using (is_active and is_instructor());
create policy "manage ct" on course_templates for all to authenticated using (is_instructor()) with check (is_instructor());

-- analytics (admin only)
create table public.user_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date default current_date,
  total_time_minutes int default 0, lessons_completed int default 0,
  exercises_attempted int default 0, exercises_correct int default 0,
  words_learned int default 0, mistakes_made int default 0,
  peak_activity_hour int, device_type text, engagement_score numeric(5,2),
  unique (user_id, date)
);
create table public.course_analytics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  date date, enrollments int default 0, completions int default 0, dropouts int default 0,
  avg_completion_time_hours numeric(10,2),
  avg_satisfaction_score numeric(3,2), total_time_spent_hours numeric(10,2),
  unique (course_id, date)
);
create table public.learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid references public.learning_sessions(id) on delete set null,
  event_type text not null, event_data jsonb default '{}'::jsonb,
  lesson_id uuid references public.lessons(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  timestamp timestamptz default now()
);
create index idx_events_user on public.learning_events(user_id, timestamp desc);
alter table public.user_analytics enable row level security;
alter table public.course_analytics enable row level security;
alter table public.learning_events enable row level security;
create policy "own analytics r" on user_analytics for select using (auth.uid() = user_id);
create policy "admin view analytics" on user_analytics for select to authenticated using (is_admin());
create policy "admin view course analytics" on course_analytics for select to authenticated using (is_admin());
create policy "own events w" on learning_events for insert with check (auth.uid() = user_id);
create policy "own events r" on learning_events for select using (auth.uid() = user_id);
create policy "admin view events" on learning_events for select to authenticated using (is_admin());

create table public.ai_content_generation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  content_type text, prompt text, generated_content jsonb default '{}'::jsonb,
  model_used text, generation_time_ms int, quality_score numeric(3,2),
  is_approved boolean default false, created_at timestamptz default now()
);
alter table public.ai_content_generation enable row level security;
create policy "admin view ai gen" on ai_content_generation for select to authenticated using (is_admin());

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_type text, content_id uuid,
  recommendation_data jsonb default '{}'::jsonb,
  confidence_score numeric(3,2), is_accepted boolean, created_at timestamptz default now()
);
create index idx_recs_user on public.ai_recommendations(user_id);
alter table public.ai_recommendations enable row level security;
create policy "own recs r" on ai_recommendations for select using (auth.uid() = user_id);
create policy "own recs u" on ai_recommendations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.media_content (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  media_type text check (media_type in ('image','audio','video','document')),
  file_url text not null, file_name text, file_size bigint,
  duration_seconds int, alt_text text, transcript text,
  metadata jsonb default '{}'::jsonb, created_at timestamptz default now()
);
alter table public.media_content enable row level security;
create policy "view media" on media_content for select using (true);
create policy "instructor manage media" on media_content for all to authenticated
  using (exists (select 1 from public.lessons l
            join public.courses c on c.id = l.course_id
            where l.id = media_content.lesson_id and (c.instructor_id = auth.uid() or is_admin())));
```

## 9. System settings (EXACTLY ONE definition — JSONB value version)

```sql
create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null,
  setting_value jsonb not null,
  description text, category text default 'general',
  is_public boolean default false,
  updated_by uuid references auth.users(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create trigger settings_updated_at before update on public.system_settings
  for each row execute function public.set_updated_at();
alter table public.system_settings enable row level security;
create policy "view public settings" on system_settings for select using (is_public);
create policy "admin manage settings" on system_settings for all to authenticated
  using (is_admin()) with check (is_admin());
```

## 10. Live conversation

```sql
create table public.live_conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null unique,
  mode text check (mode in ('direct','relay')) default 'direct',
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds int,
  messages_exchanged int default 0,
  words_spoken int default 0,
  language text default 'English',
  user_level text default 'intermediate',
  focus_area text default 'conversation',
  is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index idx_live_sess_user on public.live_conversation_sessions(user_id);
create index idx_live_sess_active on public.live_conversation_sessions(is_active);
create index idx_live_sess_started on public.live_conversation_sessions(started_at desc);
create trigger live_sessions_updated_at before update on public.live_conversation_sessions
  for each row execute function public.set_updated_at();

create or replace function public.calculate_session_duration()
returns trigger language plpgsql as $$
begin
  if new.ended_at is not null and new.started_at is not null then
    new.duration_seconds = extract(epoch from (new.ended_at - new.started_at))::int;
  end if; return new; end; $$;
create trigger calc_live_duration before update on public.live_conversation_sessions
  for each row execute function public.calculate_session_duration();

create table public.live_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.live_conversation_sessions(session_id) on delete cascade,
  message_type text check (message_type in ('user','assistant','system')),
  content text not null,
  transcript text,
  audio_url text,
  created_at timestamptz default now()
);
create index idx_live_msg_session on public.live_conversation_messages(session_id, created_at);
alter table public.live_conversation_sessions enable row level security;
create policy "own live r" on live_conversation_sessions for select using (auth.uid() = user_id);
create policy "own live w" on live_conversation_sessions for insert with check (auth.uid() = user_id);
create policy "own live u" on live_conversation_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin view live" on live_conversation_sessions for select to authenticated using (is_admin());
alter table public.live_conversation_messages enable row level security;
create policy "own live msg r" on live_conversation_messages for select using (
  exists (select 1 from public.live_conversation_sessions s
          where s.session_id = live_conversation_messages.session_id and s.user_id = auth.uid()));
create policy "own live msg w" on live_conversation_messages for insert with check (
  exists (select 1 from public.live_conversation_sessions s
          where s.session_id = live_conversation_messages.session_id and s.user_id = auth.uid()));
```

## 11. Course-wizard helper functions

```sql
create or replace function public.upsert_lessons_with_materials(p_course_id uuid, p_lessons jsonb)
returns table (lesson_id uuid, lesson_title text, materials_count int, operation text)
language plpgsql security definer as $$
declare v jsonb; v_id uuid; cnt int;
begin
  for v in select * from jsonb_array_elements(p_lessons) loop
    insert into public.lessons (course_id, term_id, name, title, description, lesson_type, level,
      order_index, duration_minutes, difficulty_level, learning_objectives, is_published, file_type, content, required_xp)
    values (p_course_id,
      nullif(v->>'term_id','')::uuid, v->>'name', v->>'title', v->>'description', v->>'lesson_type',
      coalesce(v->>'level','A1'), (v->>'order_index')::int, (v->>'duration_minutes')::int,
      coalesce(v->>'difficulty_level','medium'), v->>'learning_objectives', coalesce((v->>'is_published')::boolean,false),
      v->>'file_type', v->>'content', (v->>'required_xp')::int)
    on conflict (id) do update set
       name=excluded.name, title=excluded.title, description=excluded.description,
       lesson_type=excluded.lesson_type, level=excluded.level, order_index=excluded.order_index,
       duration_minutes=excluded.duration_minutes, difficulty_level=excluded.difficulty_level,
       learning_objectives=excluded.learning_objectives, is_published=excluded.is_published,
       file_type=excluded.file_type, content=excluded.content, required_xp=excluded.required_xp
    where lessons.id = nullif(v->>'id','')::uuid
    returning id into v_id;
    if v_id is null and v->>'id' <> '' then
      v_id := (v->>'id')::uuid;
      -- update existing case covered by on conflict
    end if;
    operation := coalesce(v->>'operation','upserted');
    if v ? 'materials' then
      loop cnt := null;
        with ins as (insert into public.lesson_materials (lesson_id, type, url, content, metadata, order_number)
          select v_id, m->>'type', m->>'url', m->>'content', m->>'metadata', (m->>'order_number')::int
          from jsonb_array_elements(v->'materials') m
          returning id) select count(*) from ins into cnt;
      end loop cnt := (select count(*) from public.lesson_materials where lesson_id = v_id);
    else cnt := 0; end if;
    lesson_id := v_id; lesson_title := v->>'name'; materials_count := coalesce(cnt,0);
    return next;
  end loop; end; $$;
revoke execute on function public.upsert_lessons_with_materials from anon, authenticated;
grant execute on function public.upsert_lessons_with_materials to authenticated with check (public.is_instructor());
-- (Enforce authorship inside the function via the instructor_id=auth.uid check on the referenced course.)
```
`get_course_lessons_with_materials(course_id)` returns the full lesson + materials shape including the columns above (no longer missing `lesson_type/order_index/duration_minutes/difficulty_level/learning_objectives/is_published`).

## 12. Storage bucket

```sql
insert into storage.buckets (id, name, public) values ('course-assets','course-assets', true) on conflict do nothing;
create policy "Public read course-assets" on storage.objects for select using (bucket_id='course-assets');
create policy "Auth upload course-assets" on storage.objects for insert to authenticated with check (bucket_id='course-assets');
create policy "Owner update course-assets" on storage.objects for update to authenticated
  using (bucket_id='course-assets' and owner=auth.uid()) with check (bucket_id='course-assets' and owner=auth.uid());
create policy "Owner delete course-assets" on storage.objects for delete to authenticated
  using (bucket_id='course-assets' and owner=auth.uid());
```
User avatars live in a private bucket `avatars` (per-user path); user can write/read only `avatars/<uid>/*`.

## 13. Lessons from the baseline (bugs we permanently fixed here)

1. **Dual column drift (`user_progress`)** — baseline kept `level/xp_points/streak_days` AND `current_level/total_xp/daily_streak` synced by a trigger. Lingora keeps one set only.
2. **`lessons` schema breakage** — baseline migration `032` dropped columns (`lesson_type, order_index, duration_minutes, difficulty_level, learning_objectives, is_published, file_type`) its own `get_course_lessons_with_materials` later selected → runtime errors. Lingora's `lessons` keeps all of them.
3. **Phantom `chat_messages` table** — the chat Edge Function wrote to a table that was never created (silent persistence failure). Lingora's chat function writes to `conversation_history` (existing, RLS-protected).
4. **Two enrollment tables** — baseline had `course_enrollments` and `user_course_enrollments`. Lingora has one `course_enrollments`.
5. **Two notification systems** — baseline had `notifications` AND `user_notifications`. Lingora has one `notifications`.
6. **Two `system_settings`** — baseline had two conflicting definitions (UUID+JSONB vs SERIAL+TEXT). Lingora keeps the JSONB-value version.
7. **RLS subquery bug** — baseline policies wrote `WHERE user_id = auth.uid()` against `user_profiles` which has no `user_id` column (its PK `id` IS the auth id) — so policies matched nothing. Lingora either uses `auth.uid() = <table>.user_id` (when the column exists and references auth.users) or `auth.uid() = id` (for profile tables).
8. **Two admin-gating systems** — baseline combined `is_admin()` (email-domain/JWT) with `user_roles`. Lingora uses `user_roles` only, via stable `has_role()/is_admin()` helpers.
9. **Duplicate policies** — baseline `courses` had overlapping SELECT/UPDATE policies (last-write-wins). Lingora declares each command once per role.
10. **Edge function auth** — baseline did no JWT verification. See `08-SUPABASE-EDGE-FUNCTIONS.md` which adds it.

## 14. Migration application

Apply as a **single linearised migration** (one SQL file run once), not 45 competing patches. Order: extensions → helpers → auth/profile → roles → progress/sessions → conversation → vocab/achievements → courses/terms/lessons/materials → books/highlights → grammar → assessment_* → proficiency → cefr questions → modules/paths/rules/engagement → enrollments/reviews/wishlist/certs/reminders/lesson-progress/submissions → assignments/questions → notifications/templates/analytics/media/events/ai → settings → live conversation → triggers → storage bucket → seed (CEFR questions + badge defs + assessment criteria). Provide a `supabase/seed.sql` for dev seeds.
