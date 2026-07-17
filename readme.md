# 🌐 Portfolio dynamique de Florie

Ce portfolio présente mes projets de développement et mes compétences acquises hors code. Les cartes sont alimentées par GitHub et pilotées depuis un dashboard privé, tout en conservant mes pages locales et mes images historiques.

## Fonctionnement actuel

- récupération des dépôts GitHub publics et privés avec un token temporaire ;
- fusion des dépôts avec les anciennes cartes locales afin d’éviter les doublons ;
- conservation des images et des pages de présentation présentes dans `Projet_qui_ne_sont_pas_en_lien/` ;
- sélection des projets visibles depuis `dashboard.html` ;
- catégorie proposée à partir du langage principal ou du framework détecté ;
- possibilité de corriger manuellement la catégorie projet par projet ;
- détection spécifique de Symfony et WordPress ;
- affichage d’un tag coloré pour chaque langage GitHub détecté ;
- destination configurable du bouton **Voir plus** : page locale, lien public, README local ou dépôt GitHub ;
- copie d’un README choisi dans `projects-config.json`, puis affichage dans `readme.html` sans donner accès au compte GitHub ;
- graphiques et tableau README/meta mis à jour à partir de la sélection du dashboard.

## Mise à jour des projets

1. Lancer le site depuis un serveur local, par exemple :
   ```bash
   python -m http.server 8000
   ```
2. Ouvrir `http://localhost:8000/dashboard.html`.
3. Saisir temporairement un token GitHub autorisé à lire les dépôts privés.
4. Cliquer sur **Actualiser GitHub**.
5. Choisir les projets visibles, leur catégorie, leur destination et leur image.
6. Cliquer sur **Enregistrer pour tester** pour tester dans le navigateur.
7. Cliquer sur **Télécharger projects-config.json**, remplacer le fichier à la racine, puis publier le dépôt.

Le token reste dans la session du navigateur et n’est jamais exporté dans la configuration.

## Catégories particulières

- **Clé de Fa** : WordPress ;
- **Projet refuge** : PHP ;
- les projets Symfony sont détectés via `composer.json` ;
- les catégories peuvent toujours être corrigées manuellement dans le dashboard.

## Pages de présentation

Toutes les pages du dossier `Projet_qui_ne_sont_pas_en_lien/` utilisent désormais le même en-tête que les pages README : bouton de retour et carte de titre harmonisée.

## Structure principale

```text
portfolio/
├── assets/
│   ├── css/
│   ├── image/
│   └── js/
├── Projet_qui_ne_sont_pas_en_lien/
├── dashboard.html
├── index.html
├── readme.html
├── projects-config.json
├── manifest.json
└── sw.js
```

## Technologies

HTML, CSS, JavaScript, PHP, Symfony, WordPress, Bootstrap et les autres langages détectés dans les dépôts GitHub.

## Autrice

**Florie Decitre** — développeuse web et conceptrice d’applications.

## Mise à jour finale

- Ajout de la section **Data & IA** dans la page **À propos** avec : Python, Jupyter Notebook, Pandas, NumPy, Matplotlib et Scikit-learn.
- Les logos affichés dans cette section sont **Python** et **Jupyter Notebook**.
- Ajout d'un effet visuel avec de petits **lapins** qui apparaissent au clic sur les pages du portfolio.

## Organisation et accès au dashboard

- Le dashboard est rangé dans `admin/dashboard.html` afin de garder la racine propre.
- Les notices sont rangées dans le dossier `docs/`.
- L'accès utilise une empreinte SHA-256 : le code n'est plus écrit en clair dans le JavaScript.
- La vérification est également exécutée lorsqu'une personne essaie d'ouvrir directement l'adresse du dashboard.
- Cette protection reste une protection côté navigateur : elle est adaptée à un portfolio, mais ne remplace pas une authentification côté serveur.

## Commentaires du code

Les fichiers JavaScript et CSS personnalisés contiennent maintenant des commentaires simples servant de notes de travail. Les bibliothèques externes minifiées, comme Bootstrap et jQuery, n'ont pas été modifiées.


## Ajouter une nouvelle page locale

1. Ajouter le fichier HTML dans `Projet_qui_ne_sont_pas_en_lien/`.
2. Lancer `python outils/mettre_a_jour_pages_locales.py`.
3. Ouvrir le dashboard et cliquer sur **Actualiser GitHub**.
4. La nouvelle page apparaît comme projet local décoché ; il suffit de la configurer, la cocher et enregistrer.

En local avec `python -m http.server`, le dashboard essaie aussi de lire directement le dossier. Le petit manifeste JSON reste nécessaire pour GitHub Pages, qui ne fournit pas toujours la liste des fichiers d’un dossier.

## Lancer le portfolio au bon endroit

Utiliser `outils/lancer_portfolio.bat` sous Windows ou `outils/lancer_portfolio.sh` sous Linux/macOS. Cela évite d’obtenir une simple page « Directory listing for / » depuis le mauvais dossier.


## Images des cartes

Les images proposées dans le dashboard viennent automatiquement du dossier `assets/image/image-accueil/`. Le champ libre a été remplacé par un menu déroulant pour éviter les erreurs de chemin. Après l’ajout d’une image, lance `python outils/mettre_a_jour_pages_locales.py` avant de publier afin de mettre à jour le manifeste utilisé sur GitHub Pages.


## Suppression des doublons de pages locales

Les fichiers du dossier `Projet_qui_ne_sont_pas_en_lien/` ne créent plus de lignes séparées dans le dashboard. Ils sont uniquement proposés dans le menu **Page créée** afin d’être associés au dépôt GitHub correspondant. Cela évite les doublons et les erreurs de sélection.

## Pages locales sans dépôt GitHub

Les pages placées dans `Projet_qui_ne_sont_pas_en_lien/` sont comparées aux dépôts GitHub :

- si une page correspond à un dépôt, les deux sont fusionnés et une seule ligne apparaît dans le dashboard ;
- si aucune correspondance GitHub n'est trouvée, la page reste proposée comme projet local indépendant ;
- les nouvelles pages locales sont décochées par défaut afin de choisir manuellement si elles doivent apparaître dans l'index.


## Correction V18

- Correction du mélange de versions en cache entre `portfolio-common.js` et `portfolio-manager.js`.
- Les scripts du dashboard sont maintenant rechargés avec un numéro de version et ne sont plus servis depuis un ancien cache.
- Une sécurité empêche le dashboard de devenir entièrement vide si une fonction manque temporairement.
