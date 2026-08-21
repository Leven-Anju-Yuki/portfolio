// =====================================================================
// CONSTRUCTION AUTOMATIQUE DES CARTES DE L’INDEX
// =====================================================================
// Les projets gardent leur catégorie technique (filtres) et possèdent
// désormais un deuxième classement destiné uniquement à la présentation :
// Projets phares, Outils utiles ou Défis & expérimentations.
// =====================================================================

document.addEventListener("DOMContentLoaded", async () => {
    const section = document.querySelector("section.row.justify-content-center");
    if (!section) return;
    section.id = "projects-grid";

    try {
        const published = await loadPublishedConfig();
        const draft = loadDraftConfig();
        const config = consolidateMergedProjects(draft || published);
        const token = sessionStorage.getItem(PORTFOLIO_TOKEN_KEY) || "";

        let repos = [];
        try { repos = await fetchRepositories(token, false); }
        catch (error) { console.warn("GitHub indisponible, utilisation de la configuration enregistrée.", error); }

        const repoMap = new Map(repos.map(repo => [repo.name.toLowerCase(), repo]));
        const groups = { featured: [], useful: [], experiments: [] };

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
            const href = destination(repo, project);
            const image = projectImage(repo, project);
            const portfolioSection = project.portfolioSection || inferPortfolioSection(repo, project);
            const languageTags = languages.length
                ? `<div class="project-tags">${languages.map(language => `<span style="--language-color:${languageColor(language)}">${esc(language)}</span>`).join("")}</div>`
                : "";

            const cardBadges = [];

            if (portfolioSection === "featured") {
                cardBadges.push('<span class="featured-project-badge">⭐ Projet phare</span>');
            }

            // La validation de diplôme est une information complémentaire.
            // Elle ne change ni la catégorie technique ni le groupe d'accueil.
            if (project.diplomaValidation === true) {
                cardBadges.push('<span class="diploma-project-badge">🎓 Validation de diplôme</span>');
            }

            const card = `<aside class="portfolio-project-card col-12 col-lg-3 ${esc(category)} ${portfolioSection === "featured" ? "is-featured" : ""}"
                data-category="${esc(category)}"
                data-category-label="${esc(primary.label)}"
                data-project-id="${esc(project.id || project.repository)}"
                data-repository="${esc(project.repository || "")}"
                data-portfolio-section="${esc(portfolioSection)}">
                <center>
                    ${cardBadges.length ? `<div class="project-context-badges">${cardBadges.join("")}</div>` : ""}
                    <div class="cadre-container"><img class="projet" src="${esc(image)}" alt="Aperçu ${esc(project.title || repo.name)}" onerror="this.onerror=null;this.src=PORTFOLIO_WORK_GIF"></div>
                    <h2>${esc(project.title || repo.name.replaceAll("-", " "))}</h2>
                    ${languageTags}
                    <a href="${esc(href)}" ${/^https?:/.test(href) ? 'target="_blank" rel="noopener noreferrer"' : ""}><button class="bouton"><h4>voir plus</h4></button></a>
                </center>
            </aside>`;

            (groups[portfolioSection] || groups.experiments).push(card);
        }

        const descriptions = {
            featured: "Mes projets les plus complets, récents ou représentatifs de mes compétences actuelles.",
            useful: "Des outils conçus pour simplifier un besoin concret et rendre le numérique plus accessible.",
            experiments: "Des projets réalisés pour apprendre, tester une technologie, créer et me challenger."
        };

        const order = ["featured", "useful", "experiments"];
        section.innerHTML = order
            .filter(key => groups[key].length)
            .map(key => `
                <div class="portfolio-section" data-section="${key}">
                    <div class="portfolio-section-heading">
                        <h2>${PORTFOLIO_SECTION_META[key].icon} ${PORTFOLIO_SECTION_META[key].label}</h2>
                        <p>${descriptions[key]}</p>
                    </div>
                    <div class="portfolio-section-grid">${groups[key].join("")}</div>
                </div>
            `).join("");

        window.currentCategory = "all";

        if (typeof initialiseProjectSearchAndFilters === "function") {
            initialiseProjectSearchAndFilters();
        }
    } catch (error) {
        console.warn("Cartes dynamiques indisponibles, conservation des cartes HTML.", error);
    }
});
