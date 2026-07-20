# 🌐 Portfolio dynamique de Florie

Ce portfolio présente mes projets de développement, de data, d’intelligence artificielle et mes compétences acquises hors code.

Les cartes de l’index sont générées à partir de `projects-config.json`. Le dashboard permet de récupérer les dépôts GitHub publics et privés, de choisir les projets visibles, leur catégorie, leur image et la destination du bouton **Voir plus**.

## Fonctionnement général

Le portfolio utilise plusieurs sources :

- les dépôts GitHub publics ;
- les dépôts GitHub privés accessibles temporairement avec un token ;
- les pages de présentation locales placées dans `Projet_qui_ne_sont_pas_en_lien/` ;
- les images placées dans `assets/image/image-accueil/` ;
- le fichier final `projects-config.json` utilisé par l’index.

Le dashboard fusionne une page locale avec un dépôt GitHub lorsque leurs noms correspondent. Cela évite de créer deux cartes pour le même projet.

Une page locale sans dépôt GitHub correspondant reste disponible comme projet indépendant.

## Structure principale actuelle

```text
portfolio/
│
├── admin/
│   └── dashboard.html
│
├── assets/
│   ├── css/
│   │   ├── a_propos.css
│   │   ├── bootstrap.min.css
│   │   ├── bunny-click.css
│   │   ├── dashboard.css
│   │   ├── header.css
│   │   ├── local-project-header.css
│   │   ├── readme.css
│   │   ├── style accueil.css
│   │   └── style.css
│   │
│   ├── font/
│   │
│   ├── image/
│   │   ├── image-accueil/
│   │   ├── logo-competence/
│   │   ├── bibliotheque/
│   │   ├── cle_de_fa/
│   │   ├── dragon/
│   │   ├── epave/
│   │   ├── magasin/
│   │   ├── mangajeux/
│   │   └── pot_au_lapin/
│   │
│   └── js/
│       ├── bunny-click.js
│       ├── calculer_l'age.js
│       ├── dashboard-access.js
│       ├── dashboard.js
│       ├── filtre.js
│       ├── installer.js
│       ├── portfolio-common.js
│       ├── portfolio-index.js
│       ├── portfolio-manager.js
│       ├── readme-viewer.js
│       └── scroll-up.js
│
├── data/
│   ├── images-accueil.json
│   └── pages-locales.json
│
├── docs/
│   ├── AJOUTER-UNE-PAGE-LOCALE.txt
│   ├── INSTRUCTIONS_TOKEN_GITHUB.txt
│   ├── MODE-EMPLOI-PROJETS.txt
│   ├── STRUCTURE-DU-PROJET.txt
│   └── dashboard.txt
│
├── outils/
│   ├── lancer_portfolio.bat
│   ├── lancer_portfolio.sh
│   └── mettre_a_jour_pages_locales.py
│
├── Projet_qui_ne_sont_pas_en_lien/
│   ├── bibliotheque.html
│   ├── cledefa.html
│   ├── Concours_Eloquence.html
│   ├── epave.html
│   ├── magasin.html
│   ├── mise a jour.html
│   ├── pot_au_lapin.html
│   ├── projet_dragons.html
│   ├── projet_manga_jeux.html
│   └── refuge.html
│
├── apropos.html
├── index.html
├── manifest.json
├── projects-config.json
├── readme.html
├── readme.md
└── sw.js
```

## Rôle des dossiers principaux

### `admin/`

Contient le dashboard privé du portfolio.

L’accès se fait avec un code comparé à une empreinte SHA-256. Le vrai code n’est pas écrit en clair dans le JavaScript.

Cette protection reste côté navigateur : elle évite l’accès facile au dashboard, mais ne remplace pas une authentification serveur.

### `assets/`

Contient tous les fichiers visuels et techniques du site :

- CSS ;
- JavaScript ;
- images ;
- logos ;
- polices.

Les images proposées dans le dashboard viennent de :

```text
assets/image/image-accueil/
```

### `data/`

Contient les manifestes générés automatiquement :

- `pages-locales.json` : liste des pages HTML locales ;
- `images-accueil.json` : liste des images disponibles pour les cartes.

Ces fichiers sont nécessaires sur GitHub Pages, car un site statique ne peut pas toujours lister directement le contenu d’un dossier.

### `docs/`

Contient les notices et modes d’emploi pour éviter de surcharger la racine du projet.

### `outils/`

Contient les scripts pratiques :

- lancement du serveur local au bon emplacement ;
- mise à jour de la liste des pages locales ;
- mise à jour de la liste des images disponibles.

### `Projet_qui_ne_sont_pas_en_lien/`

Contient les pages HTML servant à présenter les projets qui ne peuvent pas être publiés directement, par exemple les projets PHP, Symfony, WordPress ou les expériences hors code.

