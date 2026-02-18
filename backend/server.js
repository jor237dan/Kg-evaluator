const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;

const db = {
  users: [],
  profiles: [],
  subjects: [
    { id: 'sub-math', code: 'MATH', name_fr: 'Mathématiques', name_en: 'Mathematics' },
    { id: 'sub-phy', code: 'PHY', name_fr: 'Physique', name_en: 'Physics' },
    { id: 'sub-hist', code: 'HIST', name_fr: 'Histoire', name_en: 'History' },
    { id: 'sub-fr', code: 'FR', name_fr: 'Français', name_en: 'French' },
    { id: 'sub-en', code: 'EN', name_fr: 'Anglais', name_en: 'English' }
  ],
  chapters: [
    { id: 'chap-1', subjectId: 'sub-math', classLevel: 'Terminale', educationTrack: 'francophone', title_fr: 'Fonctions et limites', title_en: 'Functions and limits', difficulty: 'medium', estimatedMinutes: 30 },
    { id: 'chap-2', subjectId: 'sub-phy', classLevel: 'Terminale', educationTrack: 'francophone', title_fr: 'Mécanique', title_en: 'Mechanics', difficulty: 'medium', estimatedMinutes: 30 }
  ],
  quizzes: [],
  attempts: [],
  progress: []
};

const tokens = new Map();

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function createToken(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, userId);
  return token;
}

function getAuthUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token || !tokens.has(token)) return null;
  const userId = tokens.get(token);
  return db.users.find((u) => u.id === userId) || null;
}

function requireAuth(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    send(res, 401, { error: 'UNAUTHORIZED' });
    return null;
  }
  return user;
}

