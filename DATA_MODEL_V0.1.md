# DATA_MODEL_V0.1 — Modèle de données MVP

## 1) Objectif
Définir un schéma minimal pour supporter le MVP de la plateforme de révision (FR/EN, 5 matières, suivi de progression, quiz, flashcards, explications pas à pas).

## 2) Entités principales

## 2.1 `users`
- `id` (UUID, PK)
- `email` (VARCHAR, unique)
- `password_hash` (VARCHAR)
- `full_name` (VARCHAR)
- `role` (ENUM: `student`, `admin`)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 2.2 `student_profiles`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id, unique)
- `education_track` (ENUM: `francophone`, `anglophone`)
- `class_level` (VARCHAR) — ex: `6e`, `3e`, `Terminale`, `Form 5`
- `preferred_language` (ENUM: `fr`, `en`)
- `timezone` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 2.3 `subjects`
- `id` (UUID, PK)
- `code` (VARCHAR, unique) — ex: `MATH`, `PHY`, `HIST`, `FR`, `EN`
- `name_fr` (VARCHAR)
- `name_en` (VARCHAR)
- `is_active` (BOOLEAN)

## 2.4 `chapters`
- `id` (UUID, PK)
- `subject_id` (UUID, FK -> subjects.id)
- `education_track` (ENUM: `francophone`, `anglophone`, `both`)
- `class_level` (VARCHAR)
- `title_fr` (VARCHAR)
- `title_en` (VARCHAR)
- `difficulty` (ENUM: `easy`, `medium`, `hard`)
- `estimated_minutes` (INT) — cible de révision, ex: 30
- `is_published` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 2.5 `chapter_contents`
- `id` (UUID, PK)
- `chapter_id` (UUID, FK -> chapters.id)
- `content_type` (ENUM: `summary_short`, `summary_long`, `flashcards_set`, `worked_example`, `exercise_set`)
- `language` (ENUM: `fr`, `en`)
- `payload_json` (JSONB)
- `version` (INT)
- `created_at` (TIMESTAMP)

## 2.6 `quizzes`
- `id` (UUID, PK)
- `chapter_id` (UUID, FK -> chapters.id)
- `language` (ENUM: `fr`, `en`)
- `level` (ENUM: `easy`, `medium`, `hard`)
- `title` (VARCHAR)
- `is_generated` (BOOLEAN)
- `created_at` (TIMESTAMP)

## 2.7 `quiz_questions`
- `id` (UUID, PK)
- `quiz_id` (UUID, FK -> quizzes.id)
- `question_type` (ENUM: `mcq`, `short_answer`)
- `prompt` (TEXT)
- `options_json` (JSONB, nullable)
- `correct_answer` (TEXT)
- `explanation` (TEXT)
- `order_index` (INT)

## 2.8 `quiz_attempts`
- `id` (UUID, PK)
- `quiz_id` (UUID, FK -> quizzes.id)
- `user_id` (UUID, FK -> users.id)
- `score` (DECIMAL(5,2))
- `started_at` (TIMESTAMP)
- `submitted_at` (TIMESTAMP)
- `duration_seconds` (INT)

## 2.9 `quiz_attempt_answers`
- `id` (UUID, PK)
- `attempt_id` (UUID, FK -> quiz_attempts.id)
- `question_id` (UUID, FK -> quiz_questions.id)
- `user_answer` (TEXT)
- `is_correct` (BOOLEAN)
- `feedback` (TEXT)

## 2.10 `flashcard_sets`
- `id` (UUID, PK)
- `chapter_id` (UUID, FK -> chapters.id)
- `language` (ENUM: `fr`, `en`)
- `title` (VARCHAR)
- `created_at` (TIMESTAMP)

## 2.11 `flashcards`
- `id` (UUID, PK)
- `set_id` (UUID, FK -> flashcard_sets.id)
- `front_text` (TEXT)
- `back_text` (TEXT)
- `hint` (TEXT, nullable)
- `order_index` (INT)

## 2.12 `step_by_step_solutions`
- `id` (UUID, PK)
- `chapter_id` (UUID, FK -> chapters.id)
- `language` (ENUM: `fr`, `en`)
- `problem_statement` (TEXT)
- `steps_json` (JSONB) — liste structurée des étapes
- `common_mistakes_json` (JSONB)
- `created_at` (TIMESTAMP)

## 2.13 `study_sessions`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `chapter_id` (UUID, FK -> chapters.id)
- `session_type` (ENUM: `summary`, `quiz`, `flashcards`, `exercise`, `exam_mode`)
- `started_at` (TIMESTAMP)
- `ended_at` (TIMESTAMP)
- `progress_delta` (DECIMAL(5,2))

## 2.14 `progress_by_chapter`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `chapter_id` (UUID, FK -> chapters.id)
- `mastery_score` (DECIMAL(5,2))
- `last_activity_at` (TIMESTAMP)
- `needs_review` (BOOLEAN)
- UNIQUE(`user_id`, `chapter_id`)

## 3) Relations clés
- Un `user` a un `student_profile`.
- Un `subject` a plusieurs `chapters`.
- Un `chapter` peut avoir plusieurs `chapter_contents`, `quizzes`, `flashcard_sets`, `step_by_step_solutions`.
- Un `quiz` a plusieurs `quiz_questions` et `quiz_attempts`.
- Un `quiz_attempt` a plusieurs `quiz_attempt_answers`.
- La progression est stockée au niveau `progress_by_chapter`.

## 4) Index recommandés
- `users(email)` unique
- `chapters(subject_id, class_level, education_track)`
- `quizzes(chapter_id, level, language)`
- `quiz_attempts(user_id, submitted_at DESC)`
- `study_sessions(user_id, started_at DESC)`
- `progress_by_chapter(user_id, mastery_score)`

## 5) Règles métier MVP
1. Un élève ne peut passer qu’un quiz publié lié à un chapitre publié.
2. Le score de maîtrise (`mastery_score`) est recalculé après chaque tentative quiz/exercice.
3. Les contenus doivent exister en FR et/ou EN selon le track ciblé.
4. Pour Maths/Physique, au moins une `step_by_step_solutions` doit être disponible par chapitre publié.

## 6) Évolution prévue (v0.2+)
- Table `teacher_profiles` et classes virtuelles.
- Table `recommendations` (chapitre conseillé automatiquement).
- Table `notifications` (rappels de révision).
- Event sourcing léger pour analytics pédagogique avancée.