Si une page correspond à un dépôt GitHub, elle est associée au dépôt et n’apparaît pas en double.

Si elle ne correspond à aucun dépôt, elle peut être ajoutée comme projet local indépendant.

## Utilisation du dashboard

1. Lancer le portfolio avec :

   ```text
   outils/lancer_portfolio.bat
   ```

   ou :

   ```bash
   ./outils/lancer_portfolio.sh
   ```

2. Ouvrir :

   ```text
   http://localhost:8000/admin/dashboard.html
   ```

3. Renseigner temporairement un token GitHub si les dépôts privés doivent être récupérés.

4. Cliquer sur **Actualiser GitHub**.

5. Utiliser la barre de recherche pour retrouver un projet par son titre ou le nom de son dépôt.

6. Choisir pour chaque projet :

   - s’il doit être affiché ;
   - sa catégorie ;
   - la destination du bouton **Voir plus** ;
   - la page locale ;
   - le README à afficher localement ;
   - l’image de la carte.

7. Cliquer sur **Enregistrer pour tester**.

8. Vérifier le résultat dans `index.html`.

9. Cliquer sur **Télécharger projects-config.json**.

10. Remplacer le fichier présent à la racine avant de publier sur GitHub Pages.

## Token GitHub

Le token sert uniquement à récupérer les dépôts privés et leur contenu pendant l’utilisation du dashboard.

Il n’est jamais exporté dans `projects-config.json`.

Si le token est invalide ou expiré, le dashboard le retire et continue avec les dépôts publics.

## Fusion des projets

Le dashboard compare :

- le titre du projet ;
- le nom du dépôt ;
- le nom du fichier HTML local ;
- les mots importants présents dans ces noms.

Exemples de projets fusionnés :

- Projet Dragons avec le dépôt Dragon ;
- Projet Manga Jeux avec MangaGame ;
- Application bibliothèque avec le dépôt Symfony des livres ;
- Projet épave avec le dépôt Symfony des épaves ;
- Numérisation des tickets de tissus avec Scanner-de-ticket ;
- Automatisation suivi qualité avec son dépôt GitHub.

La fusion conserve la page locale et l’image choisie, puis ajoute les langages, le framework et les informations GitHub.

## Catégories

La catégorie est proposée automatiquement à partir du langage principal ou du framework détecté.

Exemples :

- Symfony est détecté via `composer.json` ;
- WordPress peut être choisi manuellement ;
- Python et Jupyter Notebook peuvent être rangés dans Data & IA ;
- la catégorie peut toujours être modifiée dans le dashboard.

## README locaux

Le dashboard peut récupérer le README d’un dépôt et enregistrer son contenu dans `projects-config.json`.

Le visiteur ouvre ensuite `readme.html` avec le style du portfolio, sans accéder directement au compte GitHub.

Pour un dépôt privé, il faut vérifier que le README ne contient aucune information confidentielle avant de le publier.

## Ajouter une nouvelle page locale

1. Ajouter le fichier HTML dans :

   ```text
   Projet_qui_ne_sont_pas_en_lien/
   ```

2. Lancer :

   ```bash
   python outils/mettre_a_jour_pages_locales.py
   ```

3. Ouvrir le dashboard.

4. Cliquer sur **Actualiser GitHub**.

5. Si aucun dépôt ne correspond à cette page, elle sera proposée comme projet local indépendant.

## Ajouter une nouvelle image de carte

1. Ajouter l’image dans :

   ```text
   assets/image/image-accueil/
   ```

2. Lancer :

   ```bash
   python outils/mettre_a_jour_pages_locales.py
   ```

3. L’image apparaîtra dans le menu déroulant du dashboard.

## Recherche dans le dashboard

Une barre de recherche permet de filtrer les lignes du tableau avec :

- le titre visible du projet ;
- le nom du dépôt GitHub.

Cette recherche ne relance pas GitHub et ne modifie pas les choix enregistrés.

## Effet visuel

Un petit effet de lapins apparaît lors des clics sur les pages du portfolio.

Les fichiers concernés sont :

```text
assets/css/bunny-click.css
assets/js/bunny-click.js
```

## Compétences présentées

Le portfolio met notamment en avant :

- HTML ;
- CSS ;
- JavaScript ;
- PHP ;
- Symfony ;
- WordPress ;
- Python ;
- Jupyter Notebook ;
- Pandas ;
- NumPy ;
- Matplotlib ;
- Scikit-learn ;
- UX/UI et outils de design.

## Autrice

**Florie Decitre**  
Étudiante en première année de Mastère Data et Intelligence Artificielle, en alternance chez Oise Tourisme.


## Exception de fusion

- **Pot au lapin** et **Alimentation lapin / nourriture-lapin** sont deux projets différents et restent toujours séparés.
