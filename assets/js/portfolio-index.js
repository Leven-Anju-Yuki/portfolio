// =====================================================================
// NOTES PERSONNELLES
// Construit les cartes dynamiques visibles sur l'index.
// Notes simples pour comprendre rapidement le rôle du fichier lors d’une future reprise.
// =====================================================================

document.addEventListener("DOMContentLoaded", async () => {
    const section = document.querySelector("section.row.justify-content-center");
    if (!section) return;

    try {
        const published = await loadPublishedConfig();
        const draft = loadDraftConfig();
        const config = consolidateMergedProjects(draft || published);
        const token = sessionStorage.getItem(PORTFOLIO_TOKEN_KEY) || "";

        let repos = [];
        try { repos = await fetchRepositories(token, false); }
        catch (error) { console.warn("GitHub indisponible, utilisation de la configuration enregistrée.", error); }

        const repoMap = new Map(repos.map(repo => [repo.name.toLowerCase(), repo]));
        const cards = [];

        for (const project of (config.projects || [])) {
            if (project.visible === false) continue;

            const repo = repoMap.get((project.repository || "").toLowerCase()) || {
                name: project.repository || project.title,
                full_name: `${config.githubUser || PORTFOLIO_GITHUB_USER}/${project.repository || project.id}`,
                html_url: project.repository ? `https://github.com/${config.githubUser || PORTFOLIO_GITHUB_USER}/${project.repository}` : "#",
                homepage: project.publicUrl || "",
                owner: { avatar_url: "./assets/image/portefeuille.png" },
                _languages: Object.fromEntries((project.languages || []).map(language => [language, 1]))
            };

            const languages = [...new Set(project.languages || Object.keys(repo._languages || {}))];
            const primary = primaryProjectCategory(repo, project);
            const category = primary.category;
            const categories = [category];
            const href = destination(repo, project);
            const image = projectImage(repo, project);
            const languageTags = languages.length
                ? `<div class="project-tags">${languages.map(language => `<span style="--language-color:${languageColor(language)}">${esc(language)}</span>`).join("")}</div>`
                : "";

            cards.push(`<aside class="col-12 col-lg-3 ${esc(category)}" data-category="${esc(category)}" data-category-label="${esc(primary.label)}" data-categories="${esc(category)}" data-project-id="${esc(project.id || project.repository)}">
                <center>
                    <div class="cadre-container"><img class="projet" src="${esc(image)}" alt="Aperçu ${esc(project.title || repo.name)}" onerror="this.src='./assets/image/portefeuille.png'"></div>
                    <h2>${esc(project.title || repo.name.replaceAll("-", " "))}</h2>
                    ${languageTags}
                    <a href="${esc(href)}" ${/^https?:/.test(href) ? 'target="_blank" rel="noopener noreferrer"' : ""}><button class="bouton"><h4>voir plus</h4></button></a>
                </center>
            </aside>`);
        }

        section.innerHTML = cards.join("");
        if (typeof updateFilterCounts === "function") updateFilterCounts();
        if (typeof filterProjects === "function") filterProjects("all");
    } catch (error) {
        console.warn("Cartes dynamiques indisponibles, conservation des cartes HTML.", error);
    }
});
