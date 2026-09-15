# Peach Tuner — Instructions pour les agents

## Finalité

Peach est une Progressive Web App installable qui aide à accorder des instruments avec le microphone d’un smartphone. Elle comprend un accordeur automatique, une roue chromatique, des sons de référence, des accordages prédéfinis et personnalisés, une bibliothèque de morceaux et un backend Node.js optionnel pour la recherche globale d’accordages.

L’objectif durable est de faire de Peach une accordeuse fiable pour plusieurs instruments, agréable à utiliser sur Android et iPhone, avec une identité visuelle Console et Luthier cohérente.

## Documents canoniques

Les trois fichiers de coordination à la racine du dépôt sont les seules sources canoniques pour le travail entre agents :

1. `AGENTS.md` — règles permanentes, limites et sources de vérité.
2. `PLAN.md` — travail opérationnel, tâches validées, décisions et roadmap.
3. `STATE.md` — faits vérifiés, état courant, blocages et prochaine action.

Au début de chaque run, lis entièrement les trois fichiers. Considère `STATE.md` comme valable seulement jusqu’à sa date `Last verified`. Lorsqu’un état vérifié contredit un document, conserve la preuve vérifiée et mets à jour le document concerné.

Un run comprend toute nouvelle conversation, tout nouvel agent ou processus, toute reprise après perte de contexte et tout handoff. La mémoire d’un run précédent ne remplace jamais la relecture des trois fichiers.

Si l’un des trois fichiers manque, est inaccessible ou ne peut pas être identifié comme la version canonique partagée, arrête l’exécution du projet et signale le blocage de synchronisation. À la fin de chaque run :

- mets toujours `STATE.md` à jour avec la date, les sources vérifiées, le résultat et la prochaine action ;
- mets `PLAN.md` à jour lorsqu’une tâche est terminée, bloquée, ajoutée, réordonnée ou abandonnée ;
- modifie `AGENTS.md` uniquement lorsqu’une règle durable change ;
- relis les trois fichiers et réconcilie leur contenu avant le handoff.

Si `STATE.md` ne peut pas être mis à jour avec le résultat et la prochaine action du run, arrête l’exécution du projet en dehors de ce workflow et signale le blocage. Un agent ne poursuit pas une modification de fond sans pouvoir laisser un état canonique exploitable.

Les documents de `docs/superpowers/`, `RELEASE_NOTES.md`, `README.md` et `docs/global-tuning-api.md` sont des références historiques, publiques ou techniques. Ils ne remplacent pas ce trio de coordination.

### Séparation stricte des responsabilités

| Document | Rôle | Contenu attendu |
|---|---|---|
| `AGENTS.md` | Règles durables pour les agents | méthode de travail, limites, preuves, sources de vérité, autorisations et invariants techniques ; aucune tâche de cycle ni roadmap |
| `PLAN.md` | Direction et travail planifié | décisions de produit, périmètre de cycle, tâches validées, portes d’acceptation, décisions ouvertes et objectifs long terme |
| `STATE.md` | Photographie vérifiée | faits observés à une date donnée, travaux intégrés, blocages, hypothèses, références et prochaine action |

Une règle de fonctionnement valable pour tous les cycles appartient à `AGENTS.md`. Une décision propre au cycle, comme le périmètre de QA, appartient à `PLAN.md` et son état vérifié appartient à `STATE.md`. Une observation datée ne devient pas une règle permanente par simple répétition.

## Direction durable du projet

- **Objectif principal :** améliorer la qualité de l’accordage automatique pour plusieurs instruments, avec une détection stable et persistante.
- **Périmètre :** application statique, microphone, traitement de hauteur, interface de l’accordeur, thèmes, PWA, bibliothèque d’accordages et backend global optionnel.
- **Utilisateurs et environnement :** musiciens sur smartphone Android ou iPhone, principalement en orientation portrait, avec interaction tactile.
- **Production :** GitHub Pages à l’adresse relative au projet `https://shiftcommander.github.io/Peach-app/`.
- **Technologie :** HTML, CSS et JavaScript natifs ; Node.js vingt ou supérieur pour le backend et les tests.
- **Thèmes :** préserver les identités Console et Luthier, leur hiérarchie et leur matérialité. Les changements de placement, d’espacement et de dimensionnement doivent suivre le système visuel existant.
- **Artwork :** conserver l’œuvre Peach approuvée. Les canvas de plateforme et leur traitement safe-zone peuvent évoluer avec validation, l’image elle-même reste inchangée.
- **PWA :** garder les chemins relatifs, le manifest, le service worker et le cache compatibles avec le sous-chemin GitHub Pages.
- **Backend :** aucune clé de fournisseur d’IA dans le navigateur ; les recherches globales restent optionnelles et doivent rester contrôlées côté serveur.

