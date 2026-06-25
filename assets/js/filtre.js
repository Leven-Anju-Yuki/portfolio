// Catégorie actuellement sélectionnée (mise à jour à chaque clic sur un filtre)
let currentCategory = 'all';

function filterProjects(category) {
    currentCategory = category;

    let projects = document.querySelectorAll('aside');
    let noResults = document.getElementById('no-results');
    let searchInput = document.getElementById('search-input');
    let searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let hasVisibleProjects = false;

    // Met en surbrillance le bouton de filtre actif (optionnel mais pratique)
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.remove('active');
    });
    let activeBtn = document.querySelector(`.filters button.${category}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    projects.forEach(project => {
        let matchesCategory = category === 'all' || project.classList.contains(category);

        let titleEl = project.querySelector('h2');
        let title = titleEl ? titleEl.textContent.trim().toLowerCase() : '';
        let matchesSearch = searchTerm === '' || title.includes(searchTerm);

        if (matchesCategory && matchesSearch) {
            project.classList.remove('hidden');
            hasVisibleProjects = true;
        } else {
            project.classList.add('hidden');
        }
    });

    if (hasVisibleProjects) {
        noResults.style.display = 'none';
    } else {
        noResults.style.display = 'block';
    }
}

// Cache automatiquement les boutons de filtre dont la catégorie ne contient
// aucun projet (ex: plus aucun projet en "html" pur), et affiche à côté de
// chaque bouton le nombre de projets de cette catégorie (ex: "JavaScript (12)").
// Le bouton "Tous" reste toujours visible et affiche le total des projets.
function updateFilterCounts() {
    let projects = document.querySelectorAll('aside');
    let filterButtons = document.querySelectorAll('.filters button');

    filterButtons.forEach(btn => {
        // On lit la vraie catégorie depuis l'attribut onclick="filterProjects('xxx')"
        // plutôt que la classe CSS du bouton, car les deux peuvent différer
        // (ex: bouton de classe "htmlcss" mais filtre sur la catégorie "html").
        let onclickAttr = btn.getAttribute('onclick') || '';
        let match = onclickAttr.match(/filterProjects\(['"]([^'"]+)['"]\)/);
        let category = match ? match[1] : null;

        if (!category) {
            return;
        }

        let count = category === 'all'
            ? projects.length
            : Array.from(projects).filter(project => project.classList.contains(category)).length;

        // Met à jour le compteur affiché dans le bouton (span ajouté dans le HTML)
        let countSpan = btn.querySelector('.filter-count');
        if (countSpan) {
            countSpan.textContent = `(${count})`;
        }

        if (category === 'all') {
            return; // le bouton "Tous" reste toujours affiché, même si count = 0
        }

        // Cache le bouton si la catégorie est vide (et il réapparaîtra tout
        // seul si un projet est ajouté dans cette catégorie plus tard)
        btn.style.display = count > 0 ? '' : 'none';
    });
}

// Initialiser : calculer les compteurs / cacher les filtres vides, puis afficher tous les projets
updateFilterCounts();
filterProjects('all');
