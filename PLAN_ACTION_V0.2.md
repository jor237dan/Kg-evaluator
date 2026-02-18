# Plan d’action v0.2 — Suite immédiate du projet

Ce document répond à la question : **"c'est quoi la suite ?"**
Objectif : passer du cadrage (v0.1) à l’exécution produit en 2 semaines.

## 1) Décisions produit à valider maintenant (J0)
1. **Niveau de lancement** : 3e, 1ère ou Terminale (recommandé : Terminale).
2. **Langues de lancement** :
   - Option A : Français d’abord
   - Option B : Français + Anglais dès MVP (recommandé si capacité équipe OK)
3. **Matières MVP initiales** (dans les 5 prévues) :
   - Mathématiques
   - Physique
   - Histoire
   - Français
   - Anglais
4. **Canal de lancement** : Web mobile-first (PWA ensuite).

## 2) Première sélection de chapitres (contenu MVP)
> But : éviter de couvrir “tout le programme” dès le départ.

### 2.1 Mathématiques (Terminale)
- Fonctions et limites
- Dérivation et variations
- Intégration (bases)
- Probabilités/statistiques
- Suites numériques

### 2.2 Physique (Terminale)
- Mécanique (mouvement, forces)
- Électricité de base
- Énergie et puissance
- Ondes (intro)
- Optique (intro)

### 2.3 Histoire
- Grandes périodes et repères chronologiques
- Colonisation / décolonisation
- États et institutions
- Histoire du Cameroun (module prioritaire local)

### 2.4 Français
- Compréhension écrite
- Grammaire ciblée
- Méthodologie de rédaction
- Vocabulaire thématique

### 2.5 Anglais
- Reading comprehension
- Grammar focus
- Writing practice
- Core vocabulary by theme

## 3) Format pédagogique par matière

### Maths / Physique
- Résumé express (5 points max)
- Exemple résolu pas à pas
- Exercice guidé
- Exercice autonome
- Correction détaillée avec erreurs fréquentes

### Français / Anglais / Histoire
- Fiche synthèse
- Quiz compréhension
- Flashcards mémorisation
- Question rédigée (court format)
- Correction avec grille simple

## 4) User stories MVP (priorisées)
1. En tant qu’élève, je choisis ma classe + matière + chapitre pour démarrer vite.
2. En tant qu’élève, je lis un résumé court avant de faire un quiz.
3. En tant qu’élève, je fais un quiz et je reçois un score immédiat.
4. En tant qu’élève, je revois mes erreurs avec explication pas à pas (maths/physique).
5. En tant qu’élève, je révise via flashcards sur mobile.
6. En tant qu’élève, je consulte ma progression par chapitre.

## 5) Backlog technique Sprint 1 (10 jours)

## Jour 1–2 : socle produit
- Auth (inscription/connexion)
- Profil élève (classe, section, langue)
- Modèle de données : matière, chapitre, session, score

## Jour 3–4 : contenu & génération
- Module “résumé de chapitre”
- Module “quiz” (QCM + réponse courte)
- Stockage résultats quiz

## Jour 5–6 : logique pédagogique
- Moteur d’explication pas à pas (maths/physique)
- Gabarit flashcards
- Niveau de difficulté (facile/moyen/difficile)

## Jour 7–8 : interface élève
- Écran accueil (matières/chapitres)
- Écran quiz + écran résultats
- Écran progression

## Jour 9 : robustesse
- Tests fonctionnels principaux
- Optimisation low-bandwidth (payload léger, cache basique)

## Jour 10 : démo MVP
- Parcours complet “1 chapitre en ~30 min”
- Collecte premiers retours utilisateurs

## 6) KPI de validation de Sprint 1
- 80% des utilisateurs test complètent au moins 1 quiz.
- Temps moyen de session chapitre entre 20 et 40 minutes.
- Affichage progression disponible après 1 session.
- Temps de réponse quiz acceptable sur connexion faible.

## 7) Risques immédiats & mitigation
- **Risque** : qualité pédagogique variable des explications IA.
  - **Action** : templates de correction + validation manuelle échantillonnée.
- **Risque** : surcharge de périmètre.
  - **Action** : limiter au premier lot de chapitres définis ci-dessus.
- **Risque** : UX trop lourde sur mobile.
  - **Action** : design minimal, textes courts, peu d’images.

## 8) Prochaine sortie documentaire recommandée
Après validation de ce v0.2, produire :
1. ✅ `DATA_MODEL_V0.1.md` (schéma DB minimal)
2. ✅ `API_SPEC_V0.1.md` (endpoints MVP)
3. `PROMPTS_PEDAGO_V0.1.md` (prompts quiz/résumé/explication)

---
Version évolutive : ce plan est ajustable après les 5 à 10 premiers retours élèves.
