function filterProjects(category) {
    let projects = document.querySelectorAll('aside');
    let noResults = document.getElementById('no-results');
    let hasVisibleProjects = false;

    projects.forEach(project => {
        if (category === 'all' || project.classList.contains(category)) {
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