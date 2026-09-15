# Peach Tuner — Plan

**Updated:** 2026-09-15  
**Goal:** rendre la détection audio plus sensible et plus persistante pour une utilisation fiable avec plusieurs instruments sur smartphone.

## Plan opérationnel — cycle actuel

Cette section contient uniquement les étapes du travail courant, les tâches validées, les portes d’acceptation et les décisions à prendre.

### État de sortie déjà validé

- [x] Fusionner la PR #25 dans `main`, avec l’icône Android safe-zone, le travail matériel Luthier et les corrections de layout.
- [x] Maintenir la QA par défaut sur smartphone portrait.
- [x] Poser les premiers tokens d’espacement partagés et préserver l’ombre du carrousel.
- [x] Vérifier `npm test`, `npm run check`, la CI et la QA smartphone de la PR #25.

### Étape active — établir la base audio

**Résultat attendu :** une mesure reproductible du comportement actuel de l’accordeur avant toute modification algorithmique.

- [ ] Définir les instruments prioritaires et leurs registres à couvrir.
- [ ] Définir les scénarios smartphone : attaque, note tenue, décroissance, volume faible, harmoniques fortes, bruit ambiant et changement rapide de note.
- [ ] Documenter la base actuelle : filtres, fréquence d’échantillonnage, `fftSize`, intervalle d’analyse, seuil RMS, seuil YIN et délai de perte de signal.
- [ ] Mesurer le délai de détection, la durée de maintien, les décrochages, la reprise, la stabilité en cents et les faux signaux sur Android et iPhone.

**Gate :** la matrice et les mesures de référence sont disponibles dans `STATE.md` ou dans un artefact de test identifié. Aucun choix d’algorithme n’est figé avant cette mesure.

### Étape suivante — améliorer la détection

**Résultat attendu :** une détection qui reste utile plus longtemps pendant la décroissance d’une note, avec une stabilité suffisante pour plusieurs instruments.

- [ ] Comparer les leviers possibles : fenêtre et recouvrement d’analyse, seuil RMS adaptatif, validation de clarté YIN, gestion de l’état tenu et délai de relâchement.
- [ ] Choisir la plus petite modification qui répond aux mesures de référence.
- [ ] Implémenter la logique dans des fonctions testables, en conservant une réponse immédiate aux nouvelles notes.
- [ ] Ajouter des fixtures déterministes pour sinusoïdes, signaux riches en harmoniques, notes décroissantes, faible niveau et bruit.
- [ ] Vérifier l’absence de faux verrouillage et de régression sur les accordages existants.

**Gate :** amélioration mesurée de la tenue ou de la reprise, latence acceptable et suite de tests verte.

### Étape de validation et de release

- [ ] Tester le parcours micro sur smartphone Android et iPhone en portrait.
- [ ] Répéter les scénarios concernés dans les thèmes Console et Luthier.
- [ ] Vérifier permission micro, reprise après arrière-plan, changement de thème, sons de référence et absence d’erreurs.
- [ ] Synchroniser les métadonnées de release et le cache du service worker si le code frontend change.
- [ ] Mettre à jour `README.md` et `RELEASE_NOTES.md`, dont les repères publics restent en retard sur la version actuelle.
- [ ] Publier une PR, attendre les checks smartphone, puis demander le merge lorsque la gate est satisfaite.

**Gate :** la QA smartphone et les tests audio donnent des résultats acceptables sur les appareils ciblés.

### Décisions à prendre

- [ ] Quels instruments passent en priorité après la guitare : basse, ukulélé, violon, clavier ou autre ?
- [ ] Quelle durée de maintien supplémentaire est réellement recherchée après le début de la décroissance ?
- [ ] Quelle priorité donner entre sensibilité maximale, stabilité de note et absence de faux positifs ?
- [ ] Un seul profil automatique doit-il couvrir tous les instruments, ou des profils d’entrée doivent-ils apparaître plus tard ?
- [ ] Les fixtures audio doivent-elles rester synthétiques dans le dépôt, ou faut-il ajouter des extraits réels documentés et autorisés ?

### Bloqué / à clarifier

- [ ] Validation acoustique réelle — le CI smartphone vérifie le rendu et le parcours, mais ne remplace pas un instrument joué devant un Android et un iPhone.

### Rejeté ou supersédé

- [x] Stratégie Android full-bleed de la PR #23 — remplacée par les exports safe-zone avec bord métallique visibles.
- [x] QA tablette et desktop par défaut — remplacée par la QA smartphone uniquement.
- [x] Production systématique de captures — réservée aux demandes explicites ou aux défauts difficiles à comprendre par écrit.

## Roadmap — objectifs long terme

Cette section décrit la destination du projet et l’ordre général des capacités. Elle ne sert pas à enregistrer les mesures du run courant ni les tâches quotidiennes.

### R1 — Moteur audio multi-instruments

Accorder correctement des instruments aux registres et timbres différents, avec détection de fondamentale, résistance aux harmoniques, tenue des notes faibles, reprise propre et indicateur de confiance compréhensible.

### R2 — Capture et continuité mobile

Rendre l’écoute robuste lors des changements de permission, de focus, d’arrière-plan, de sortie audio et de conditions acoustiques variables sur Android et iPhone.

### R3 — PWA prête à l’usage quotidien

Maintenir une installation claire, un cache fiable, des mises à jour explicites et un comportement hors ligne vérifié sur les deux plateformes mobiles.

### R4 — Système de design Peach

Étendre l’échelle d’espacement déjà amorcée aux couleurs, rayons, ombres, hauteurs de contrôles, états et composants partagés, avec des variantes Console et Luthier documentées.

### R5 — Bibliothèque d’accordages durable

Faire évoluer la bibliothèque locale, les accordages sauvegardés et la recherche globale avec validation des données, provenance claire, modération des suggestions et parcours d’édition fiable.

### R6 — Discipline de livraison

Conserver une branche principale lisible, supprimer les branches obsolètes avec autorisation, synchroniser les releases, garder les tests proches des risques et maintenir un handoff fiable grâce aux trois documents canoniques.

