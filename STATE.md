# Peach Tuner — État courant

**Last consolidated:** 2026-09-15  
**Last verified:** 2026-09-15 — dépôt local, `main`, `origin/main`, refs distantes, version, pipeline audio, tests locaux, merge des PR #25 et #27, checks GitHub associés et séparation des documents canoniques.
**Status:** baseline de production fusionnée ; prochain axe : mesurer puis améliorer la détection audio multi-instruments.

## État actuel

- `main` et `origin/main` pointent sur `f839c23527f10d825a4ecb24e8fc15c7cdb74863`, le merge de la PR #27, lui-même fondé sur le merge de la PR #25.
- La version frontend est `52.1.10` dans `package.json`, `release.json`, `version.txt` et `sw.js`.
- Peach reste une PWA statique HTML, CSS et JavaScript, avec un backend Node.js optionnel pour la recherche globale d’accordages.
- Le produit cible Android et iPhone en portrait. La QA tablette et desktop est hors périmètre par défaut.
- La branche distante `origin/feat/adaptive-pitch-tracking` existe, pointe actuellement sur le même commit que `main`, ne contient aucun diff et n’a pas de PR associée au moment de la vérification.
- Les anciennes branches fusionnées et historiques restent à nettoyer selon la décision de Tim ; elles ne constituent plus le plan de travail actif.

### Pipeline audio actuellement en place

- Capture via `navigator.mediaDevices.getUserMedia` avec echo cancellation, noise suppression et auto gain désactivés.
- Chaîne actuelle : filtre passe-haut à 55 hertz, filtre passe-bas à 1 200 hertz, gain de préamplification à 2,4, puis `AnalyserNode`.
- `fftSize` actuel : 4 096 ; `smoothingTimeConstant` : zéro.
- Analyse toutes les 42 millisecondes.
- Plage analysée : 45 à 1 000 hertz.
- Détection : algorithme YIN avec seuil RMS à 0,0028 et seuil de descente YIN à 0,13.
- Un signal est déclaré périmé après 920 millisecondes sans détection exploitable.
- La fréquence affichée possède déjà un lissage séparé et la roue chromatique utilise une source de rotation unique.

## Travail confirmé

- PR #25 fusionnée dans `main` : icônes Android maskable safe-zone avec bord métallique, matériaux Luthier, ornements SVG, corrections de roue, Bibliothèque et layout.
- Ombre des cartes scrollables restaurée grâce à une réserve basse du carrousel et à la conservation du défilement horizontal.
- Espacement du bouton de thème ramené au token partagé `--space-section`.
- Tests dédiés aux icônes, au thème Luthier, au shell et aux nouvelles règles d’espacement présents dans `tests/`.
- `npm test` passe avec 37 tests sur 37 sur le `main` fusionné.
- `npm run check` passe sur le `main` fusionné.
- Les workflows GitHub `CI` et `Visual QA` de la PR #25 ont réussi sur le commit de branche `e343016` avant le merge.
- La PR #27, qui ajoute les trois documents canoniques, est fusionnée dans `main` après revue et CI réussies.

## Blocages et inconnues actuels

1. L’amélioration de sensibilité et de persistance audio n’est pas encore implémentée ni mesurée.
2. Une QA visuelle automatisée smartphone ne fournit pas à elle seule une preuve acoustique avec de vrais instruments.
3. Le navigateur Chromium local n’était pas disponible dans le précédent environnement de vérification ; les checks smartphone GitHub restent la preuve automatisée disponible.
4. Le badge et plusieurs repères de release de `README.md` et `RELEASE_NOTES.md` affichent encore d’anciennes informations publiques.

## Décisions ouvertes

- Instruments prioritaires et registres à couvrir.
- Durée de maintien supplémentaire attendue après la décroissance d’une note.
- Compromis accepté entre sensibilité, stabilité et faux positifs.
- Profil automatique unique ou profils par familles d’instruments.
- Format et emplacement des fixtures audio de régression.

## Hypothèses, à distinguer des faits

- La guitare reste le premier instrument de référence pour la prochaine mesure.
- Le parcours microphone actuel reste l’interface de base pendant l’expérimentation audio.
- GitHub Pages reste la cible de production et son sous-chemin `/Peach-app/` reste inchangé.

## Références utiles

- **Dépôt :** https://github.com/ShiftCommander/Peach-app
- **Production :** https://shiftcommander.github.io/Peach-app/
- **Branche de travail audio disponible :** `feat/adaptive-pitch-tracking`, actuellement vide au-dessus de `main`.
- **Audio :** `app.js`, constantes au début du fichier, initialisation micro et `detectPitchYin`.
- **Tests :** `tests/`, notamment `tests/global-tuning-api.test.js`, `tests/icon-assets.test.js`, `tests/luthier-theme.test.js` et `tests/shell-layout.test.js`.
- **QA smartphone :** `.github/workflows/visual-qa.yml` et `tests/visual-qa.js`.
- **Backend global :** `docs/global-tuning-api.md`.
- **Historique PWA :** `docs/superpowers/plans/2026-06-19-pwa-install-update.md` et `docs/superpowers/specs/2026-06-19-pwa-install-update-design.md`.

## Journal des décisions

- **2026-09-15 :** la PR #25 a été fusionnée dans `main` — les icônes safe-zone, le thème Luthier et les corrections de layout deviennent la baseline.
- **2026-09-15 :** la QA par défaut est limitée au smartphone portrait — Peach est destinée à Android et iPhone.
- **2026-09-15 :** la stratégie full-bleed Android est supersédée — le bord métallique safe-zone est l’intention visuelle retenue.
- **2026-09-15 :** les trois fichiers canoniques ont été créés depuis le template fourni — ils centralisent désormais règles, plan et état.
- **2026-09-15 :** la QA smartphone portrait a été retirée des règles générales d’`AGENTS.md`; elle reste une décision et un fait de cycle dans `PLAN.md` et `STATE.md`.
- **2026-09-15 :** la PR #27 a été fusionnée dans `main`; les trois documents canoniques sont désormais intégrés.

## Dernier run — 2026-09-15

- Template fourni lu intégralement avant la création des fichiers.
- Vérifié : dépôt `main`, commit fusionné, version, branches visibles, pipeline audio, tests et checks GitHub.
- Réalisé : création de `AGENTS.md`, `PLAN.md` et `STATE.md` avec séparation des responsabilités.
- Corrigé : suppression de la portée QA smartphone spécifique dans `AGENTS.md` et ajout d’une séparation explicite entre règles durables, planification et état vérifié.
- Revue : l’axe standards est passé ; les trois écarts de discipline identifiés par l’axe spécification ont été corrigés dans `AGENTS.md` et `STATE.md`.
- Fusion : la PR #27 a été créée après revue et CI vertes, puis fusionnée avec le commit `f839c23527f10d825a4ecb24e8fc15c7cdb74863`.
- Bloqué / non prouvé : amélioration acoustique réelle, en attente du cadrage instrument et des mesures sur appareils.
- `AGENTS.md` relu ; les règles permanentes ont été établies dans ce bootstrap.
- Les trois fichiers canoniques ont été relus après correction et leur séparation, leurs références et leur prochaine action sont réconciliées pour le handoff.

## Prochaine action immédiate

**Tim :** valider les instruments prioritaires et la durée de maintien recherchée ; ensuite, créer sur `feat/adaptive-pitch-tracking` la mesure de référence du pipeline audio actuel avant toute modification d’algorithme.
