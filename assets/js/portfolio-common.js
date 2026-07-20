// =====================================================================
// NOTES PERSONNELLES
// Regroupe les fonctions partagées par l'index et le dashboard.
// Notes simples pour comprendre rapidement le rôle du fichier lors d’une future reprise.
// =====================================================================

// Le dashboard est dans /admin tandis que l'index est à la racine.
// La balise <base> du dashboard permet à ce chemin de fonctionner dans les deux pages.
const PORTFOLIO_CONFIG_URL = "./projects-config.json";
const PORTFOLIO_DRAFT_KEY = "portfolio-projects-draft-v22";
const PORTFOLIO_TOKEN_KEY = "portfolio-github-token-session";
const PORTFOLIO_GITHUB_USER = "leven-anju-yuki";

const PROJECT_MERGE_RULES = [
  { targetId: "projet-dragons", repositories: ["dragons", "dragon", "projet-dragons", "projet_dragon"] },
  { targetId: "projet-manga-jeux", repositories: ["mangagame", "manga-game", "manga_game", "projet-manga-jeux", "projet_manga_jeux"] },
  { targetId: "application-bibliotheque", repositories: ["appli-pour-les-livre-symfo", "appli-pour-les-livres-symfo", "appli_livre_symfo", "bibliotheque", "application-bibliotheque"] },
  { targetId: "numerisation-des-tickets-de-tissus", repositories: ["scanner-de-ticket", "scanner-de-tickets", "scanner_ticket", "numerisation-des-tickets-de-tissus"] },
  { targetId: "projet-epave", repositories: ["epave", "epaves", "projet-epave", "gestion-epaves", "gestion-des-epaves", "epaves-historiques", "gestion-epaves-historiques", "appli-pour-les-epaves-symfo", "appli_pour_les_epaves_symfo", "appli-pour-les-epaves", "application-epaves-symfo"] },
  { targetId: "projet-refuge", repositories: ["refuge", "projet-refuge", "gestion-refuge", "gestion-animaux", "application-refuge", "spa-refuge"] },
  { targetId: "magasin", repositories: ["magasin", "projet-magasin", "magasin-en-ligne", "boutique-lapin", "e-commerce-lapin"] },
  { targetId: "automatisation-m-moire", preferredTitle: "Automatisation suivi qualité", repositories: ["automatisation-m-moire", "automatisation-memoire", "automatisation-mémoire", "automatisation-suivi-qualite", "automatisation-suivi-qualité", "suivi-qualite", "suivi-qualité", "automatisation-qualite"] }
];

// Certains projets partagent un mot commun mais représentent des travaux différents.
// Cette liste empêche leur fusion automatique par erreur.
const PROJECTS_THAT_MUST_STAY_SEPARATE = [
  {
    repository: "nourriture-lapin",
    localIds: ["pot-au-lapin", "pot_au_lapin", "pot-au-lapin-html"]
  }
];

// Répare les anciennes configurations dans lesquelles Pot au lapin avait été fusionné
// par erreur avec le site Alimentation lapin.
function ensureKnownDistinctProjects(config) {
  if (!config || !Array.isArray(config.projects)) return config;

  const foodProject = config.projects.find(project =>
    normalizeProjectKey(project.repository) === "nourriture-lapin" || project.id === "alimentation-lapin"
  );

  if (foodProject) {
    foodProject.id = "alimentation-lapin";
    foodProject.repository = "nourriture-lapin";
    foodProject.title = "Alimentation lapin";
    foodProject.destination = "demo";
    foodProject.localPage = "";
    foodProject.publicUrl = foodProject.publicUrl || "https://leven-anju-yuki.github.io/nourriture-lapin/";
    foodProject.image = "https://api.microlink.io/?url=https://leven-anju-yuki.github.io/nourriture-lapin/&screenshot=true&meta=false&embed=screenshot.url";
    foodProject.imageMode = "legacy";
    foodProject.categoryOverride = "";
  }

  const potExists = config.projects.some(project => project.id === "pot-au-lapin");
  if (!potExists) {
    config.projects.push({
      id: "pot-au-lapin",
      repository: "",
      title: "Pot au lapin",
      visible: true,
      category: "autre",
      categoryOverride: "autre",
      categoryLabel: "Autre",
      categories: ["autre"],
      destination: "local",
      localPage: "Projet_qui_ne_sont_pas_en_lien/pot_au_lapin.html",
      publicUrl: "",
      image: "./assets/image/image-accueil/pot_au_lapin.png",
      imageMode: "legacy",
      description: "Projet de présentation autour d'une péniche, du bien-être animal et des lapins.",
      languages: [],
      topics: [],
      private: false,
      fork: false,
      readmePath: ""
    });
  }

  return config;
}