## Sources de vérité et règles de preuve

- Le dépôt GitHub et la branche `main` décrivent le code intégré.
- `package.json`, `release.json`, `version.txt` et `sw.js` décrivent ensemble la version frontend déployée.
- `app.js` est la source du comportement audio courant, notamment `getUserMedia`, les filtres, `AnalyserNode` et `detectPitchYin`.
- Les tests de `tests/` et les workflows `.github/workflows/` fournissent les preuves automatisées.
- Le microphone réel et les instruments réels sont la source de vérité pour toute affirmation sur la sensibilité, la tenue du signal, la latence ou les faux positifs.
- `docs/global-tuning-api.md` décrit le contrat du backend de recherche globale.

Sépare toujours les faits vérifiés, les travaux historiques rapportés, les hypothèses et les recommandations. Un fait susceptible de changer est vérifié seulement lorsque l’objet concerné, le périmètre, l’environnement, la source et la date d’observation concordent. Rafraîchis ce type de preuve avant de t’y appuyer. Une amélioration audio doit être mesurée avec un scénario reproductible avant d’être déclarée meilleure.

## Portes de décision permanentes

- Une modification de l’interface ou de l’audio reçoit une vérification sur les plateformes, orientations et parcours explicitement retenus dans `PLAN.md`; aucune couverture non exécutée n’est présentée comme validée.
- Une modification audio fournit une matrice d’essai et des mesures au minimum pour la détection, la durée de maintien, la reprise après décrochage, la stabilité en cents et les faux signaux.
- Toute release frontend synchronise la version de `package.json`, `release.json`, `version.txt` et `sw.js`, puis vérifie le cache du service worker.
- Les assets d’icône conservent leurs rôles du manifest, leurs dimensions et leurs tests de hash lorsque l’artwork approuvé est concerné.
- Les seuils et espacements réutilisés passent par des tokens ou des alias sémantiques du design system. Les valeurs isolées nécessitent une justification dans le code ou le plan.
- Les labels accessibles, le focus et les dimensions tactiles restent inclus dans toute vérification d’interface concernée.

## Autorisations humaines

Une autorisation explicite est requise avant :

- toute suppression de branche, réécriture d’historique ou action destructive ;
- tout merge, déploiement, publication ou changement externe conséquent ;
- toute dépense, souscription, clé, permission ou modification d’accès ;
- toute décision importante lorsque les preuves restent ambiguës ;
- toute modification substantielle du branding, du comportement audio de référence ou du périmètre produit.

La recherche, la lecture du dépôt, les tests, la préparation locale, les corrections réversibles et la rédaction des documents canoniques restent autorisées lorsqu’elles sont directement liées à la tâche demandée.

## Discipline des outils

- Utilise la plus petite stack utile : scripts npm existants, Node.js, outils Git et tests ciblés.
- Utilise le navigateur uniquement pour une vérification réellement utile du rendu ou de l’interaction smartphone.
- Ne produis pas de captures à remettre à l’utilisateur sans demande explicite, sauf si le rapport ne peut pas rendre le défaut compréhensible.
- Ne force jamais un push et ne masque jamais une divergence par un reset destructif.
- Préserve les modifications existantes qui ne relèvent pas de la tâche.
- N’ajoute un service, une dépendance ou un backend que s’il apporte un gain mesurable de qualité, fiabilité, vitesse ou maintenance.
- Lorsqu’un skill est nommé, lis ses instructions complètes avant d’agir. Lorsqu’un skill n’est pas disponible, signale-le et applique la meilleure procédure locale traçable.

## Workflow de travail

1. Lire `AGENTS.md`, `PLAN.md` et `STATE.md`.
2. Vérifier les fichiers, branches, environnements et sources nécessaires à la tâche.
3. Réaliser la plus petite étape active qui produit un résultat contrôlable.
4. Garder les décisions produit ambiguës dans `PLAN.md` jusqu’à validation.
5. Vérifier avec les tests ou l’application réelle lorsque c’est possible.
6. Mettre à jour `STATE.md`, puis `PLAN.md` si nécessaire.
7. Vérifier si une règle permanente d’`AGENTS.md` a changé.
8. Réconcilier les trois fichiers avant de rendre la main.

## Politique d’automatisation

L’automatisation doit réduire le travail répétitif, améliorer la preuve ou résoudre un blocage identifié. Elle conserve les portes d’approbation humaine pour les suppressions, merges, publications, dépenses, permissions et autres changements à fort impact.
