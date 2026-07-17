// =====================================================================
// NOTES PERSONNELLES
// Récupère les dépôts et enregistre mes choix dans le dashboard.
// Notes simples pour comprendre rapidement le rôle du fichier lors d’une future reprise.
// =====================================================================

let pmRepos = [];
let pmConfig = null;
let pmRefreshing = false;
let pmLocalPageOptions = [];
let pmImageOptions = [];

// Sécurité contre un ancien fichier portfolio-common.js encore présent dans le cache.
// Si la fonction de fusion n'est pas disponible, on garde le dashboard utilisable
// et la prochaine actualisation rechargera les bons fichiers grâce au numéro de version.
if (typeof window.mergeAutomaticLocalDuplicates !== "function") {
    window.mergeAutomaticLocalDuplicates = function fallbackMergeAutomaticLocalDuplicates(config) {
        console.warn("La fonction de fusion automatique n'était pas encore disponible dans le cache. Le dashboard continue sans bloquer.");
        return config;
    };
}

// Lit la liste publiée et essaie aussi de lire le dossier quand le serveur local l'autorise.
async function loadLocalPageOptions() {
    const found = new Map();

    try {
        const response = await fetch(`./data/pages-locales.json?v=${Date.now()}`);
        if (response.ok) {
            const data = await response.json();
            for (const page of (data.pages || [])) found.set(page.path, page.title || page.path);
        }
    } catch (error) {
        console.warn("La liste des pages locales n'a pas pu être lue.", error);
    }

    // Python http.server affiche le contenu d'un dossier : on en profite en local
    // pour voir immédiatement une nouvelle page, même avant de régénérer le manifeste.
    try {
        const response = await fetch(`./Projet_qui_ne_sont_pas_en_lien/?v=${Date.now()}`);
        if (response.ok) {
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, "text/html");
            doc.querySelectorAll('a[href$=".html"]').forEach(link => {
                const fileName = decodeURIComponent(link.getAttribute("href").split("/").pop());
                const path = `Projet_qui_ne_sont_pas_en_lien/${fileName}`;
                const title = fileName.replace(/\.html$/i, "").replaceAll("_", " ").replaceAll("-", " ");
                found.set(path, title);
            });
        }
    } catch (_) {
        // Sur GitHub Pages le listing du dossier peut être désactivé : le JSON reste le secours.
    }

    pmLocalPageOptions = [...found.keys()].sort((a, b) => a.localeCompare(b, "fr"));
    return [...found.entries()].map(([path, title]) => ({ path, title }));
}

// Lit les images de cartes disponibles dans image-accueil.
// Le fichier JSON sert sur GitHub Pages et le listing du dossier permet de voir les ajouts immédiatement en local.
async function loadImageOptions() {
    const found = new Map();

    try {
        const response = await fetch(`./data/images-accueil.json?v=${Date.now()}`);
        if (response.ok) {
            const data = await response.json();
            for (const image of (data.images || [])) {
                found.set(image.path, image.title || image.path);
            }
        }
    } catch (error) {
        console.warn("La liste des images de cartes n'a pas pu être lue.", error);
    }

    // En local, Python affiche le contenu du dossier : une nouvelle image devient donc visible sans saisie manuelle.
    try {
        const response = await fetch(`./assets/image/image-accueil/?v=${Date.now()}`);
        if (response.ok) {
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, "text/html");
            doc.querySelectorAll('a[href]').forEach(link => {
                const href = link.getAttribute("href") || "";
                if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(href)) return;
                const fileName = decodeURIComponent(href.split("/").pop());
                const path = `assets/image/image-accueil/${fileName}`;
                const title = fileName.replace(/\.[^.]+$/i, "").replaceAll("_", " ").replaceAll("-", " ");
                found.set(path, title);
            });
        }
    } catch (_) {
        // Sur GitHub Pages, le manifeste JSON reste la source de secours.
    }

    pmImageOptions = [...found.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "fr"))
        .map(([path, title]) => ({ path, title }));
    return pmImageOptions;
}