window.ensureKnownDistinctProjects = ensureKnownDistinctProjects;

// Transforme un titre ou un nom de dépôt en identifiant comparable.
function normalizeProjectKey(value) {
  return String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Cherche si un dépôt doit être fusionné avec une page locale déjà existante.
function mergeRuleForRepository(repositoryName) {
  const key = normalizeProjectKey(repositoryName);
  return PROJECT_MERGE_RULES.find(rule => rule.repositories.some(name => normalizeProjectKey(name) === key)) || null;
}

// Simplifie un mot pour reconnaître aussi les variantes singulier/pluriel.
// Exemple : "épaves" et "épave" deviennent comparables.
function simplifyProjectToken(token) {
  let value = String(token || "");
  if (value.length > 5 && value.endsWith("ies")) value = value.slice(0, -3) + "y";
  else if (value.length > 4 && value.endsWith("es")) value = value.slice(0, -2);
  else if (value.length > 3 && value.endsWith("s")) value = value.slice(0, -1);
  return value;
}

// Garde uniquement les mots qui décrivent vraiment le projet.
// Les mots génériques comme "projet", "application" ou "Symfony" ne servent pas à identifier un doublon.
function meaningfulProjectTokens(value) {
  const ignored = new Set(["projet","project","application","appli","app","pour","les","des","dans","avec","sans","de","du","la","le","en","symfo","symfony","php","web","site","gestion"]);
  return [...new Set(
    normalizeProjectKey(value)
      .split("-")
      .map(simplifyProjectToken)
      .filter(token => token.length > 2 && !ignored.has(token))
  )];
}

// Donne une note de ressemblance entre un dépôt GitHub et une page locale.
// Un mot important commun suffit lorsque ce mot est précis : épave, dragons, refuge, bibliothèque…
function projectNameSimilarity(repositoryName, localProject) {
  const repoKey = normalizeProjectKey(repositoryName);

  // Nourriture lapin et Pot au lapin sont deux projets différents malgré le mot « lapin ».
  const localKeys = [localProject.id, localProject.title, localProject.localPage]
    .map(normalizeProjectKey);
  const mustStaySeparate = PROJECTS_THAT_MUST_STAY_SEPARATE.some(rule =>
    normalizeProjectKey(rule.repository) === repoKey &&
    rule.localIds.some(id => localKeys.some(key => key.includes(normalizeProjectKey(id))))
  );
  if (mustStaySeparate) return 0;
  const candidates = [
    localProject.id,
    localProject.title,
    String(localProject.localPage || "").split("/").pop()?.replace(/\.html?$/i, "")
  ];
  const repoTokens = meaningfulProjectTokens(repositoryName);
  let bestScore = 0;

  for (const candidate of candidates) {
    const candidateKey = normalizeProjectKey(candidate);
    if (!candidateKey) continue;
    if (candidateKey === repoKey) return 100;

    // Reconnaît aussi un nom inclus dans l'autre, par exemple epave / appli-pour-les-epaves-symfo.
    if (candidateKey.length >= 4 && (repoKey.includes(candidateKey) || candidateKey.includes(repoKey))) {
      bestScore = Math.max(bestScore, 85);
    }

    const localTokens = meaningfulProjectTokens(candidate);
    const shared = repoTokens.filter(token => localTokens.includes(token));
    if (!shared.length) continue;

    const longestShared = Math.max(...shared.map(token => token.length));
    const coverage = shared.length / Math.max(1, Math.min(repoTokens.length, localTokens.length));
    let score = shared.length * 30 + coverage * 25 + Math.min(longestShared, 12);

    // Un mot long et précis commun est une correspondance forte à lui seul.
    if (longestShared >= 5) score += 20;
    bestScore = Math.max(bestScore, score);
  }
  return bestScore;
}

// Cherche automatiquement la page locale correspondant à un dépôt GitHub.
function findAutomaticLocalTarget(config, repositoryName) {
  if (!config || !Array.isArray(config.projects)) return null;
  let best = null;
  let bestScore = 0;

  for (const project of config.projects) {
    if (project.repository || !project.localPage) continue;
    const score = projectNameSimilarity(repositoryName, project);
    if (score > bestScore) {
      bestScore = score;
      best = project;
    }
  }

  // 55 évite de fusionner deux projets seulement parce qu'ils contiennent un mot trop vague.
  return bestScore >= 55 ? best : null;
}

// Nettoie les anciens doublons déjà enregistrés dans le navigateur.
// La fiche GitHub récupère la page, le titre et l'image de la fiche locale, puis la ligne locale est supprimée.
function mergeAutomaticLocalDuplicates(config) {
  if (!config || !Array.isArray(config.projects)) return config;
  ensureKnownDistinctProjects(config);
  const repositoryProjects = config.projects.filter(project => project.repository);

  for (const repositoryProject of repositoryProjects) {
    let bestLocal = null;
    let bestScore = 0;

    for (const localProject of config.projects) {
      if (localProject === repositoryProject || localProject.repository || !localProject.localPage) continue;
      const score = projectNameSimilarity(repositoryProject.repository, localProject);
      if (score > bestScore) {
        bestScore = score;
        bestLocal = localProject;
      }
    }

    if (!bestLocal || bestScore < 55) continue;

    // On garde la présentation créée à la main, mais les données techniques viennent de GitHub.
    repositoryProject.title = bestLocal.title || repositoryProject.title;
    repositoryProject.localPage = bestLocal.localPage || repositoryProject.localPage;
    repositoryProject.destination = "local";
    repositoryProject.image = bestLocal.image || repositoryProject.image;
    repositoryProject.imageMode = bestLocal.imageMode || repositoryProject.imageMode;
    repositoryProject.visible = repositoryProject.visible === true || bestLocal.visible === true;
    if (bestLocal.categoryOverride && !repositoryProject.categoryOverride) {
      repositoryProject.categoryOverride = bestLocal.categoryOverride;
    }

    config.projects = config.projects.filter(project => project !== bestLocal);
  }
  return config;
}

window.mergeAutomaticLocalDuplicates = mergeAutomaticLocalDuplicates;

// Lit les fichiers techniques du dépôt pour reconnaître Symfony ou WordPress.
async function detectRepositoryFramework(repo, token = "") {
  try {
    const content = await githubFetch(`https://api.github.com/repos/${repo.full_name}/contents/composer.json`, token);
    if (content && content.content) {
      const text = decodeURIComponent(escape(atob(content.content.replace(/\s/g, ""))));
      const composer = JSON.parse(text);
      const dependencies = { ...(composer.require || {}), ...(composer["require-dev"] || {}) };
      if (Object.keys(dependencies).some(name => name === "symfony/symfony" || name === "symfony/framework-bundle" || name.startsWith("symfony/"))) {
        return "Symfony";
      }
    }
  } catch (_) {}
  try {
    const root = await githubFetch(`https://api.github.com/repos/${repo.full_name}/contents`, token);
    const names = Array.isArray(root) ? root.map(item => String(item.name || "").toLowerCase()) : [];
    if (names.includes("wp-content") || names.includes("wp-config.php")) return "WordPress";
  } catch (_) {}
  return "";
}

// Fusionne les doublons tout en gardant l’image et la page locale déjà créées.
function consolidateMergedProjects(config) {
  if (!config || !Array.isArray(config.projects)) return config;
  ensureKnownDistinctProjects(config);
  for (const rule of PROJECT_MERGE_RULES) {
    const target = config.projects.find(project => project.id === rule.targetId);
    if (!target) continue;
    if (rule.preferredTitle) target.title = rule.preferredTitle;
    // Corrections métier connues : elles restent modifiables dans le dashboard.
    if (target.id === "cle-de-fa" && !target.categoryOverride) target.categoryOverride = "wordpress";
    if (target.id === "projet-refuge" && !target.categoryOverride) target.categoryOverride = "php";
    const duplicates = config.projects.filter(project => project !== target && rule.repositories.some(name => {
      const key = normalizeProjectKey(name);
      return normalizeProjectKey(project.repository) === key || normalizeProjectKey(project.id) === key;
    }));
    for (const duplicate of duplicates) {
      target.repository = duplicate.repository || target.repository || "";
      target.languages = duplicate.languages?.length ? duplicate.languages : (target.languages || []);
      target.languageBytes = Object.keys(duplicate.languageBytes || {}).length ? duplicate.languageBytes : (target.languageBytes || {});
      target.primaryLanguage = duplicate.primaryLanguage || target.primaryLanguage || "";
      target.topics = duplicate.topics?.length ? duplicate.topics : (target.topics || []);
      target.private = duplicate.private ?? target.private;
      target.fork = duplicate.fork ?? target.fork;
      target.framework = duplicate.framework || target.framework || "";
      target.description = duplicate.description || target.description || "";
      target.publicUrl = target.publicUrl || duplicate.publicUrl || "";
      // On garde toujours l'image et la page de présentation historiques.
      if (!target.image && duplicate.image) target.image = duplicate.image;
      if (!target.localPage && duplicate.localPage) target.localPage = duplicate.localPage;
      target.destination = target.localPage ? "local" : (target.destination || duplicate.destination);
      target.visible = target.visible !== false || duplicate.visible !== false;
      config.projects = config.projects.filter(project => project !== duplicate);
    }
  }
  return config;
}

// Effectue une requête GitHub et ajoute le token seulement lorsqu’il existe.
async function githubFetch(url, token = "") {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  // Le token n'est ajouté que pour lire les dépôts privés.
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });

  // On garde le numéro HTTP dans l'erreur pour pouvoir réagir proprement à un token invalide.
  if (!response.ok) {
    const error = new Error(`GitHub ${response.status} : ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}
// Parcourt toutes les pages de résultats de l’API GitHub.
async function fetchPaged(url, token="") {
  const all=[]; for(let page=1;;page++){
    const join=url.includes('?')?'&':'?'; const batch=await githubFetch(`${url}${join}per_page=100&page=${page}`,token);
    all.push(...batch); if(batch.length<100) break;
  } return all;
}
// Récupère les dépôts publics et privés autorisés, puis éventuellement les favoris.
async function fetchRepositories(token="", includeStarred=false) {
  const base = token ? "https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&visibility=all&sort=updated" : `https://api.github.com/users/${PORTFOLIO_GITHUB_USER}/repos?type=all&sort=updated`;
  const owned=await fetchPaged(base,token);
  let starred=[]; if(includeStarred) starred=await fetchPaged(`https://api.github.com/users/${PORTFOLIO_GITHUB_USER}/starred`,token);
  const map=new Map(); [...owned,...starred].forEach(r=>map.set(r.full_name,r));
  return [...map.values()];
}
// Récupère la quantité de code utilisée pour chaque langage du dépôt.
async function fetchLanguages(repo, token="") { try { return await githubFetch(repo.languages_url,token); } catch { return {}; } }
// Liste tous les README présents à la racine ou dans les sous-dossiers.
async function fetchRepositoryReadmeFiles(repo, token="") {
  if (!repo || !repo.full_name) return [];
  try {
    const branch = encodeURIComponent(repo.default_branch || "main");
    const tree = await githubFetch(`https://api.github.com/repos/${repo.full_name}/git/trees/${branch}?recursive=1`, token);
    return (tree.tree || [])
      .filter(item => item.type === "blob" && /(^|\/)readme(?:[-_. ][^\/]*)?\.(md|markdown|txt)$/i.test(item.path || ""))
      .map(item => item.path)
      .sort((a, b) => {
        const aRoot = a.includes("/") ? 1 : 0;
        const bRoot = b.includes("/") ? 1 : 0;
        return aRoot - bRoot || a.localeCompare(b, "fr", { sensitivity: "base" });
      });
  } catch (error) {
    console.warn(`Liste des README non récupérée pour ${repo.full_name}`, error);
    return [];
  }
}
// Télécharge le texte du README choisi pour le copier dans la configuration.
async function fetchReadmeMarkdown(repo, token="", readmePath="") {
  if (!repo || !repo.full_name) return "";
  const headers = {
    Accept: "application/vnd.github.raw+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const endpoint = readmePath
      ? `https://api.github.com/repos/${repo.full_name}/contents/${readmePath.split("/").map(encodeURIComponent).join("/")}`
      : `https://api.github.com/repos/${repo.full_name}/readme`;
    const response = await fetch(endpoint, { headers });
    if (response.status === 404) return "";
    if (!response.ok) throw new Error(`GitHub ${response.status} : ${response.statusText}`);
    return await response.text();
  } catch (error) {
    console.warn(`README non récupéré pour ${repo.full_name}`, error);
    return "";
  }
}
// Construit le lien vers la page locale qui met le README en forme.
function localReadmeUrl(project) {
  return `./readme.html?project=${encodeURIComponent(project.id || project.repository || "")}`;
}
// Lit projects-config.json publié à la racine du portfolio.
async function loadPublishedConfig(){ try { const r=await fetch(`${PORTFOLIO_CONFIG_URL}?v=${Date.now()}`); if(!r.ok) throw 0; return await r.json(); } catch { return {githubUser:PORTFOLIO_GITHUB_USER,projects:[]}; } }
// Lit le brouillon enregistré dans le navigateur par le dashboard.
function loadDraftConfig(){ try{return JSON.parse(localStorage.getItem(PORTFOLIO_DRAFT_KEY));}catch{return null;} }
// Enregistre le brouillon du dashboard dans le navigateur.
function saveDraftConfig(c){localStorage.setItem(PORTFOLIO_DRAFT_KEY,JSON.stringify(c));}
// Protège un texte avant de l’insérer dans du HTML.
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}

