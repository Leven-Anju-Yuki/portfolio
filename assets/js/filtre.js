// =====================================================================
// RECHERCHE ET FILTRES DE L'INDEX
// =====================================================================
// Ce fichier ne crée pas les projets. Il travaille uniquement sur les
// cartes déjà construites par portfolio-index.js.
// =====================================================================

// La catégorie active est placée dans window pour être accessible depuis
// les attributs onclick encore présents dans index.html.
window.currentCategory = "all";

// Retourne les cartes de la grille dynamique.
function getProjectCards() {
    const grid = document.getElementById("projects-grid")
        || document.querySelector("section.row.justify-content-center");
    return grid ? Array.from(grid.querySelectorAll(":scope > aside")) : [];
}

// Retourne le libellé lisible d'une catégorie.
function categoryLabel(category, cards = []) {
    const card = cards.find(item => item.dataset.category === category);
    if (card?.dataset.categoryLabel) return card.dataset.categoryLabel;

    if (typeof languageLabelFromSlug === "function") {
        return languageLabelFromSlug(category);
    }

    return String(category || "autre")
        .replaceAll("-", " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

// Recrée les boutons à partir des catégories réellement visibles dans la grille.
function rebuildLanguageFilters() {
    const container = document.querySelector(".filters");
    if (!container) return;

    const projects = getProjectCards();
    const counts = new Map();

    projects.forEach(project => {
        const category = project.dataset.category || "autre";
        counts.set(category, (counts.get(category) || 0) + 1);
    });

    const buttons = [
        `<button type="button" class="all" data-category="all">Tous <span class="filter-count">(${projects.length})</span></button>`
    ];

    [...counts.entries()]
        .sort((a, b) => categoryLabel(a[0], projects).localeCompare(categoryLabel(b[0], projects), "fr"))
        .forEach(([category, count]) => {
            const color = typeof languageColor === "function"
                ? languageColor(category)
                : "#e18207";

            buttons.push(
                `<button type="button" class="language-filter" ` +
                `style="--language-color:${color}" data-category="${category}">` +
                `${categoryLabel(category, projects)} ` +
                `<span class="filter-count">(${count})</span></button>`
            );
        });

    container.innerHTML = buttons.join("");

    // Les boutons sont recréés, donc leurs événements sont ajoutés ici.
    container.querySelectorAll("button[data-category]").forEach(button => {
        button.addEventListener("click", () => filterProjects(button.dataset.category));
    });
}

// Applique en même temps le filtre de catégorie et la recherche par nom.
function filterProjects(category = window.currentCategory || "all") {
    window.currentCategory = category;

    const projects = getProjectCards();
    const noResults = document.getElementById("no-results");
    const searchInput = document.getElementById("search-input");
    const searchTerm = (searchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;

    document.querySelectorAll(".filters button[data-category]").forEach(button => {
        button.classList.toggle("active", button.dataset.category === category);
    });

    projects.forEach(project => {
        const projectCategory = project.dataset.category || "autre";
        const title = project.querySelector("h2")?.textContent.trim().toLowerCase() || "";
        const repository = (project.dataset.repository || "").toLowerCase();

        const matchesCategory = category === "all" || projectCategory === category;
        const matchesSearch = !searchTerm
            || title.includes(searchTerm)
            || repository.includes(searchTerm);

        const isVisible = matchesCategory && matchesSearch;
        project.classList.toggle("hidden", !isVisible);
        project.hidden = !isVisible;

        if (isVisible) visibleCount += 1;
    });

    if (noResults) {
        noResults.style.display = visibleCount ? "none" : "block";
    }
}

// Rebranche la recherche après le remplacement dynamique des cartes.
function initialiseProjectSearchAndFilters() {
    const searchInput = document.getElementById("search-input");

    if (searchInput && searchInput.dataset.filterReady !== "true") {
        searchInput.dataset.filterReady = "true";
        searchInput.removeAttribute("oninput");
        searchInput.addEventListener("input", () => filterProjects(window.currentCategory));
    }

    rebuildLanguageFilters();
    filterProjects(window.currentCategory || "all");
}

// Noms conservés pour les appels déjà utilisés par les autres scripts.
function updateFilterCounts() {
    rebuildLanguageFilters();
}

window.getProjectCards = getProjectCards;
window.rebuildLanguageFilters = rebuildLanguageFilters;
window.filterProjects = filterProjects;
window.updateFilterCounts = updateFilterCounts;
window.initialiseProjectSearchAndFilters = initialiseProjectSearchAndFilters;

document.addEventListener("DOMContentLoaded", initialiseProjectSearchAndFilters);
