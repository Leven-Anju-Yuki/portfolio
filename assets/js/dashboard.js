// =====================================================================
// NOTES PERSONNELLES
// Alimente les statistiques, tableaux et graphiques du dashboard.
// Notes simples pour comprendre rapidement le rôle du fichier lors d’une future reprise.
// =====================================================================

// =====================================================================
// CONFIGURATION
// =====================================================================

const INDEX_HTML_PATH = "./index.html";
const GITHUB_USER = "leven-anju-yuki";
const BRANCHES = ["main", "master"];
const README_NAMES = ["readme.md", "README.md", "Readme.md"];

// =====================================================================
// PANEL 1 : Catégories
// =====================================================================

// Compte les projets cochés par catégorie et met à jour le graphique.
async function loadCategoryPanel() {
    const container = document.getElementById("category-grid");
    const published = await loadPublishedConfig();
    const config = loadDraftConfig() || published;
    const visibleProjects = (config.projects || []).filter(project => project.visible !== false);

    const counts = {};
    const projectsByCategory = {};

    visibleProjects.forEach(project => {
        const category = project.category || languageCategory(project.primaryLanguage || "Autre");
        const label = project.categoryLabel || languageLabelFromSlug(category);
        if (!counts[category]) counts[category] = { count: 0, label };
        counts[category].count += 1;
        if (!projectsByCategory[category]) projectsByCategory[category] = [];
        projectsByCategory[category].push(project.title || project.repository || "Projet sans nom");
    });

    container.innerHTML = `
        <div class="category-card total">
            <span class="count">${visibleProjects.length}</span>
            <span class="label">Total projets</span>
        </div>
    `;

    Object.entries(counts)
        .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label, "fr"))
        .forEach(([category, info]) => {
            const color = languageColor(category);
            container.innerHTML += `
                <div class="category-card" data-category="${category}" style="border-color:${color}">
                    <span class="count">${info.count}</span>
                    <span class="label">${info.label}</span>
                </div>
            `;
        });

    enableCategoryToggle(projectsByCategory, Object.fromEntries(Object.entries(counts).map(([k,v]) => [k,v.label])));
    drawCategoryChart(Object.fromEntries(Object.entries(counts).map(([k,v]) => [v.label,v.count])));
}

// =====================================================================
// PANEL 2 : README / META
// =====================================================================