const LANGUAGE_META = {
  "HTML": { slug: "html", color: "#e34c26" },
  "CSS": { slug: "css", color: "#563d7c" },
  "JavaScript": { slug: "javascript", color: "#f1e05a" },
  "TypeScript": { slug: "typescript", color: "#3178c6" },
  "PHP": { slug: "php", color: "#4F5D95" },
  "Python": { slug: "python", color: "#3572A5" },
  "Jupyter Notebook": { slug: "jupyter-notebook", color: "#DA5B0B" },
  "Java": { slug: "java", color: "#b07219" },
  "C#": { slug: "c-sharp", color: "#178600" },
  "C++": { slug: "c-plus-plus", color: "#f34b7d" },
  "C": { slug: "c", color: "#555555" },
  "Shell": { slug: "shell", color: "#89e051" },
  "SCSS": { slug: "scss", color: "#c6538c" },
  "Twig": { slug: "twig", color: "#c1d026" },
  "Vue": { slug: "vue", color: "#41b883" },
  "Dart": { slug: "dart", color: "#00B4AB" },
  "Ruby": { slug: "ruby", color: "#701516" },
  "Kotlin": { slug: "kotlin", color: "#A97BFF" },
  "Swift": { slug: "swift", color: "#F05138" },
  "Go": { slug: "go", color: "#00ADD8" },
  "Rust": { slug: "rust", color: "#dea584" },
  "Symfony": { slug: "symfony", color: "#000000" },
  "WordPress": { slug: "wordpress", color: "#21759b" },
  "Autre": { slug: "autre", color: "#6c757d" }
};

