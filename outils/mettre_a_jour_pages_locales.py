from pathlib import Path
import json
import re

# Le script part toujours de la racine du portfolio, même s'il est lancé depuis le dossier outils.
ROOT = Path(__file__).resolve().parent.parent
LOCAL_PAGES_DIR = ROOT / "Projet_qui_ne_sont_pas_en_lien"
CARD_IMAGES_DIR = ROOT / "assets" / "image" / "image-accueil"
DATA_DIR = ROOT / "data"


def readable_title(filename: str) -> str:
    """Transforme un nom de fichier en titre simple pour les menus du dashboard."""
    stem = Path(filename).stem
    return re.sub(r"[_-]+", " ", stem).strip()


def update_local_pages() -> int:
    """Liste toutes les pages HTML locales afin qu'elles soient proposées dans le dashboard."""
    pages = []
    for page in sorted(LOCAL_PAGES_DIR.glob("*.html"), key=lambda path: path.name.lower()):
        pages.append({
            "path": f"Projet_qui_ne_sont_pas_en_lien/{page.name}",
            "title": readable_title(page.name),
        })
    (DATA_DIR / "pages-locales.json").write_text(
        json.dumps({"pages": pages}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return len(pages)


def update_card_images() -> int:
    """Liste les images de image-accueil pour éviter de saisir leur chemin à la main."""
    allowed = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
    images = []
    for image in sorted(CARD_IMAGES_DIR.iterdir(), key=lambda path: path.name.lower()):
        if image.is_file() and image.suffix.lower() in allowed:
            images.append({
                "path": f"assets/image/image-accueil/{image.name}",
                "title": readable_title(image.name),
            })
    (DATA_DIR / "images-accueil.json").write_text(
        json.dumps({"images": images}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return len(images)


if __name__ == "__main__":
    DATA_DIR.mkdir(exist_ok=True)
    page_count = update_local_pages()
    image_count = update_card_images()
    print(f"{page_count} page(s) locale(s) et {image_count} image(s) de carte détectée(s).")