// Prépare la liste des projets sélectionnés qui possèdent un dépôt GitHub.
async function getGithubLinkedProjects() {
    const published = await loadPublishedConfig();
    const config = consolidateMergedProjects(loadDraftConfig() || published);
    saveDraftConfig(config);

    const seen = new Set();
    return (config.projects || [])
        .filter(project => project.visible !== false && project.repository)
        .filter(project => {
            const key = String(project.repository).toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .map(project => ({
            title: project.title || project.repository,
            repo: project.repository,
            private: project.private === true,
        }));
}

// Lit le token temporaire actuellement présent dans le dashboard.
function currentGithubToken() {
    return sessionStorage.getItem(PORTFOLIO_TOKEN_KEY) || "";
}

// Vérifie si un fichier précis existe dans un dépôt GitHub.
async function githubContentExists(repo, path, token = "") {
    try {
        await githubFetch(
            `https://api.github.com/repos/${PORTFOLIO_GITHUB_USER}/${encodeURIComponent(repo)}/contents/${path}`,
            token,
        );
        return true;
    } catch {
        return false;
    }
}

// Vérifie si le dépôt possède au moins un README.
async function checkReadme(repo, token = "") {
    try {
        await githubFetch(
            `https://api.github.com/repos/${PORTFOLIO_GITHUB_USER}/${encodeURIComponent(repo)}/readme`,
            token,
        );
        return true;
    } catch {
        return false;
    }
}

// Récupère le index.html du dépôt pour analyser ses balises meta.
async function fetchRepoIndexHtml(repo, token = "") {
    try {
        const file = await githubFetch(
            `https://api.github.com/repos/${PORTFOLIO_GITHUB_USER}/${encodeURIComponent(repo)}/contents/index.html`,
            token,
        );
        if (!file?.content) return null;
        return decodeURIComponent(escape(atob(file.content.replace(/\s/g, ""))));
    } catch {
        return null;
    }
}

// Repère la description, les mots-clés et les balises Open Graph dans le HTML.
function analyzeMeta(html) {
    if (!html) return { description: false, keywords: false, og: false };
    const lower = html.toLowerCase();
    return {
        description: lower.includes('name="description"') || lower.includes("name='description'"),
        keywords: lower.includes('name="keywords"') || lower.includes("name='keywords'"),
        og: lower.includes('property="og:') || lower.includes("property='og:"),
    };
}

// Affiche une coche verte ou une croix rouge selon le résultat.
function statusBadge(ok) {
    return ok ? '<span class="ok">✓</span>' : '<span class="ko">✕</span>';
}

// Construit le tableau README/meta à partir des projets actuellement sélectionnés.
async function loadMetaPanel() {
    const container = document.getElementById("meta-table-container");
    const rateLimitInfo = document.getElementById("rate-limit-info");
    const metaResults = [];
    const token = currentGithubToken();

    let projects;
    try {
        projects = await getGithubLinkedProjects();
    } catch (err) {
        container.innerHTML = `<p class="error-row">Impossible de charger la sélection (${err.message})</p>`;
        return;
    }

    if (projects.length === 0) {
        container.innerHTML = `<p class="error-row">Aucun projet GitHub sélectionné</p>`;
        drawReadmeChart([]); drawMetaDescChart([]); drawMetaKeyChart([]); drawMetaOgChart([]);
        return;
    }

    container.innerHTML = `
        <table>
            <thead><tr>
                <th>Projet</th><th>README</th><th>Meta description</th>
                <th>Meta keywords</th><th>Open Graph</th>
            </tr></thead>
            <tbody>
                ${projects.map((p, index) => `
                    <tr id="meta-row-${index}">
                        <td>${esc(p.title)}<br><a class="repo-link" href="https://github.com/${PORTFOLIO_GITHUB_USER}/${encodeURIComponent(p.repo)}" target="_blank">${esc(p.repo)}</a>${p.private ? '<br><small>🔒 Privé</small>' : ''}</td>
                        <td class="pending">...</td><td class="pending">...</td>
                        <td class="pending">...</td><td class="pending">...</td>
                    </tr>`).join("")}
            </tbody>
        </table>`;

    let failures = 0;
    for (let index = 0; index < projects.length; index++) {
        const project = projects[index];
        const row = document.getElementById(`meta-row-${index}`);
        try {
            const [hasReadme, repoHtml] = await Promise.all([
                checkReadme(project.repo, token),
                fetchRepoIndexHtml(project.repo, token),
            ]);
            const meta = analyzeMeta(repoHtml);
            metaResults.push({ repo: project.repo, hasReadme, meta });
            row.innerHTML = `
                <td>${esc(project.title)}<br><a class="repo-link" href="https://github.com/${PORTFOLIO_GITHUB_USER}/${encodeURIComponent(project.repo)}" target="_blank">${esc(project.repo)}</a>${project.private ? '<br><small>🔒 Privé</small>' : ''}</td>
                <td>${statusBadge(hasReadme)}</td>
                <td>${statusBadge(meta.description)}</td>
                <td>${statusBadge(meta.keywords)}</td>
                <td>${statusBadge(meta.og)}</td>`;
        } catch (error) {
            failures++;
            row.innerHTML = `<td>${esc(project.title)}</td><td colspan="4" class="error-row">Erreur de vérification GitHub</td>`;
        }
    }

    rateLimitInfo.textContent = failures
        ? `${failures} vérification(s) ont échoué.`
        : token ? "Dépôts publics et privés vérifiés." : "Dépôts publics vérifiés. Ajoute le token pour vérifier les privés.";

    drawReadmeChart(metaResults);
    drawMetaDescChart(metaResults);
    drawMetaKeyChart(metaResults);
    drawMetaOgChart(metaResults);
}

// =====================================================================
// Rafraîchissement global
// =====================================================================

// Actualise en même temps les catégories, le tableau meta et les graphiques.
async function refreshAll() {
    const btn = document.getElementById("refresh-btn");
    const lastUpdate = document.getElementById("last-update");

    btn.disabled = true;
    btn.textContent = "Actualisation...";

    await Promise.all([loadCategoryPanel(), loadMetaPanel()]);

    btn.disabled = false;
    btn.textContent = "Actualiser";
    lastUpdate.textContent = "Dernière actualisation : " + new Date().toLocaleString("fr-FR");
}

refreshAll();

// =====================================================================
// CHARTS
// =====================================================================

// --- Catégories ---
function drawCategoryChart(counts) {
    const ctx = document.getElementById("chart-categories");
    if (!ctx) return;

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    const chart = new Chart(ctx, {
        type: "pie",
        plugins: [ChartDataLabels],
        data: {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: labels.map(label => {
                        const slug = Object.entries(LANGUAGE_META || {}).find(([name]) => name === label)?.[1]?.slug || languageCategory(label);
                        return languageColor(slug);
                    }),
                },
            ],
        },
        options: {
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: "#fff",
                    font: { weight: "bold", size: 14 },
                    formatter: (value) => value,
                },
            },
        },
    });

    const legendContainer = document.getElementById("categories-legend");
    legendContainer.innerHTML = "";

    labels.forEach((label, i) => {
        const color = chart.data.datasets[0].backgroundColor[i];
        legendContainer.innerHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background:${color}"></div>
                <span>${label}</span>
            </div>
        `;
    });
}

// --- README ---
function drawReadmeChart(results) {
    const ctx = document.getElementById("chart-readme");
    if (!ctx) return;

    let ok = 0,
        ko = 0;
    results.forEach((r) => (r.hasReadme ? ok++ : ko++));

    new Chart(ctx, {
        type: "pie",
        plugins: [ChartDataLabels],
        data: {
            labels: ["Complet", "À faire"],
            datasets: [
                {
                    data: [ok, ko],
                    backgroundColor: ["#6fcf6f", "#e06666"],
                },
            ],
        },
        options: {
            plugins: {
                legend: { position: "bottom" },
                datalabels: {
                    color: "#fff",
                    font: { weight: "bold", size: 14 },
                    formatter: (v) => v,
                },
            },
        },
    });
}

// --- Meta Description ---
function drawMetaDescChart(results) {
    const ctx = document.getElementById("chart-meta-desc");
    if (!ctx) return;

    let ok = 0,
        ko = 0;
    results.forEach((r) => (r.meta.description ? ok++ : ko++));

    new Chart(ctx, {
        type: "pie",
        plugins: [ChartDataLabels],
        data: {
            labels: ["Complet", "À faire"],
            datasets: [
                {
                    data: [ok, ko],
                    backgroundColor: ["#6fcf6f", "#e06666"],
                },
            ],
        },
        options: {
            plugins: {
                legend: { position: "bottom" },
                datalabels: {
                    color: "#fff",
                    font: { weight: "bold", size: 14 },
                    formatter: (v) => v,
                },
            },
        },
    });
}

// --- Meta Keywords ---
function drawMetaKeyChart(results) {
    const ctx = document.getElementById("chart-meta-key");
    if (!ctx) return;

    let ok = 0,
        ko = 0;
    results.forEach((r) => (r.meta.keywords ? ok++ : ko++));

    new Chart(ctx, {
        type: "pie",
        plugins: [ChartDataLabels],
        data: {
            labels: ["Complet", "À faire"],
            datasets: [
                {
                    data: [ok, ko],
                    backgroundColor: ["#6fcf6f", "#e06666"],
                },
            ],
        },
        options: {
            plugins: {
                legend: { position: "bottom" },
                datalabels: {
                    color: "#fff",
                    font: { weight: "bold", size: 14 },
                    formatter: (v) => v,
                },
            },
        },
    });
}

// --- Open Graph ---
function drawMetaOgChart(results) {
    const ctx = document.getElementById("chart-meta-og");
    if (!ctx) return;

    let ok = 0,
        ko = 0;
    results.forEach((r) => (r.meta.og ? ok++ : ko++));

    new Chart(ctx, {
        type: "pie",
        plugins: [ChartDataLabels],
        data: {
            labels: ["Complet", "À faire"],
            datasets: [
                {
                    data: [ok, ko],
                    backgroundColor: ["#6fcf6f", "#e06666"],
                },
            ],
        },
        options: {
            plugins: {
                legend: { position: "bottom" },
                datalabels: {
                    color: "#fff",
                    font: { weight: "bold", size: 14 },
                    formatter: (v) => v,
                },
            },
        },
    });
}

// =====================================================================
// OUVERTURE / FERMETURE DES LISTES DE PROJETS PAR CATÉGORIE
// =====================================================================
function enableCategoryToggle(projectsByCategory, categoryLabels = {}) {
    const cards = document.querySelectorAll(".category-card");
    const details = document.getElementById("category-details");
    let openedCategory = null;

    cards.forEach((card) => {
        card.style.cursor = "pointer";

        card.addEventListener("click", () => {
            const category = card.dataset.category;

            // Si on reclique sur la même catégorie → fermer
            if (openedCategory === category) {
                details.innerHTML = "";
                openedCategory = null;
                return;
            }

            openedCategory = category;

            const items = projectsByCategory[category] || [];

            details.innerHTML = `
                <div class="panel-like category-details-panel">
                    <h3>Projets : ${categoryLabels[category] || category}</h3>
                    ${
                        items.length === 0
                            ? "<p class='empty'>Aucun projet dans cette catégorie.</p>"
                            : `<ul>${items.map((p) => `<li>${p}</li>`).join("")}</ul>`
                    }
                </div>
            `;
        });
    });
}
