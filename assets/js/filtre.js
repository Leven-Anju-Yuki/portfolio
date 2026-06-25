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

// Initialiser avec tous les projets visibles
filterProjects('all');
