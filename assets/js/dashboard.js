// =====================================================================
// CONFIGURATION
// =====================================================================

const INDEX_HTML_PATH = "../index.html";
const GITHUB_USER = "leven-anju-yuki";
const BRANCHES = ["main", "master"];
const README_NAMES = ["readme.md", "README.md", "Readme.md"];

// =====================================================================
// PANEL 1 : Catégories
// =====================================================================

async function loadCategoryPanel() {
    const container = document.getElementById("category-grid");

    let html;
    try {
        const response = await fetch(INDEX_HTML_PATH);
        if (!response.ok) throw new Error("index.html introuvable (" + response.status + ")");
        html = await response.text();
    } catch (err) {
        container.innerHTML = `<p class="error-row">Impossible de lire index.html (${err.message})</p>`;
        return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const asides = Array.from(doc.querySelectorAll("aside"));

    const counts = {};
    let total = 0;

    asides.forEach((aside) => {
        total++;
        const classes = Array.from(aside.classList).filter(
            (c) => c !== "col-12" && c !== "col-lg-3",
        );
        const category = classes[0] || "sans-categorie";
        counts[category] = (counts[category] || 0) + 1;
    });

    container.innerHTML = `
        <div class="category-card total">
            <span class="count">${total}</span>
            <span class="label">Total projets</span>
        </div>
    `;

    Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
            container.innerHTML += `
                <div class="category-card">
                    <span class="count">${count}</span>
                    <span class="label">${category}</span>
                </div>
            `;
        });

    drawCategoryChart(counts);
}

// =====================================================================
// PANEL 2 : README / META
// =====================================================================

async function getGithubLinkedProjects() {
    const response = await fetch(INDEX_HTML_PATH);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const asides = Array.from(doc.querySelectorAll("aside"));
    const projects = [];

    asides.forEach((aside) => {
        const link = aside.querySelector(`a[href*="${GITHUB_USER}.github.io"]`);
        const titleEl = aside.querySelector("h2");
        if (link && titleEl) {
            const match = link
                .getAttribute("href")
                .match(new RegExp(GITHUB_USER + '\\.github\\.io/([^/"]+)'));
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

async function urlExists(url) {
    try {
        const res = await fetch(url, { method: "GET" });
        return res.ok;
    } catch {
        return false;
    }
}

async function checkReadme(repo) {
    for (const branch of BRANCHES) {
        for (const name of README_NAMES) {
            const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${repo}/${branch}/${name}`;
            if (await urlExists(url)) return true;
        }
    }
    return false;
}

async function fetchRepoIndexHtml(repo) {
    for (const branch of BRANCHES) {
        const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${repo}/${branch}/index.html`;
        try {
            const res = await fetch(url);
            if (res.ok) return await res.text();
        } catch {}
    }
    return null;
}

function analyzeMeta(html) {
    if (!html) return { description: false, keywords: false, og: false };
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
    const container = document.getElementById("meta-table-container");
    const rateLimitInfo = document.getElementById("rate-limit-info");
    const metaResults = [];

    let projects;
    try {
        projects = await getGithubLinkedProjects();
    } catch (err) {
        container.innerHTML = `<p class="error-row">Impossible de lire index.html (${err.message})</p>`;
        return;
    }

    if (projects.length === 0) {
        container.innerHTML = `<p class="error-row">Aucun projet GitHub trouvé</p>`;
        return;
    }

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
                ${projects
                    .map(
                        (p) => `
                    <tr id="row-${p.repo}">
                        <td>${p.title}<br><a class="repo-link" href="https://github.com/${GITHUB_USER}/${p.repo}" target="_blank">${p.repo}</a></td>
                        <td class="pending">...</td>
                        <td class="pending">...</td>
                        <td class="pending">...</td>
                        <td class="pending">...</td>
                    </tr>`,
                    )
                    .join("")}
            </tbody>
        </table>
    `;

    let rateLimitHit = false;

    for (const project of projects) {
        const row = document.getElementById(`row-${project.repo}`);

        try {
            const [hasReadme, repoHtml] = await Promise.all([
                checkReadme(project.repo),
                fetchRepoIndexHtml(project.repo),
            ]);

            const meta = analyzeMeta(repoHtml);

            metaResults.push({ repo: project.repo, hasReadme, meta });

            row.innerHTML = `
                <td>${project.title}<br><a class="repo-link" href="https://github.com/${GITHUB_USER}/${project.repo}" target="_blank">${project.repo}</a></td>
                <td>${statusBadge(hasReadme)}</td>
                <td>${statusBadge(meta.description)}</td>
                <td>${statusBadge(meta.keywords)}</td>
                <td>${statusBadge(meta.og)}</td>
            `;
        } catch {
            row.innerHTML = `
                <td>${project.title}</td>
                <td colspan="4" class="error-row">Erreur GitHub (rate limit)</td>
            `;
            rateLimitHit = true;
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
    }

    rateLimitInfo.textContent = rateLimitHit
        ? "Certaines vérifications ont échoué (limite GitHub)."
        : "";

    drawReadmeChart(metaResults);
    drawMetaDescChart(metaResults);
    drawMetaKeyChart(metaResults);
    drawMetaOgChart(metaResults);
}

// =====================================================================
// Rafraîchissement global
// =====================================================================

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
                    backgroundColor: [
                        "#e18207",
                        "#c94f4f",
                        "#6fa8dc",
                        "#93c47d",
                        "#8e7cc3",
                        "#f6b26b",
                        "#76a5af",
                        "#ffd966",
                    ],
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
