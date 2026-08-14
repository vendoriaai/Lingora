-- ─────────────────────────────────────────────────────────────────────
-- Lingora — dev seed. Run after 0000_init.sql (npm run db:seed).
-- Includes: a handful of CEFR questions, badge defs, assessment criteria,
-- and one sample course so the empty app has visible content.
-- Idempotent-ish: uses ON CONFLICT where possible.
-- ─────────────────────────────────────────────────────────────────────

-- Sample CEFR questions (A1 grammar, B1 reading, A2 vocabulary).
insert into public.cefr_assessment_questions
  (question_type, cefr_level, skill_type, difficulty_level, question_text, options, correct_answer, points, is_active)
values
  ('multiple-choice','A1','grammar','easy',
   'Choose the correct article: ___ apple',
   '["a","an","the","-"]', 'an', 1, true),
  ('multiple-choice','A2','vocabulary','easy',
   'What does "to book a room" mean?',
   '["To reserve a room","To clean a room","To paint a room","To leave a room"]',
   'To reserve a room', 1, true),
  ('multiple-choice','B1','reading','medium',
   'Choose the best synonym for "significant" in: "a significant change"',
   '["small","important","rare","sudden"]',
   'important', 1, true),
  ('true-false','A2','grammar','easy',
   'True or false: "She don''t like coffee" is grammatically correct.',
   '["true","false"]', 'false', 1, true),
  ('fill-in-blank','B1','vocabulary','medium',
   'Complete: "I have been studying English ___ three years."',
   null, 'for', 2, true)
on conflict do nothing;

-- Badge definitions (the gamification catalogue).
insert into public.badges (name, description, criteria, points_value, rarity, is_active) values
  ('First Words',   'Saved your first 10 vocabulary words.',
   '{"event":"vocab_saved","threshold":10}'::jsonb, 10, 'common', true),
  ('Streak Starter','Maintained a 3-day streak.',
   '{"event":"streak","threshold":3}'::jsonb, 15, 'common', true),
  ('Conversation Curveball', 'Completed 50 live turns.',
   '{"event":"live_turns","threshold":50}'::jsonb, 25, 'rare', true),
  ('CEFR Jumper','Moved up one CEFR sub-level.',
   '{"event":"cefr_up","threshold":1}'::jsonb, 50, 'epic', true),
  ('Course Conqueror','Completed a full course.',
   '{"event":"course_complete","threshold":1}'::jsonb, 100, 'legendary', true)
on conflict (name) do nothing;

-- Assessment criteria rubrics (one per skill × a couple CEFR levels).
insert into public.assessment_criteria (skill_area, cefr_level, criteria_description, weight, scoring_rubric) values
  ('grammar','A1','Subject–verb agreement; correct article use.', 1.0,
   '{"0":"cannot form simple sentences","1":"frequent errors","2":"usually correct"}'::jsonb),
  ('grammar','B1','Mixed tenses; conditionals.', 1.0,
   '{"0":"errors block meaning","1":"some errors","2":"fluent"}'::jsonb),
  ('vocabulary','A2','Everyday vocabulary; collocations.', 1.0,
   '{"0":"limited","1":"adequate","2":"varied"}'::jsonb),
  ('fluency','B1','Hesitation; continuity; pace.', 1.0,
   '{"0":"frequent long pauses","1":"some","2":"natural"}'::jsonb)
on conflict do nothing;

-- One sample course (draft → publish so it shows in the catalog).
insert into public.courses
  (title, description, language, cefr_level, category, duration_weeks, hours_per_week,
   is_active, learning_objectives, syllabus)
values
  ('Everyday English — Speaking Foundations',
   'A voice-first starter course: order food, make small talk, book a room.',
   'English', 'A1', 'General', 4, 3, true,
   'Hold a 2-minute everyday conversation; use 50 high-frequency phrases.',
   '[{"week":1,"topic":"Greetings & introductions"},{"week":2,"topic":"Ordering food & drinks"},{"week":3,"topic":"At the hotel"},{"week":4,"topic":"Small talk review"}]'::jsonb)
on conflict do nothing;

-- Public system settings.
insert into public.system_settings (setting_key, setting_value, description, category, is_public) values
  ('daily_ai_token_budget', '250000', 'Per-user daily Gemini token budget (soft).', 'ai', true),
  ('default_focus_area', '"conversation"', 'Default AI tutor focus.', 'ai', true),
  ('min_xp_per_lesson', '10', 'Minimum XP awarded per completed lesson.', 'game', true)
on conflict (setting_key) do nothing;