// Transforme un langage GitHub en nom de catégorie utilisable dans le CSS.
function languageCategory(language) {
  const raw = String(language || '').trim();
  if (LANGUAGE_META[raw]) return LANGUAGE_META[raw].slug;
  const slug = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'autre';
}
// Transforme le nom technique d’une catégorie en libellé lisible.
function languageLabelFromSlug(slug) {
  const found = Object.entries(LANGUAGE_META).find(([,meta]) => meta.slug === slug);
  return found ? found[0] : String(slug || 'autre').replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
}
// Retourne la couleur associée au langage ou à la catégorie.
function languageColor(languageOrSlug) {
  const byName = LANGUAGE_META[languageOrSlug];
  if (byName) return byName.color;
  const found = Object.values(LANGUAGE_META).find(meta => meta.slug === languageOrSlug);
  return found ? found.color : '#e18207';
}
// Supprime les doublons dans une liste de catégories issues des langages.
function languageCategories(languages = []) { return [...new Set(languages.filter(Boolean).map(languageCategory))]; }
// Choisit le langage qui représente le plus grand nombre d’octets de code.
function dominantLanguage(languageBytes = {}, languages = []) {
  const entries = Object.entries(languageBytes || {}).sort((a,b) => b[1]-a[1]);
  return entries[0]?.[0] || languages[0] || '';
}
// Donne la priorité à Symfony ou WordPress sur le simple langage PHP.
function detectFrameworkCategory(repo = {}, project = {}) {
  const explicit = String(project.framework || repo._framework || '').toLowerCase();
  if (explicit === 'symfony') return { category: 'symfony', label: 'Symfony' };
  if (explicit === 'wordpress') return { category: 'wordpress', label: 'WordPress' };
  const text = [repo.name, repo.description, ...(repo.topics || []), project.title, project.description, project.localPage]
    .filter(Boolean).join(' ').toLowerCase();
  if (/symfony|symfo/.test(text)) return { category: 'symfony', label: 'Symfony' };
  if (/wordpress|word-press|wp-/.test(text)) return { category: 'wordpress', label: 'WordPress' };
  return null;
}
// Choisit une seule catégorie principale, automatique ou imposée manuellement.
function primaryProjectCategory(repo = {}, project = {}) {
  if (project.categoryOverride) {
    return { category: project.categoryOverride, label: languageLabelFromSlug(project.categoryOverride) };
  }
  const framework = detectFrameworkCategory(repo, project);
  if (framework) return framework;
  const primary = project.primaryLanguage || dominantLanguage(project.languageBytes || repo._languageBytes || {}, project.languages || Object.keys(repo._languages || {}));
  return { category: languageCategory(primary || 'Autre'), label: primary || 'Autre' };
}
// Retourne rapidement la catégorie principale d’un projet.
function inferCategory(repo,setting={}) { return primaryProjectCategory(repo, setting).category; }
// Choisit le lien final du bouton « Voir plus ». 
function destination(repo,p){ if(p.destination==='local'&&p.localPage)return p.localPage; if(p.destination==='demo'&&(p.publicUrl||repo.homepage))return p.publicUrl||repo.homepage; if(p.destination==='readme')return p.readmeMarkdown ? localReadmeUrl(p) : (p.private ? localReadmeUrl(p) : `${repo.html_url}#readme`); if(p.destination==='github')return repo.html_url; return p.localPage||p.publicUrl||repo.homepage||(p.readmeMarkdown?localReadmeUrl(p):`${repo.html_url}#readme`); }
// Choisit l’image de la carte selon le mode sélectionné dans le dashboard.
function projectImage(repo,p){ if(p.imageMode==='legacy'&&p.image)return p.image; if(p.imageMode==='asset'&&p.image)return p.image; if(p.imageMode==='screenshot'){const u=p.publicUrl||repo.homepage; if(u)return `https://api.microlink.io/?url=${encodeURIComponent(u)}&screenshot=true&meta=false&embed=screenshot.url`; } if(p.imageMode==='github')return `https://opengraph.githubassets.com/1/${repo.full_name}`; return p.image||`https://opengraph.githubassets.com/1/${repo.full_name}`; }
// Crée le fichier projects-config.json et lance son téléchargement.
function downloadConfig(c){const b=new Blob([JSON.stringify(c,null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='projects-config.json';a.click();URL.revokeObjectURL(u);}
