"""
Met à jour LANGAGES.md à partir des langages présents dans projects-config.json.

À lancer depuis la racine du portfolio :
    python outils/mettre_a_jour_langages.py

Le script n'efface aucun projet. Il lit uniquement la configuration publiée et
reconstruit la documentation des langages réellement utilisés.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "projects-config.json"
OUTPUT_PATH = ROOT / "./docs/LANGAGES.md"

DESCRIPTIONS = {
    "Batchfile": "Scripts de commandes Windows, généralement enregistrés en .bat ou .cmd.",
    "CSS": "Langage de mise en forme qui gère les couleurs, tailles, espacements et dispositions des pages web.",
    "Dockerfile": "Fichier de configuration utilisé pour construire une image Docker et reproduire un environnement d’exécution.",
    "Hack": "Langage proche de PHP développé par Meta. GitHub peut aussi le détecter dans certaines dépendances PHP.",
    "HTML": "Langage de structure des pages web : titres, textes, images, liens, formulaires et sections.",
    "JavaScript": "Langage qui rend les pages interactives : clics, calculs, filtres, animations et appels d’API.",
    "Jupyter Notebook": "Format de notebook utilisé pour combiner du code, des résultats, des graphiques et des explications, souvent en data et IA.",
    "PHP": "Langage back-end exécuté sur un serveur, utilisé pour traiter les formulaires, les données et les connexions aux bases de données.",
    "Python": "Langage polyvalent utilisé pour l’automatisation, la data, l’intelligence artificielle et le développement back-end.",
    "Shell": "Scripts de terminal utilisés pour automatiser des commandes sous Linux ou macOS.",
    "Symfony": "Framework PHP qui structure les applications web avec des routes, contrôleurs, services et entités.",
    "Twig": "Moteur de modèles utilisé notamment avec Symfony pour générer les pages HTML.",
    "TypeScript": "Version typée de JavaScript qui aide à détecter les erreurs et à organiser les applications importantes.",
    "WordPress": "Système de gestion de contenu permettant de créer et administrer des sites web avec des thèmes et extensions.",
}


def load_languages() -> list[str]:
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"Fichier introuvable : {CONFIG_PATH}")

    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    languages: set[str] = set()

    for project in config.get("projects", []):
        for language in project.get("languages", []):
            if language:
                languages.add(str(language).strip())

        # Les frameworks choisis manuellement peuvent ne pas apparaître dans
        # la liste technique retournée par GitHub.
        framework = project.get("framework")
        if framework:
            languages.add(str(framework).strip())

        category_label = project.get("categoryLabel")
        if category_label in {"Symfony", "WordPress"}:
            languages.add(category_label)

    return sorted(languages, key=str.casefold)


def build_markdown(languages: list[str]) -> str:
    lines = [
        "# Langages et technologies utilisés dans le portfolio",
        "",
        "Ce fichier est généré automatiquement à partir de `projects-config.json`.",
        "Pour le remettre à jour après l’ajout d’un projet, lancer :",
        "",
        "```bash",
        "python outils/mettre_a_jour_langages.py",
        "```",
        "",
        f"**Nombre de langages ou technologies détectés : {len(languages)}**",
        "",
    ]

    for language in languages:
        description = DESCRIPTIONS.get(
            language,
            "Langage ou technologie détecté automatiquement dans un dépôt GitHub du portfolio. "
            "Cette description peut être complétée dans `outils/mettre_a_jour_langages.py`.",
        )
        lines.extend([f"## {language}", "", description, ""])

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    languages = load_languages()
    OUTPUT_PATH.write_text(build_markdown(languages), encoding="utf-8")
    print(f"LANGAGES.md mis à jour : {len(languages)} élément(s).")


if __name__ == "__main__":
    main()
