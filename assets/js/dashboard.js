// =====================================================================
// CONFIGURATION
// =====================================================================

// Chemin relatif vers index.html depuis ce dashboard.
// Si tu déplaces dashboard.html, ajuste ce chemin.
const INDEX_HTML_PATH = '../index.html';

// Pseudo GitHub utilisé pour les projets liés
const GITHUB_USER = 'leven-anju-yuki';

// Branches à tester dans l'ordre (certains repos sont en main, d'autres en master)
const BRANCHES = ['main', 'master'];

// Noms de fichier readme à tester
const README_NAMES = ['readme.md', 'README.md', 'Readme.md'];

// =====================================================================
// PANEL 1 : Projets par catégorie (lu depuis index.html, pas GitHub)
// =====================================================================

async function loadCategoryPanel() {
    const container = document.getElementById('category-grid');

    let html;
    try {
        const response = await fetch(INDEX_HTML_PATH);
        if (!response.ok) {
            throw new Error('index.html introuvable (' + response.status + ')');
        }
        html = await response.text();
    } catch (err) {
        container.innerHTML =
            '<p class="error-row">Impossible de lire index.html (' + err.message + ')</p>';
        return;
    }

    // Parse les <aside class="..."> du fichier
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const asides = Array.from(doc.querySelectorAll('aside'));

    const counts = {};
    let total = 0;

    asides.forEach(aside => {
        total++;
        const classes = Array.from(aside.classList).filter(
            c => c !== 'col-12' && c !== 'col-lg-3'
        );
        const category = classes[0] || 'sans-categorie';
        counts[category] = (counts[category] || 0) + 1;
    });

    // Construit les cartes, "total" en premier
    let cardsHtml = `
        <div class="category-card total">
            <span class="count">${total}</span>
            <span class="label">Total projets</span>
        </div>
    `;

    Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
            cardsHtml += `
                <div class="category-card">
                    <span class="count">${count}</span>
                    <span class="label">${category}</span>
                </div>
            `;
        });

    container.innerHTML = cardsHtml;
}

// =====================================================================
// PANEL 2 : README / meta GitHub (en direct via l'API + raw content)
// =====================================================================

// Extrait, depuis index.html, la liste des projets ayant un lien
// GitHub Pages (https://leven-anju-yuki.github.io/NomDuRepo/), avec leur titre.
async function getGithubLinkedProjects() {
    const response = await fetch(INDEX_HTML_PATH);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const asides = Array.from(doc.querySelectorAll('aside'));
    const projects = [];

    asides.forEach(aside => {
        const link = aside.querySelector(
            `a[href*="${GITHUB_USER}.github.io"]`
        );
        const titleEl = aside.querySelector('h2');
        if (link && titleEl) {
            const match = link.getAttribute('href').match(
                new RegExp(GITHUB_USER + '\\.github\\.io/([^/"]+)')
            );
            if (match) {
                projects.push({
                    title: titleEl.textContent.trim(),
                    repo: match[1],
                });
            }
        }
    });

    return projects;
}

// Teste si une URL raw.githubusercontent existe (statut 200)
async function urlExists(url) {
    try {
        const res = await fetch(url, { method: 'GET' });
        return res.ok;
    } catch (err) {
        return false;
    }
}

// Vérifie le README d'un repo (teste plusieurs branches/casses)
async function checkReadme(repo) {
    for (const branch of BRANCHES) {
        for (const name of README_NAMES) {
            const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${repo}/${branch}/${name}`;
            if (await urlExists(url)) {
                return true;
            }
        }
    }
    return false;
}

// Récupère le contenu de index.html d'un repo (teste plusieurs branches)
async function fetchRepoIndexHtml(repo) {
    for (const branch of BRANCHES) {
        const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${repo}/${branch}/index.html`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                return await res.text();
            }
        } catch (err) {
            // on essaie la branche suivante
        }
    }
    return null;
}