function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;


  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    const filePath = path.join(__dirname, 'public', 'index.html');
    try {
      const html = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    } catch (err) {
      return send(res, 500, { error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  if (req.method === 'GET' && pathname === '/project-status') {
    const status = {
      projectPath: process.cwd(),
      docs: {
        cahier: fs.existsSync(path.join(__dirname, '..', 'CAHIER_DES_CHARGES_V0.1.md')),
        plan: fs.existsSync(path.join(__dirname, '..', 'PLAN_ACTION_V0.2.md')),
        dataModel: fs.existsSync(path.join(__dirname, '..', 'DATA_MODEL_V0.1.md')),
        apiSpec: fs.existsSync(path.join(__dirname, '..', 'API_SPEC_V0.1.md')),
        prompts: fs.existsSync(path.join(__dirname, '..', 'PROMPTS_PEDAGO_V0.1.md'))
      },
      app: {
        demoUi: 'http://localhost:' + PORT + '/',
        health: 'http://localhost:' + PORT + '/health'
      },
      timestamp: new Date().toISOString()
    };
    return send(res, 200, status);
  }

  if (req.method === 'GET' && pathname === '/health') {
    return send(res, 200, { status: 'ok' });
  }

  if (req.method === 'POST' && pathname === '/api/v1/auth/register') {
    return readJson(req)
      .then(({ email, password, fullName, role = 'student' }) => {
        if (!email || !password || !fullName) return send(res, 400, { error: 'BAD_REQUEST' });
        if (db.users.some((u) => u.email === email)) return send(res, 409, { error: 'CONFLICT' });

        const user = { id: `u-${crypto.randomUUID()}`, email, passwordHash: `plain:${password}`, fullName, role };
        db.users.push(user);
        const token = createToken(user.id);
        return send(res, 201, { userId: user.id, token });
      })
      .catch(() => send(res, 400, { error: 'BAD_REQUEST' }));
  }

  if (req.method === 'POST' && pathname === '/api/v1/auth/login') {
    return readJson(req)
      .then(({ email, password }) => {
        const user = db.users.find((u) => u.email === email && u.passwordHash === `plain:${password}`);
        if (!user) return send(res, 401, { error: 'UNAUTHORIZED' });
        const token = createToken(user.id);
        const profile = db.profiles.find((p) => p.userId === user.id) || null;
        return send(res, 200, { userId: user.id, token, profile });
      })
      .catch(() => send(res, 400, { error: 'BAD_REQUEST' }));
  }

  if (req.method === 'GET' && pathname === '/api/v1/auth/me') {
    const user = requireAuth(req, res);
    if (!user) return;
    const profile = db.profiles.find((p) => p.userId === user.id) || null;
    return send(res, 200, { user: { id: user.id, email: user.email, fullName: user.fullName }, studentProfile: profile });
  }

  if (req.method === 'PUT' && pathname === '/api/v1/students/profile') {
    const user = requireAuth(req, res);
    if (!user) return;
    return readJson(req)
      .then(({ educationTrack, classLevel, preferredLanguage, timezone = 'Africa/Douala' }) => {
        if (!educationTrack || !classLevel || !preferredLanguage) return send(res, 400, { error: 'BAD_REQUEST' });
        const existing = db.profiles.find((p) => p.userId === user.id);
        const profile = {
          id: existing?.id || `sp-${crypto.randomUUID()}`,
          userId: user.id,
          educationTrack,
          classLevel,
          preferredLanguage,
          timezone
        };

        if (existing) Object.assign(existing, profile);
        else db.profiles.push(profile);

        return send(res, 200, { profile });
      })
      .catch(() => send(res, 400, { error: 'BAD_REQUEST' }));
  }

  if (req.method === 'GET' && pathname === '/api/v1/subjects') {
    const lang = url.searchParams.get('lang') || 'fr';
    return send(
      res,
      200,
      db.subjects.map((s) => ({ id: s.id, code: s.code, name: lang === 'en' ? s.name_en : s.name_fr }))
    );
  }

  if (req.method === 'GET' && pathname === '/api/v1/chapters') {
    const subjectId = url.searchParams.get('subjectId');
    const classLevel = url.searchParams.get('classLevel');
    const educationTrack = url.searchParams.get('educationTrack');
    const lang = url.searchParams.get('lang') || 'fr';

    const rows = db.chapters
      .filter((c) => !subjectId || c.subjectId === subjectId)
      .filter((c) => !classLevel || c.classLevel === classLevel)
      .filter((c) => !educationTrack || c.educationTrack === educationTrack)
      .map((c) => ({
        id: c.id,
        title: lang === 'en' ? c.title_en : c.title_fr,
        difficulty: c.difficulty,
        estimatedMinutes: c.estimatedMinutes
      }));

    return send(res, 200, rows);
  }

  if (req.method === 'GET' && pathname.startsWith('/api/v1/chapters/') && pathname.endsWith('/summary')) {
    const chapterId = pathname.split('/')[4];
    const mode = url.searchParams.get('mode') || 'short';
    const lang = url.searchParams.get('lang') || 'fr';
    const chapter = db.chapters.find((c) => c.id === chapterId);
    if (!chapter) return send(res, 404, { error: 'NOT_FOUND' });

    const text =
      lang === 'en'
        ? `Summary (${mode}) for ${chapter.title_en}.`
        : `Résumé (${mode}) pour ${chapter.title_fr}.`;

    return send(res, 200, { chapterId, mode, text, keyPoints: ['Point 1', 'Point 2', 'Point 3'] });
  }

  if (req.method === 'POST' && pathname.startsWith('/api/v1/chapters/') && pathname.endsWith('/quizzes/generate')) {
    const user = requireAuth(req, res);
    if (!user) return;
    const chapterId = pathname.split('/')[4];
    const chapter = db.chapters.find((c) => c.id === chapterId);
    if (!chapter) return send(res, 404, { error: 'NOT_FOUND' });

    return readJson(req)
      .then(({ lang = 'fr', level = 'medium', questionCount = 8 }) => {
        const quizId = `q-${crypto.randomUUID()}`;
        db.quizzes.push({ id: quizId, chapterId, lang, level, questionCount });
        return send(res, 201, { quizId, questionCount });
      })
      .catch(() => send(res, 400, { error: 'BAD_REQUEST' }));
  }

  if (req.method === 'GET' && pathname.startsWith('/api/v1/quizzes/')) {
    const quizId = pathname.split('/')[4];
    const quiz = db.quizzes.find((q) => q.id === quizId);
    if (!quiz) return send(res, 404, { error: 'NOT_FOUND' });

    const questions = Array.from({ length: quiz.questionCount }).map((_, i) => ({
      questionId: `${quizId}-qq-${i + 1}`,
      type: i < 6 ? 'mcq' : 'short_answer',
      prompt: `Question ${i + 1}`,
      options: i < 6 ? ['A', 'B', 'C', 'D'] : undefined
    }));

    return send(res, 200, { quizId, title: 'Quiz généré', level: quiz.level, questions });
  }

  if (req.method === 'POST' && pathname.startsWith('/api/v1/quizzes/') && pathname.endsWith('/attempts')) {
    const user = requireAuth(req, res);
    if (!user) return;
    const quizId = pathname.split('/')[4];
    const quiz = db.quizzes.find((q) => q.id === quizId);
    if (!quiz) return send(res, 404, { error: 'NOT_FOUND' });

    return readJson(req)
      .then(({ answers = [] }) => {
        const score = Math.min(100, Math.round((answers.length / Math.max(quiz.questionCount, 1)) * 100));
        const attemptId = `a-${crypto.randomUUID()}`;
        db.attempts.push({ id: attemptId, quizId, userId: user.id, score });

        const existing = db.progress.find((p) => p.userId === user.id && p.chapterId === quiz.chapterId);
        const masteryScore = existing ? Math.round((existing.masteryScore + score) / 2) : score;
        if (existing) existing.masteryScore = masteryScore;
        else db.progress.push({ userId: user.id, chapterId: quiz.chapterId, masteryScore, needsReview: masteryScore < 50, lastActivityAt: new Date().toISOString() });

        return send(res, 200, { attemptId, score, corrections: [] });
      })
      .catch(() => send(res, 400, { error: 'BAD_REQUEST' }));
  }

  if (req.method === 'GET' && pathname.startsWith('/api/v1/chapters/') && pathname.endsWith('/flashcards')) {
    const chapterId = pathname.split('/')[4];
    const chapter = db.chapters.find((c) => c.id === chapterId);
    if (!chapter) return send(res, 404, { error: 'NOT_FOUND' });

    return send(res, 200, {
      setId: `f-${chapterId}`,
      title: 'Flashcards de révision',
      cards: [
        { id: '1', front: 'Définition clé', back: 'Réponse courte', hint: 'Pense au cours' },
        { id: '2', front: 'Formule importante', back: 'a² + b² = c²', hint: null }
      ]
    });
  }

  if (req.method === 'GET' && pathname.startsWith('/api/v1/chapters/') && pathname.endsWith('/step-by-step')) {
    const chapterId = pathname.split('/')[4];
    const chapter = db.chapters.find((c) => c.id === chapterId);
    if (!chapter) return send(res, 404, { error: 'NOT_FOUND' });

    return send(res, 200, {
      problemStatement: 'Exercice type',
      steps: [
        'Identifier les données.',
        'Choisir la formule adaptée.',
        'Remplacer et calculer.',
        'Vérifier le résultat.'
      ],
      commonMistakes: ['Confusion d’unités', 'Mauvaise formule']
    });
  }

  if (req.method === 'GET' && pathname === '/api/v1/progress/chapters') {
    const user = requireAuth(req, res);
    if (!user) return;
    const subjectId = url.searchParams.get('subjectId');

    let items = db.progress.filter((p) => p.userId === user.id);
    if (subjectId) {
      const chapterIds = db.chapters.filter((c) => c.subjectId === subjectId).map((c) => c.id);
      items = items.filter((p) => chapterIds.includes(p.chapterId));
    }

    return send(res, 200, items.map((p) => ({ chapterId: p.chapterId, masteryScore: p.masteryScore, needsReview: p.needsReview, lastActivityAt: p.lastActivityAt })));
  }

  if (req.method === 'GET' && pathname === '/api/v1/progress/overview') {
    const user = requireAuth(req, res);
    if (!user) return;

    const bySubject = new Map();
    for (const p of db.progress.filter((x) => x.userId === user.id)) {
      const chapter = db.chapters.find((c) => c.id === p.chapterId);
      if (!chapter) continue;
      if (!bySubject.has(chapter.subjectId)) bySubject.set(chapter.subjectId, []);
      bySubject.get(chapter.subjectId).push(p);
    }

    const result = [...bySubject.entries()].map(([subjectId, rows]) => {
      const averageMastery = rows.length ? Math.round(rows.reduce((a, b) => a + b.masteryScore, 0) / rows.length) : 0;
      const weakChapters = rows.filter((r) => r.masteryScore < 50).map((r) => r.chapterId);
      return { subjectId, averageMastery, chaptersCompleted: rows.length, weakChapters };
    });

    return send(res, 200, result);
  }

  return send(res, 404, { error: 'NOT_FOUND' });
}

const server = http.createServer(route);
server.listen(PORT, () => {
  console.log(`MVP API server listening on http://localhost:${PORT}`);
});