// Ajoute les pages locales qui ne sont pas encore liées à un projet.
// Elles sont décochées au départ : je décide ensuite si elles doivent apparaître dans l’index.
// Lorsqu’un dépôt GitHub correspond à la page, la fiche locale est réutilisée au lieu de créer un doublon.
function addMissingLocalPagesToConfig(localPages) {
    const usedPages = new Set((pmConfig.projects || []).map(project => project.localPage).filter(Boolean));
    for (const page of localPages) {
        if (usedPages.has(page.path)) continue;
        const id = normalizeProjectKey(page.path.replace(/\.html$/i, ""));
        if ((pmConfig.projects || []).some(project => project.id === id)) continue;
        pmConfig.projects.push({
            id,
            repository: "",
            title: page.title,
            visible: false,
            categoryOverride: "autre",
            category: "autre",
            categoryLabel: "Autre",
            categories: ["autre"],
            destination: "local",
            localPage: page.path,
            publicUrl: "",
            image: "",
            imageMode: "asset",
            description: "Page locale ajoutée depuis le dossier de présentations.",
            languages: [],
            readmeFiles: [],
            private: false,
            fork: false,
        });
    }
}

// Prépare la configuration, charge les pages locales et lance la première lecture GitHub.
async function portfolioManagerInit() {
    pmConfig = loadDraftConfig() || await loadPublishedConfig();
    if (!Array.isArray(pmConfig.projects)) pmConfig.projects = [];
    const [localPages] = await Promise.all([
        loadLocalPageOptions(),
        loadImageOptions(),
    ]);
    // Ajoute une fiche uniquement pour les pages locales qui ne sont pas encore utilisées.
    // Si GitHub trouve ensuite le dépôt correspondant, cette fiche sera fusionnée avec lui.
    // Une page sans dépôt GitHub restera disponible comme projet local indépendant.
    addMissingLocalPagesToConfig(localPages);
    consolidateMergedProjects(pmConfig);
    // Nettoie les doublons qui pouvaient déjà être présents dans projects-config.json ou localStorage.
    mergeAutomaticLocalDuplicates(pmConfig);
    for (const project of pmConfig.projects) {
        if (project.id === "cle-de-fa" && !project.categoryOverride) project.categoryOverride = "wordpress";
        if (project.id === "projet-refuge" && !project.categoryOverride) project.categoryOverride = "php";
        if (project.id === "automatisation-m-moire") project.title = "Automatisation suivi qualité";
    }

    const savedToken = sessionStorage.getItem(PORTFOLIO_TOKEN_KEY) || "";
    const tokenInput = document.getElementById("pm-token");
    if (tokenInput && savedToken) tokenInput.value = savedToken;

    await portfolioRefresh(false);
}

// Recopie les choix visibles du tableau avant une actualisation pour ne rien perdre.
function preserveCurrentDashboardChoices() {
    if (document.querySelectorAll("[data-pm]").length && pmConfig) pmCollect(false);
}

// Récupère les langages par petits groupes afin de ne pas surcharger l’API GitHub.
async function loadLanguagesInBatches(repos, token, onProgress) {
    const result = new Map();
    const batchSize = 6;
    for (let start = 0; start < repos.length; start += batchSize) {
        const batch = repos.slice(start, start + batchSize);
        const values = await Promise.all(batch.map(async repo => [repo.name.toLowerCase(), await fetchLanguages(repo, token)]));
        values.forEach(([name, languages]) => result.set(name, languages));
        if (onProgress) onProgress(Math.min(start + batch.length, repos.length), repos.length);
    }
    return result;
}

// Vérifie par groupes si les dépôts utilisent Symfony ou WordPress.
async function loadFrameworksInBatches(repos, token, onProgress) {
    const result = new Map();
    const batchSize = 5;
    for (let start = 0; start < repos.length; start += batchSize) {
        const batch = repos.slice(start, start + batchSize);
        const values = await Promise.all(batch.map(async repo => [repo.name.toLowerCase(), await detectRepositoryFramework(repo, token)]));
        values.forEach(([name, framework]) => result.set(name, framework));
        if (onProgress) onProgress(Math.min(start + batch.length, repos.length), repos.length);
    }
    return result;
}

