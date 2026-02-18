# Backend MVP (squelette)

Serveur HTTP minimal sans dépendances externes, aligné sur `API_SPEC_V0.1.md`.

## Lancer

```bash
node backend/server.js
```

Par défaut: `http://localhost:8787`

## Endpoint de santé

```bash
curl http://localhost:8787/health
```

## Notes
- Stockage en mémoire (non persistant), uniquement pour prototypage rapide.
- Auth par token en mémoire (`Authorization: Bearer <token>`).
- À remplacer ensuite par une stack persistante (PostgreSQL + framework API).
