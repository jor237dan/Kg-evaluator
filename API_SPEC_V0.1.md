# API_SPEC_V0.1 — Endpoints MVP

Base path proposée: `/api/v1`
Format: JSON
Auth: JWT Bearer Token

## 1) Authentification

### POST `/auth/register`
Crée un compte utilisateur.
- Body: `{ email, password, fullName, role? }`
- Response: `{ userId, token }`

### POST `/auth/login`
Connexion utilisateur.
- Body: `{ email, password }`
- Response: `{ userId, token, profile }`

### GET `/auth/me`
Retourne le profil courant.
- Headers: `Authorization: Bearer <token>`
- Response: `{ user, studentProfile }`

## 2) Profil élève

### PUT `/students/profile`
Met à jour track, classe, langue.
- Body: `{ educationTrack, classLevel, preferredLanguage, timezone }`
- Response: `{ profile }`

## 3) Catalogue pédagogique

### GET `/subjects`
Liste des matières actives.
- Query: `lang=fr|en`
- Response: `[{ id, code, name }]`

### GET `/chapters`
Liste des chapitres filtrée.
- Query: `subjectId`, `classLevel`, `educationTrack`, `lang`
- Response: `[{ id, title, difficulty, estimatedMinutes }]`

### GET `/chapters/:chapterId/summary`
Résumé court/long d’un chapitre.
- Query: `lang=fr|en`, `mode=short|long`
- Response: `{ chapterId, mode, text, keyPoints[] }`

## 4) Quiz

### POST `/chapters/:chapterId/quizzes/generate`
Génère un quiz pour un chapitre.
- Body: `{ lang, level, questionCount }`
- Response: `{ quizId, questionCount }`

### GET `/quizzes/:quizId`
Récupère le quiz.
- Response: `{ quizId, title, level, questions[] }`

### POST `/quizzes/:quizId/attempts`
Soumet les réponses d’un utilisateur.
- Body: `{ answers: [{ questionId, userAnswer }] }`
- Response: `{ attemptId, score, corrections[] }`

## 5) Flashcards

### GET `/chapters/:chapterId/flashcards`
Retourne les flashcards d’un chapitre.
- Query: `lang=fr|en`
- Response: `{ setId, title, cards: [{ id, front, back, hint }] }`

## 6) Explications pas à pas

### GET `/chapters/:chapterId/step-by-step`
Retourne une solution guidée (maths/physique).
- Query: `lang=fr|en`
- Response: `{ problemStatement, steps[], commonMistakes[] }`

## 7) Progression

### GET `/progress/chapters`
Progression de l’élève par chapitre.
- Query: `subjectId?`
- Response: `[{ chapterId, masteryScore, needsReview, lastActivityAt }]`

### GET `/progress/overview`
Vue globale par matière.
- Response: `[{ subjectId, averageMastery, chaptersCompleted, weakChapters[] }]`

## 8) Sessions d’étude

### POST `/study-sessions`
Crée une session de révision.
- Body: `{ chapterId, sessionType, startedAt }`
- Response: `{ sessionId }`

### PATCH `/study-sessions/:sessionId/finish`
Termine une session.
- Body: `{ endedAt, progressDelta }`
- Response: `{ sessionId, durationSeconds }`

## 9) Codes d’erreur standards
- `400 BAD_REQUEST` : payload invalide
- `401 UNAUTHORIZED` : token absent/invalide
- `403 FORBIDDEN` : accès interdit
- `404 NOT_FOUND` : ressource introuvable
- `409 CONFLICT` : conflit métier (ex: email déjà utilisé)
- `422 UNPROCESSABLE_ENTITY` : validation métier
- `500 INTERNAL_SERVER_ERROR` : erreur serveur

## 10) Priorité d’implémentation API (Sprint 1)
1. Auth (`/auth/register`, `/auth/login`, `/auth/me`)
2. Profil (`/students/profile`)
3. Catalogue (`/subjects`, `/chapters`, `/summary`)
4. Quiz (`generate`, `get`, `submit attempts`)
5. Progression (`/progress/chapters`, `/progress/overview`)
6. Flashcards + Step-by-step
