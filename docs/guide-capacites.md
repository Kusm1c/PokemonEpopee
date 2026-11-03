# Guide MJ : créer et supprimer des capacités

Ce guide explique comment ajouter une capacité au compendium **Moves**, comment en faire une
**capacité commune** (comme Lutte, Garde et Réaction), et comment la supprimer.

## 1. Créer une capacité dans Foundry

1. Ouvre l'onglet **Compendiums**, fais un clic droit sur **Moves**, puis
   **Basculer le verrouillage** pour le déverrouiller.
2. Ouvre le compendium et clique sur **Créer un objet** (ou fais un clic droit sur un
   dossier, puis **Créer un objet**). Choisis le type **Capacité**.
3. Remplis la fiche :
   - **Onglet Aperçu** : le nom et l'image.
   - **Onglet Détails** :
     - Type, Catégorie (Physique / Spéciale / Statut), Base de dégâts, CA, Fréquence et
       Portée ;
     - **Mots-clés** : voir la section 4 ;
     - **Effet** : le texte de la capacité, affiché sur la carte de chat.
   - **Onglet Règles** : l'automatisation, si besoin (statuts, MdS…).
4. Reverrouille le compendium.

Le plus rapide est souvent de **dupliquer** une capacité proche (clic droit, **Dupliquer**)
puis de la modifier.

## 2. En faire une capacité commune

Une capacité commune est donnée d'office à **tous les Pokémon et tous les Dresseurs**. Elle
apparaît dans le panneau **Capacités Communes** de l'onglet Actions et se lance d'un clic.

1. Dans l'onglet **Détails** de la capacité, coche **Capacité commune**.
2. Règle **Loyauté requise (Pokémon)** :
   - `0` : disponible tout de suite ;
   - par exemple `5` : un Pokémon sous 5 de Loyauté la voit verrouillée et ne peut pas la
     lancer.

   Les Dresseurs l'ont toujours.

Le changement s'applique à toutes les fiches dès que l'entrée du compendium est
enregistrée : il n'y a rien à copier sur les acteurs.

Capacités communes fournies :

| Capacité | Loyauté requise | Remarque |
|---|---|---|
| Lutte | 0 | Ignore les défenses, 1d20 de dégâts, contrecoup |
| Garde | 5 | Dresseur : coûte l'Action de Déplacement |
| Réaction | 10 | Dresseur : coûte l'Action de Dresseur |

Si un acteur possède sa propre copie d'une capacité commune (même slug), c'est sa copie
qui est utilisée.

## 3. Supprimer une capacité

- **Du compendium** : déverrouille **Moves**, fais un clic droit sur l'entrée, puis
  **Supprimer**. Une capacité commune disparaît alors de toutes les fiches.
- **D'un acteur** : sur la fiche, utilise l'icône corbeille de la capacité. Les capacités
  communes n'ont pas de corbeille : elles viennent du compendium, pas de l'acteur.

## 4. Mots-clés en plusieurs langues

Le code reconnaît certains mots-clés quelle que soit leur langue. La table se trouve sous
`PTU.Epopee.Keywords` dans `static/lang/en.json` et `static/lang/fr.json` :

```json
"ranged-launching-distance": "Ranged"        // en.json
"ranged-launching-distance": "À distance"    // fr.json
```

Une capacité taguée « À distance » ou « Ranged » obtient alors la même option de jet
(`move:ranged-launching-distance`). Pour ajouter un mot-clé, ajoute la même clé dans les
deux fichiers. Plusieurs orthographes peuvent être séparées par `|`, par exemple
`"Modéré|Modere"`.

## 5. Pour le dépôt Git : modifier les fichiers source

Les compendiums sont des bases LevelDB (`packs/moves/`). Leurs fichiers source JSON sont dans
`packs/_source/moves/`. Une modification faite dans Foundry vit dans la base, pas dans le
dépôt, tant qu'on ne l'extrait pas.

**Foundry doit être fermé** pour ces deux commandes, à lancer depuis la racine du dépôt :

```powershell
.\scripts\pack-tools\pack.ps1 extract moves   # base -> fichiers JSON
.\scripts\pack-tools\pack.ps1 compile moves   # fichiers JSON -> base
```

- **Après des changements faits dans Foundry** : `extract`, puis commit des fichiers JSON et
  des `.ldb`.
- **Pour créer une capacité à la main** :
  1. copie un fichier JSON de `packs/_source/moves/` ;
  2. donne-lui un `_id` unique de 16 caractères et le même dans `_key` (`!items!<id>`) ;
  3. modifie les champs (`"common": true` et `"commonLoyalty"` pour une capacité commune) ;
  4. lance `compile`, puis commit.
- **Pour supprimer** : efface le fichier JSON, lance `compile`, puis commit.
