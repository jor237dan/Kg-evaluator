# Backend MVP (squelette)

Serveur HTTP minimal sans dépendances externes, aligné sur `API_SPEC_V0.1.md`.

## Lancer

```bash
node backend/server.js
```

Ou avec le script helper:

```bash
bash scripts/start-demo.sh
```

Par défaut: `http://localhost:8787`

## Voir le travail dans le web
Ouvre simplement dans ton navigateur :

```text
http://localhost:8787/
```

Tu auras une interface de démo pour tester:
- register/login,
- matières/chapitres/résumé,
- génération quiz,
- tentative quiz,
- progression.

## Voir l'état global du projet

```text
http://localhost:8787/project-status
```

## Endpoint de santé

```bash
curl http://localhost:8787/health
```

## Notes
- Stockage en mémoire (non persistant), uniquement pour prototypage rapide.
- Auth par token en mémoire (`Authorization: Bearer <token>`).
- À remplacer ensuite par une stack persistante (PostgreSQL + framework API).
