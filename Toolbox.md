# ToolBox pour modif PE

### Push nouvelle version
Pour push une màj effective, qui sera pris en compte dans les prochaines sessions de jeu, incrémenter le numero de version dans le fichier system.json
<div align="center">
<img src="MDImages/version.png" width="400" alt="Description">
</div>

#

### Ajouter des nouvelles images/icones aux macros
Pour faire ça il suffit de trouver l'endroit dans lequel les images sont renseignées, ajouter l'image dans un dossier existant ou en créer un autre et mettre sont path relatif soit celui depuis la racine du projet git.

Exemple avec la macro "Advance Travel Quarter" dans src\module\setup\macros.js
<div align="center">
<img src="MDImages/images.png" width="400" alt="Description">
</div>

#

### Balancing combat

Path: src\module\combat-math

#

### Ajouter de nouvelles origines

Path: src\module\origins\data.js

Une origine existe déjà il suffit de la copier coller en séparant bien les 2 d'une virgule
<div align="center">
<img src="MDImages/virgule.png" width="400" alt="Description">
</div>