// Analyse le HTML d'un repo pour détecter les balises meta
function analyzeMeta(html) {
    if (!html) {
        return { description: false, keywords: false, og: false };
    }
    const lower = html.toLowerCase();
    return {
        description: lower.includes('name="description"'),
        keywords: lower.includes('name="keywords"'),
        og: lower.includes('property="og:'),
    };
}

function statusBadge(ok) {
    return ok ? '<span class="ok">✓</span>' : '<span class="ko">✕</span>';
}

async function loadMetaPanel() {
    const container = document.getElementById('meta-table-container');
    const rateLimitInfo = document.getElementById('rate-limit-info');

    let projects;
    try {
        projects = await getGithubLinkedProjects();
    } catch (err) {
        container.innerHTML =
            '<p class="error-row">Impossible de lire index.html (' + err.message + ')</p>';
        return;
    }

    if (projects.length === 0) {
        container.innerHTML =
            '<p class="error-row">Aucun projet avec lien GitHub trouvé dans index.html</p>';
        return;
    }

    // Construit le tableau avec des lignes "en cours de vérification"
    let rowsHtml = projects
        .map(
            p => `
        <tr id="row-${p.repo}">
            <td>${p.title}<br><a class="repo-link" href="https://github.com/${GITHUB_USER}/${p.repo}" target="_blank">${p.repo}</a></td>
            <td class="pending">...</td>
            <td class="pending">...</td>
            <td class="pending">...</td>
            <td class="pending">...</td>
        </tr>`
        )
        .join('');

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Projet</th>
                    <th>README</th>
                    <th>Meta description</th>
                    <th>Meta keywords</th>
                    <th>Open Graph</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;

    // Vérifie chaque repo en parallèle, mais on espace légèrement les
    // requêtes pour limiter le risque de rate-limit GitHub.
    let rateLimitHit = false;

    for (const project of projects) {
        const row = document.getElementById(`row-${project.repo}`);
        try {
            const [hasReadme, repoHtml] = await Promise.all([
                checkReadme(project.repo),
                fetchRepoIndexHtml(project.repo),
            ]);
            const meta = analyzeMeta(repoHtml);

            row.innerHTML = `
                <td>${project.title}<br><a class="repo-link" href="https://github.com/${GITHUB_USER}/${project.repo}" target="_blank">${project.repo}</a></td>
                <td>${statusBadge(hasReadme)}</td>
                <td>${statusBadge(meta.description)}</td>
                <td>${statusBadge(meta.keywords)}</td>
                <td>${statusBadge(meta.og)}</td>
            `;
        } catch (err) {
            row.innerHTML = `
                <td>${project.title}<br><a class="repo-link" href="https://github.com/${GITHUB_USER}/${project.repo}" target="_blank">${project.repo}</a></td>
                <td colspan="4" class="error-row">Erreur de vérification (rate limit GitHub possible)</td>
            `;
            rateLimitHit = true;
        }
        // petite pause pour ne pas bombarder l'API d'un coup
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    if (rateLimitHit) {
        rateLimitInfo.textContent =
            "Certaines vérifications ont échoué (limite de requêtes GitHub atteinte). Réessaie dans quelques minutes.";
    } else {
        rateLimitInfo.textContent = '';
    }
}

// =====================================================================
// Rafraîchissement global
// =====================================================================

async function refreshAll() {
    const btn = document.getElementById('refresh-btn');
    const lastUpdate = document.getElementById('last-update');

    btn.disabled = true;
    btn.textContent = 'Actualisation...';

    await Promise.all([loadCategoryPanel(), loadMetaPanel()]);

    btn.disabled = false;
    btn.textContent = 'Actualiser';
    lastUpdate.textContent =
        'Dernière actualisation : ' + new Date().toLocaleString('fr-FR');
}

// Lance automatiquement une première vérification à l'ouverture de la page
refreshAll();