// Cherche les fichiers README de chaque dépôt par petits groupes.
async function loadReadmeFilesInBatches(repos, token, onProgress) {
    const result = new Map();
    const batchSize = 6;
    for (let start = 0; start < repos.length; start += batchSize) {
        const batch = repos.slice(start, start + batchSize);
        const values = await Promise.all(batch.map(async repo => [repo.name.toLowerCase(), await fetchRepositoryReadmeFiles(repo, token)]));
        values.forEach(([name, files]) => result.set(name, files));
        if (onProgress) onProgress(Math.min(start + batch.length, repos.length), repos.length);
    }
    return result;
}

// Recharge les dépôts, langages, frameworks et README puis reconstruit le tableau.
async function portfolioRefresh(keepCurrentChoices = true) {
    if (pmRefreshing) return;
    pmRefreshing = true;

    const status = document.getElementById("pm-status");
    const refreshButton = document.getElementById("pm-refresh-btn");
    if (keepCurrentChoices) preserveCurrentDashboardChoices();

    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Actualisation…";
    }

    status.className = "pending";
    status.textContent = "Chargement des dépôts GitHub…";

    try {
        const tokenInput = document.getElementById("pm-token");
        const enteredToken = tokenInput ? tokenInput.value.trim() : "";
        const token = enteredToken || sessionStorage.getItem(PORTFOLIO_TOKEN_KEY) || "";
        if (enteredToken) sessionStorage.setItem(PORTFOLIO_TOKEN_KEY, enteredToken);

        const starred = document.getElementById("pm-starred")?.checked === true;

        // On essaie d'abord avec le token pour récupérer les dépôts privés.
        // Si GitHub répond 401, le token n'est plus valable : on le retire et on continue avec les dépôts publics.
        let activeToken = token;
        try {
            pmRepos = await fetchRepositories(activeToken, starred);
        } catch (error) {
            if (error?.status !== 401 || !activeToken) throw error;

            sessionStorage.removeItem(PORTFOLIO_TOKEN_KEY);
            if (tokenInput) tokenInput.value = "";
            activeToken = "";

            status.className = "pending";
            status.textContent = "Token GitHub invalide ou expiré. Chargement des dépôts publics…";
            pmRepos = await fetchRepositories("", starred);
        }

        status.textContent = `Dépôts trouvés : ${pmRepos.length}. Lecture des langages…`;
        const languagesByRepo = await loadLanguagesInBatches(pmRepos, activeToken, (done, total) => {
            status.textContent = `Lecture des langages : ${done}/${total}…`;
        });
        status.textContent = "Détection de Symfony et WordPress…";
        const frameworksByRepo = await loadFrameworksInBatches(pmRepos, activeToken, (done, total) => {
            status.textContent = `Détection des frameworks : ${done}/${total}…`;
        });
        status.textContent = "Recherche des fichiers README…";
        const readmeFilesByRepo = await loadReadmeFilesInBatches(pmRepos, activeToken, (done, total) => {
            status.textContent = `Recherche des README : ${done}/${total}…`;
        });

        const existing = new Map((pmConfig.projects || []).map(project => [(project.repository || "").toLowerCase(), project]));

        for (const repo of pmRepos) {
            const key = repo.name.toLowerCase();
            const mergeRule = mergeRuleForRepository(repo.name);
            const mergedTarget = (mergeRule ? pmConfig.projects.find(project => project.id === mergeRule.targetId) : null)
                || findAutomaticLocalTarget(pmConfig, repo.name);
            const saved = mergedTarget || existing.get(key);
            const languageBytes = languagesByRepo.get(key) || {};
            const languages = Object.keys(languageBytes).sort((a,b) => (languageBytes[b] || 0) - (languageBytes[a] || 0));
            const primaryLanguage = dominantLanguage(languageBytes, languages);
            const detectedFramework = frameworksByRepo.get(key) || saved?.framework || "";
            const repoWithFramework = { ...repo, _framework: detectedFramework };
            const framework = detectFrameworkCategory(repoWithFramework, saved || {});
            const primaryCategory = framework?.category || languageCategory(primaryLanguage || "Autre");

            if (!saved) {
                const project = {
                    id: key,
                    repository: repo.name,
                    title: repo.name.replaceAll("-", " ").replaceAll("_", " "),
                    visible: false,
                    autoCategory: primaryCategory,
                    autoCategoryLabel: framework?.label || primaryLanguage || "Autre",
                    categoryOverride: "",
                    category: primaryCategory,
                    categoryLabel: framework?.label || primaryLanguage || "Autre",
                    categories: [primaryCategory],
                    destination: repo.homepage ? "demo" : "readme",
                    localPage: "",
                    publicUrl: repo.homepage || "",
                    image: "",
                    imageMode: repo.homepage ? "screenshot" : "github",
                    description: repo.description || "",
                    languages,
                    languageBytes,
                    primaryLanguage,
                    topics: repo.topics || [],
                    readmeFiles: readmeFilesByRepo.get(key) || [],
                    readmePath: (readmeFilesByRepo.get(key) || [])[0] || "",
                    private: repo.private,
                    fork: repo.fork,
                    framework: detectedFramework,
                };
                pmConfig.projects.push(project);
                existing.set(key, project);
            } else {
                saved.repository = repo.name;
                saved.private = repo.private;
                saved.fork = repo.fork;
                saved.framework = detectedFramework || saved.framework || "";
                saved.description = repo.description || saved.description || "";
                saved.languages = languages;
                saved.languageBytes = languageBytes;
                saved.primaryLanguage = primaryLanguage;
                saved.topics = repo.topics || [];
                saved.readmeFiles = readmeFilesByRepo.get(key) || saved.readmeFiles || [];
                if (!saved.readmePath || !saved.readmeFiles.includes(saved.readmePath)) saved.readmePath = saved.readmeFiles[0] || "";
                saved.autoCategory = primaryCategory;
                saved.autoCategoryLabel = framework?.label || primaryLanguage || "Autre";
                const selectedCategory = saved.categoryOverride || primaryCategory;
                saved.category = selectedCategory;
                saved.categoryLabel = saved.categoryOverride ? languageLabelFromSlug(saved.categoryOverride) : (framework?.label || primaryLanguage || "Autre");
                saved.categories = [selectedCategory];
                if (!saved.publicUrl && repo.homepage) saved.publicUrl = repo.homepage;
            }
        }

        consolidateMergedProjects(pmConfig);
        // Après la lecture GitHub, fusionne toute page locale qui partage un nom important avec un dépôt.
        // La page ne reste séparée que lorsqu'aucun dépôt ne lui ressemble réellement.
        mergeAutomaticLocalDuplicates(pmConfig);
        const automation = pmConfig.projects.find(project => project.id === "automatisation-m-moire");
        if (automation) automation.title = "Automatisation suivi qualité";
        saveDraftConfig(pmConfig);
        renderPM();

        const privateCount = pmRepos.filter(repo => repo.private).length;
        status.className = "ok";
        status.textContent = `${pmRepos.length} dépôt(s) récupéré(s), dont ${privateCount} privé(s). Tous les langages et frameworks ont été vérifiés.`;
        if (!activeToken) {
            status.className = "pending";
            status.textContent += " Les dépôts publics sont chargés. Ajoute un nouveau token pour récupérer aussi les dépôts privés.";
        }
    } catch (error) {
        console.error(error);
        status.className = "error-row";
        status.textContent = `Impossible d’actualiser GitHub : ${error.message}`;
    } finally {
        pmRefreshing = false;
        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.textContent = "Actualiser GitHub";
        }
    }
}

