// =====================================================================
// NOTES PERSONNELLES
// Gère les filtres, la recherche et les compteurs de projets.
// Notes simples pour comprendre rapidement le rôle du fichier lors d’une future reprise.
// =====================================================================

let currentCategory = 'all';

// Retourne uniquement les cartes de projets de la grille principale.
function getProjectCards() {
    return Array.from(document.querySelectorAll('section.row.justify-content-center > aside'));
}

// Lit le nom lisible de la catégorie enregistré sur une carte.
function categoryLabel(category, cards = []) {
    const card = cards.find(item => item.dataset.category === category);
    return card?.dataset.categoryLabel || (typeof languageLabelFromSlug === 'function'
        ? languageLabelFromSlug(category)
        : category.replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase()));
}

// Recrée les boutons de filtre selon les catégories réellement présentes.
function rebuildLanguageFilters() {
    const container = document.querySelector('.filters');
    if (!container) return;

    const projects = getProjectCards();
    const counts = new Map();
    projects.forEach(project => {
        const category = project.dataset.category || project.dataset.categories || 'autre';
        counts.set(category, (counts.get(category) || 0) + 1);
    });

    const buttons = [`<button class="all" data-category="all" onclick="filterProjects('all')">Tous <span class="filter-count">(${projects.length})</span></button>`];
    [...counts.entries()].sort((a,b) => categoryLabel(a[0], projects).localeCompare(categoryLabel(b[0], projects), 'fr')).forEach(([category,count]) => {
        const color = typeof languageColor === 'function' ? languageColor(category) : '#e18207';
        buttons.push(`<button class="language-filter" style="--language-color:${color}" data-category="${category}" onclick="filterProjects('${category}')">${categoryLabel(category, projects)} <span class="filter-count">(${count})</span></button>`);
    });
    container.innerHTML = buttons.join('');
}

// Affiche les cartes qui correspondent au filtre et au texte recherché.
function filterProjects(category) {
    currentCategory = category;
    const projects = getProjectCards();
    const noResults = document.getElementById('no-results');
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let hasVisibleProjects = false;

    document.querySelectorAll('.filters button').forEach(button => {
        button.classList.toggle('active', button.dataset.category === category);
    });

    projects.forEach(project => {
        const projectCategory = project.dataset.category || project.dataset.categories || 'autre';
        const matchesCategory = category === 'all' || projectCategory === category;
        const title = project.querySelector('h2')?.textContent.trim().toLowerCase() || '';
        const matchesSearch = searchTerm === '' || title.includes(searchTerm);
        const visible = matchesCategory && matchesSearch;
        project.classList.toggle('hidden', !visible);
        if (visible) hasVisibleProjects = true;
    });

    if (noResults) noResults.style.display = hasVisibleProjects ? 'none' : 'block';
}

// Met à jour le nombre affiché dans chaque bouton de filtre.
function updateFilterCounts() { rebuildLanguageFilters(); }

document.addEventListener('DOMContentLoaded', () => {
    rebuildLanguageFilters();
    filterProjects('all');
});
