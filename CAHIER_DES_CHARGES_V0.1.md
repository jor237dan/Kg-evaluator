# Cahier des charges v0.1 — Plateforme IA de révision pour élèves camerounais

## 1) Vision du produit
Aider les élèves camerounais à réviser efficacement jusqu’à 5 matières (Français, Anglais, Physique, Mathématiques, Histoire), même avec peu de temps et une connexion internet limitée.

## 2) Public cible (MVP)
- Niveau : de la classe de 6e à Terminale.
- Sections : les deux sections (francophone et anglophone).
- Besoin principal : réviser vite, mieux comprendre les notions difficiles, et suivre sa progression.

## 3) Problème à résoudre
Les élèves disposent de peu de temps et d’un accès internet parfois instable. Ils ont besoin d’un outil mobile/web qui simplifie la révision, propose des exercices adaptés au niveau, et explique clairement les notions complexes.

## 4) Objectifs pédagogiques
- Permettre à un élève de réviser un chapitre en environ 30 minutes (ou plus selon son niveau de compréhension).
- Offrir des parcours de révision adaptés par matière.
- Montrer une progression claire au fil des sessions.

## 5) Périmètre fonctionnel MVP
### 5.1 Fonctionnalités incluses
1. **Résumés de cours**
   - Résumé court (points clés) et résumé détaillé.
   - Disponible en français et en anglais.

2. **Quiz intelligents**
   - Questions à choix multiples et questions courtes.
   - Difficulté ajustable (facile / moyen / difficile).

3. **Exercices pratiques**
   - Exercices par chapitre et par niveau.
   - Correction guidée.

4. **Explications pas à pas**
   - Prioritaire pour Mathématiques et Physique.
   - Décomposition d’un problème en étapes simples.

5. **Flashcards**
   - Définition, formule, date, notion clé.
   - Révision rapide sur mobile.

6. **Suivi de progression**
   - Score par matière et par chapitre.
   - Historique des sessions de révision.
   - Points forts / points faibles.

7. **Fonctionnalités “intéressantes” (phase proche MVP)**
   - Recommandation du prochain chapitre à réviser.
   - Rappels de révision.
   - Mini mode “examen chronométré”.

### 5.2 Hors périmètre immédiat (v0.1)
- Intégration complète avec établissements scolaires.
- Réseau social avancé entre élèves.
- Création de contenu enseignant complexe.

## 6) Approche par matière
1. **Mathématiques**
   - Méthode pas à pas obligatoire.
   - Mise en avant des formules + erreurs fréquentes.

2. **Physique**
   - Rappel théorique + application numérique.
   - Unités, calculs, interprétation des résultats.

3. **Français**
   - Compréhension, grammaire, vocabulaire, rédaction.

4. **Anglais**
   - Grammar, vocabulary, reading comprehension, writing.

5. **Histoire**
   - Chronologies, causes/conséquences, personnages, contextes.

## 7) Exigences techniques
- Plateformes : mobile et web.
- Langues d’interface : français + anglais.
- Compatibilité connexion faible :
  - chargement léger,
  - limitation de consommation data,
  - cache local pour continuer certaines révisions hors ligne.

## 8) Exigences non fonctionnelles
- Performance : pages et quiz doivent se charger rapidement.
- Simplicité UX : navigation claire pour élèves de différents niveaux.
- Fiabilité : sauvegarde des progrès sans perte de données.
- Sécurité : protection des comptes et des données personnelles.

## 9) Indicateurs de succès (KPI)
- Un élève peut terminer une session chapitre en ~30 min (adaptable selon niveau).
- Taux de complétion des quiz par chapitre.
- Progression des scores entre deux sessions.
- Fréquence de retour utilisateur (hebdomadaire).

## 10) Roadmap de départ
### Phase 1 (MVP)
- Authentification utilisateur.
- Choix classe/matière/chapitre.
- Résumés + quiz + flashcards.
- Suivi de progression basique.

### Phase 2
- Explications pas à pas avancées (maths/physique).
- Recommandations personnalisées de révision.
- Mode examen chronométré.

### Phase 3
- Fonctionnalités communautaires.
- Dashboard enseignant (optionnel).

## 11) Hypothèses & risques
- Les programmes exacts par niveau devront être validés et structurés.
- La qualité des explications IA doit être vérifiée pédagogiquement.
- Le mode faible connexion est critique pour l’adoption.

## 12) Règle d’évolution du document
Ce cahier des charges est une version v0.1. Il est volontairement évolutif et sera ajusté selon :
- retours des élèves,
- contraintes techniques,
- priorités produit,
- retours pédagogiques.


## 13) Suite immédiate (référence v0.2)
La suite opérationnelle du projet est documentée dans `PLAN_ACTION_V0.2.md` (priorités, chapitres initiaux, user stories, backlog sprint 1).