// Construit les options d’un menu déroulant sans créer de doublons.
function pmOptionList(values, selected, emptyLabel) {
    const unique = [...new Set((values || []).filter(Boolean))];
    const options = unique.map(value => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(value)}</option>`).join("");
    return `<option value="">${esc(emptyLabel)}</option>${options}`;
}

// Construit le menu des images du dossier image-accueil.
// Si une ancienne image se trouve ailleurs, elle est ajoutée temporairement pour ne pas perdre le réglage existant.
function pmImageOptionList(selected) {
    const values = [...pmImageOptions];
    if (selected && !values.some(image => image.path === selected)) {
        values.unshift({ path: selected, title: `Image actuelle — ${selected.split("/").pop()}` });
    }
    const options = values.map(image =>
        `<option value="${esc(image.path)}" ${image.path === selected ? "selected" : ""}>${esc(image.title)}</option>`
    ).join("");
    return `<option value="">Choisir une image dans image-accueil</option>${options}`;
}

// Affiche uniquement le réglage utile pour le mode d'image choisi.
function pmImageSettings(project) {
    const mode = project.imageMode || "asset";
    const assetSelect = `<label class="pm-image-setting pm-image-setting-asset"><span>Image de la carte</span><select class="pm-image">${pmImageOptionList(project.image || "")}</select></label>`;
    const legacyInfo = `<div class="pm-image-setting pm-image-setting-legacy"><span>Image actuelle</span><small>${esc(project.image || "L’image déjà associée à la carte sera conservée.")}</small></div>`;
    const screenshotInfo = `<div class="pm-image-setting pm-image-setting-screenshot"><span>Capture du site</span><small>La capture utilise le lien public du projet.</small></div>`;
    const githubInfo = `<div class="pm-image-setting pm-image-setting-github"><span>Image GitHub</span><small>L’image Open Graph du dépôt sera utilisée.</small></div>`;
    return `<div class="pm-image-settings" data-active="${esc(mode)}">${assetSelect}${legacyInfo}${screenshotInfo}${githubInfo}</div>`;
}

// Change immédiatement le réglage d'image visible sans recharger tout le tableau.
function pmUpdateImageRow(select) {
    const row = select.closest("tr");
    const settings = row?.querySelector(".pm-image-settings");
    if (settings) settings.dataset.active = select.value;
}

// Affiche le bon réglage selon la destination choisie pour « Voir plus ». 
function pmDestinationSettings(project, repo) {
    const destination = project.destination || "local";
    const localSelect = `<label class="pm-setting pm-setting-local"><span>Page locale</span><select class="pm-local">${pmOptionList(pmLocalPageOptions, project.localPage || "", "Choisir une page HTML")}</select></label>`;
    const publicInput = `<label class="pm-setting pm-setting-demo"><span>Lien public</span><input class="pm-public" value="${esc(project.publicUrl || repo?.homepage || "")}" placeholder="https://..."></label>`;
    const readmeSelect = `<label class="pm-setting pm-setting-readme"><span>Fichier README</span><select class="pm-readme-path">${pmOptionList(project.readmeFiles || [], project.readmePath || "", "Choisir un README du dépôt")}</select></label>`;
    const githubInfo = `<div class="pm-setting pm-setting-github"><span>Dépôt GitHub</span><small>Le lien GitHub direct n’est conseillé que pour un dépôt public.</small></div>`;
    return `<div class="pm-destination-settings" data-active="${esc(destination)}">${localSelect}${publicInput}${readmeSelect}${githubInfo}</div>`;
}

// Change immédiatement le champ visible quand la destination est modifiée.
function pmUpdateDestinationRow(select) {
    const row = select.closest("tr");
    const settings = row?.querySelector(".pm-destination-settings");
    if (settings) settings.dataset.active = select.value;
}

// Construit le menu des catégories automatiques et manuelles.
function pmCategoryChoices(project) {
    const known = new Map([
        ["autre", "Autre"], ["php", "PHP"], ["symfony", "Symfony"],
        ["wordpress", "WordPress"], ["html", "HTML"], ["css", "CSS"],
        ["javascript", "JavaScript"], ["jupyter-notebook", "Jupyter Notebook"],
        ["python", "Python"], ["typescript", "TypeScript"]
    ]);
    for (const item of (pmConfig.projects || [])) {
        for (const language of (item.languages || [])) known.set(languageCategory(language), language);
    }
    const auto = project.autoCategory || primaryProjectCategory({}, {...project, categoryOverride: ""}).category;
    const autoLabel = project.autoCategoryLabel || languageLabelFromSlug(auto);
    const selected = project.categoryOverride || "auto";
    const options = [`<option value="auto" ${selected === "auto" ? "selected" : ""}>Automatique — ${esc(autoLabel)}</option>`];
    [...known.entries()].sort((a,b) => a[1].localeCompare(b[1], "fr")).forEach(([slug,label]) => {
        options.push(`<option value="${esc(slug)}" ${selected === slug ? "selected" : ""}>${esc(label)}</option>`);
    });
    return options.join("");
}

// Filtre les lignes du tableau avec la même idée que la recherche de l'index.
// On compare le texte saisi avec le titre du projet et le nom de son dépôt GitHub.
function filterDashboardProjects() {
    const searchInput = document.getElementById("pm-search-input");
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const rows = document.querySelectorAll("#pm-body tr[data-pm]");
    const emptyMessage = document.getElementById("pm-search-empty");
    let hasVisibleProject = false;

    rows.forEach(row => {
        const projectName = row.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
        const repositoryName = row.querySelector("td:nth-child(3)")?.textContent.toLowerCase() || "";
        const matchesSearch = searchTerm === "" || projectName.includes(searchTerm) || repositoryName.includes(searchTerm);

        row.style.display = matchesSearch ? "" : "none";
        if (matchesSearch) hasVisibleProject = true;
    });

    if (emptyMessage) emptyMessage.style.display = hasVisibleProject || rows.length === 0 ? "none" : "block";
}

// Dessine une ligne du dashboard pour chaque projet connu.
function renderPM() {
    const repoMap = new Map(pmRepos.map(repo => [repo.name.toLowerCase(), repo]));
    const body = document.getElementById("pm-body");
    if (!body) return;

    // Affiche les dépôts GitHub et les vraies pages locales indépendantes.
    // Une page locale déjà fusionnée possède maintenant un dépôt : elle n’apparaît donc qu’une seule fois.
    const dashboardProjects = (pmConfig.projects || []).filter(project =>
        Boolean(project.repository) || Boolean(project.localPage)
    );

    body.innerHTML = dashboardProjects.map(project => {
        const repo = repoMap.get((project.repository || "").toLowerCase());
        const statusText = repo
            ? `${repo.private ? "🔒 Privé" : "🌍 Public"}${repo.fork ? " · Fork" : ""}`
            : project.repository
                ? `${project.private ? "🔒 Privé enregistré" : "Projet enregistré"} · non chargé actuellement`
                : "📄 Page locale";
        const languageHtml = (project.languages || []).length
            ? project.languages.map(language => `<span class="pm-chip" style="border-color:${languageColor(language)}">${esc(language)}</span>`).join("")
            : '<span class="pm-empty">Aucun langage détecté</span>';
        const primary = primaryProjectCategory(repo || {}, project);

        return `<tr data-pm="${esc(project.id || project.repository)}">
            <td><input class="pm-visible" type="checkbox" ${project.visible !== false ? "checked" : ""}></td>
            <td><strong>${esc(project.title)}</strong><br><small>${esc(statusText)}</small></td>
            <td>${esc(project.repository || "Page locale")}</td>
            <td><div class="pm-languages">${languageHtml}</div></td>
            <td><select class="pm-category" aria-label="Catégorie de ${esc(project.title)}">${pmCategoryChoices(project)}</select></td>
            <td><select class="pm-destination" onchange="pmUpdateDestinationRow(this)">
                <option value="local" ${project.destination === "local" ? "selected" : ""}>Page créée</option>
                <option value="demo" ${project.destination === "demo" ? "selected" : ""}>Lien public</option>
                <option value="readme" ${project.destination === "readme" ? "selected" : ""}>README local</option>
                <option value="github" ${project.destination === "github" ? "selected" : ""}>GitHub</option>
            </select></td>
            <td>${pmDestinationSettings(project, repo)}</td>
            <td>
                <select class="pm-image-mode" onchange="pmUpdateImageRow(this)">
                    <option value="legacy" ${project.imageMode === "legacy" ? "selected" : ""}>Image actuelle</option>
                    <option value="asset" ${project.imageMode === "asset" ? "selected" : ""}>Image image-accueil</option>
                    <option value="screenshot" ${project.imageMode === "screenshot" ? "selected" : ""}>Capture du site</option>
                    <option value="github" ${project.imageMode === "github" ? "selected" : ""}>Image GitHub</option>
                </select>
                ${pmImageSettings(project)}
            </td>
        </tr>`;
    }).join("");

    // Réapplique la recherche après une actualisation GitHub pour conserver le filtre saisi.
    filterDashboardProjects();
}

// Récupère toutes les valeurs saisies dans le tableau et les remet dans la configuration.
function pmCollect(updateDate = true) {
    document.querySelectorAll("[data-pm]").forEach(row => {
        const id = row.dataset.pm;
        const project = pmConfig.projects.find(item => (item.id || item.repository) === id);
        if (!project) return;
        project.visible = row.querySelector(".pm-visible").checked;
        const repo = pmRepos.find(r => r.name.toLowerCase() === String(project.repository || "").toLowerCase()) || {};
        const categoryChoice = row.querySelector(".pm-category")?.value || "auto";
        project.categoryOverride = categoryChoice === "auto" ? "" : categoryChoice;
        const primary = primaryProjectCategory(repo, project);
        project.category = primary.category;
        project.categoryLabel = primary.label;
        project.categories = [primary.category];
        project.destination = row.querySelector(".pm-destination").value;
        project.localPage = row.querySelector(".pm-local")?.value.trim() || "";
        project.publicUrl = row.querySelector(".pm-public")?.value.trim() || "";
        project.readmePath = row.querySelector(".pm-readme-path")?.value || "";
        project.imageMode = row.querySelector(".pm-image-mode").value;
        const selectedImage = row.querySelector(".pm-image")?.value || "";
        if (project.imageMode === "asset") project.image = selectedImage;
        // Dans les autres modes, on garde le chemin précédent pour pouvoir revenir à l'image assets plus tard.
    });
    if (updateDate) pmConfig.generatedAt = new Date().toISOString();
    return pmConfig;
}

// Copie localement le README des projets sélectionnés pour ne pas envoyer le visiteur sur GitHub.
async function pmSyncReadmes(config = pmConfig) {
    const tokenInput = document.getElementById("pm-token");
    const token = tokenInput?.value.trim() || sessionStorage.getItem(PORTFOLIO_TOKEN_KEY) || "";
    const repoMap = new Map(pmRepos.map(repo => [repo.name.toLowerCase(), repo]));
    const selected = (config.projects || []).filter(project =>
        project.visible !== false && project.destination === "readme" && project.repository
    );
    const status = document.getElementById("pm-status");

    for (let index = 0; index < selected.length; index++) {
        const project = selected[index];
        const repo = repoMap.get(project.repository.toLowerCase());
        if (!repo) continue;
        if (status) status.textContent = `Copie locale des README : ${index + 1}/${selected.length}…`;
        const markdown = await fetchReadmeMarkdown(repo, token, project.readmePath || "");
        if (markdown) {
            project.readmeMarkdown = markdown;
            project.readmeSnapshotAt = new Date().toISOString();
            project.readmeAvailable = true;
        } else {
            project.readmeAvailable = false;
            project.readmeMarkdown = "";
        }
    }
    return config;
}

// Enregistre les choix dans le navigateur pour pouvoir tester l’index immédiatement.
async function pmSave() {
    const button = document.activeElement;
    if (button?.tagName === "BUTTON") button.disabled = true;
    try {
        const config = pmCollect();
        await pmSyncReadmes(config);
        saveDraftConfig(config);
        document.getElementById("pm-message").textContent = "Sélection et README enregistrés. Recharge index.html pour tester.";
    } finally {
        if (button?.tagName === "BUTTON") button.disabled = false;
    }
}

// Télécharge projects-config.json pour publier les mêmes choix sur GitHub Pages.
async function pmExport() {
    const button = document.activeElement;
    if (button?.tagName === "BUTTON") button.disabled = true;
    try {
        const config = pmCollect();
        await pmSyncReadmes(config);
        saveDraftConfig(config);
        downloadConfig(config);
        document.getElementById("pm-message").textContent = "projects-config.json téléchargé avec les README copiés localement. Aucun token n’est exporté.";
    } finally {
        if (button?.tagName === "BUTTON") button.disabled = false;
    }
}

// Coche ou décoche toutes les lignes du tableau.
function pmAll(value) {
    document.querySelectorAll(".pm-visible").forEach(input => input.checked = value);
    document.getElementById("pm-message").textContent = "Sélection modifiée. Clique sur « Enregistrer pour tester » pour la conserver.";
}

// Efface le token GitHub temporaire de la session du navigateur.
function pmForgetToken() {
    sessionStorage.removeItem(PORTFOLIO_TOKEN_KEY);
    const input = document.getElementById("pm-token");
    if (input) input.value = "";
    document.getElementById("pm-message").textContent = "Token retiré de cette session.";
}

document.addEventListener("DOMContentLoaded", portfolioManagerInit);
