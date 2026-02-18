# 🚀 START HERE — Où se trouve ton projet et comment voir l'évolution

Tu n’es pas perdue : ton projet est ici 👇

- Dossier projet : `/workspace/Kg-evaluator`
- Application web de démo backend : `http://localhost:8787/`
- Application existante KG Evaluator (frontend initial) : `file:///workspace/Kg-evaluator/index.html`

## 1) Lancer la démo web du projet (recommandé)
Dans un terminal :

```bash
cd /workspace/Kg-evaluator
bash scripts/start-demo.sh
```

Puis ouvre dans ton navigateur :
- `http://localhost:8787/` → interface de test du backend (inscription, quiz, progression)
- `http://localhost:8787/project-status` → état du projet (docs présentes, routes OK)

## 2) Vérifier que tout est OK
Toujours dans le terminal, tu dois voir :
- `Demo UI:  http://localhost:8787/`
- `Status:   http://localhost:8787/project-status`
- `Health:   http://localhost:8787/health`

Tu peux aussi tester vite :

```bash
curl http://localhost:8787/health
```

Réponse attendue:

```json
{"status":"ok"}
```

## 3) Voir l’évolution de ton travail
Les livrables se trouvent à la racine du projet :
- `CAHIER_DES_CHARGES_V0.1.md`
- `PLAN_ACTION_V0.2.md`
- `DATA_MODEL_V0.1.md`
- `API_SPEC_V0.1.md`
- `PROMPTS_PEDAGO_V0.1.md`
- `backend/server.js`
- `backend/public/index.html`

## 4) Arrêter le serveur
Dans le terminal où le serveur tourne :
- `Ctrl + C`

---
Si tu veux, prochaine étape je peux te faire une page “Roadmap visuelle” (kanban simple) pour suivre les tâches en temps réel.
