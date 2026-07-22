// =====================================================================
// AFFICHAGE LOCAL DES README
// =====================================================================
// Le README et ses petites images sont copiés dans projects-config.json
// depuis le dashboard. Le visiteur n'a donc pas besoin d'ouvrir GitHub.
// =====================================================================

let currentReadmeProject = null;

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project") || "";
    const title = document.getElementById("readme-title");
    const description = document.getElementById("readme-description");
    const tags = document.getElementById("readme-tags");
    const content = document.getElementById("readme-content");

    const published = await loadPublishedConfig();
    const draft = loadDraftConfig();
    const config = consolidateMergedProjects(draft || published);
    const project = (config.projects || []).find(item =>
        String(item.id || item.repository || "") === projectId
    );

    if (!project) {
        title.textContent = "Projet introuvable";
        content.innerHTML = "<p>Cette présentation n’existe pas dans la configuration publiée.</p>";
        return;
    }

    currentReadmeProject = project;

    // Affiche dans la page README la même image que celle de la carte d'accueil.
    displayProjectCover(project);
    document.title = `${project.title || project.repository} - Portfolio`;
    title.textContent = project.title || project.repository || "Projet";
    description.textContent = project.description || "";
    tags.innerHTML = (project.languages || []).map(language =>
        `<span style="--language-color:${languageColor(language)}">${esc(language)}</span>`
    ).join("");

    if (!project.readmeMarkdown) {
        content.innerHTML = `<p>Le README n’a pas encore été copié dans le portfolio. Retourne dans le dashboard, choisis « README local », sélectionne le fichier, puis enregistre la configuration.</p>`;
        return;
    }

    content.innerHTML = renderSafeMarkdown(project.readmeMarkdown, project);
});



// Affiche l'image choisie dans le dashboard pour la carte du projet.
// Aucune deuxième image n'est à renseigner : on utilise directement project.image.
function displayProjectCover(project) {
    const container = document.getElementById("readme-cover-container");
    const image = document.getElementById("readme-cover");

    if (!container || !image) return;

    const imageUrl = String(project?.image || "").trim();

    // Si aucune image n'a été choisie, la zone reste complètement masquée.
    if (!imageUrl) {
        container.hidden = true;
        image.removeAttribute("src");
        return;
    }

    image.src = imageUrl;
    image.alt = `Illustration du projet ${project.title || project.repository || ""}`;

    // Une ancienne adresse d'image ne doit pas laisser une icône cassée.
    image.onerror = () => {
        container.hidden = true;
        image.removeAttribute("src");
    };

    container.hidden = false;
}

// Retrouve une image relative qui a été copiée par le dashboard.
function resolveReadmeImage(project, originalUrl) {
    const clean = String(originalUrl || "").trim();
    if (!clean) return "";
    if (/^(https?:|data:)/i.test(clean)) return clean;

    const assets = project.readmeAssets || {};
    if (assets[clean]) return assets[clean];

    if (typeof resolveRepositoryRelativePath === "function") {
        const resolved = resolveRepositoryRelativePath(project.readmePath || "", clean);
        if (assets[resolved]) return assets[resolved];
    }

    return "";
}

// Fabrique une balise image sûre. Si l'image privée n'a pas été copiée,
// un message clair est affiché à la place d'une image cassée.
function renderReadmeImage(project, url, alt = "", width = "") {
    const source = resolveReadmeImage(project, url);
    if (!source) {
        return `<span class="readme-image-note">🖼️ ${esc(alt || "Image du README")} — retourne dans le dashboard et enregistre de nouveau le README pour copier l’image.</span>`;
    }

    const numericWidth = String(width || "").match(/^\d{1,4}$/)?.[0];
    const widthAttribute = numericWidth ? ` style="max-width:${numericWidth}px"` : "";
    return `<img class="readme-inline-image" src="${esc(source)}" alt="${esc(alt)}" loading="lazy"${widthAttribute}>`;
}

// Convertit le Markdown présent à l'intérieur d'une ligne de texte.
function renderInlineMarkdown(text, project) {
    const placeholders = [];
    const protect = html => {
        const token = `@@README_TOKEN_${placeholders.length}@@`;
        placeholders.push(html);
        return token;
    };

    // Images Markdown : ![texte](image.png)
    let prepared = String(text || "").replace(
        /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g,
        (match, alt, url) => protect(renderReadmeImage(project, url, alt))
    );

    // On protège tout le reste avant de créer les balises autorisées.
    prepared = esc(prepared)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/__([^_]+)__/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/_([^_]+)_/g, "<em>$1</em>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="readme-relative-link">$1</span>');

    placeholders.forEach((html, index) => {
        prepared = prepared.replace(`@@README_TOKEN_${index}@@`, html);
    });

    return prepared;
}

// Autorise uniquement les quelques balises HTML souvent utilisées dans les README.
function renderAllowedHtmlLine(line, project) {
    const trimmed = line.trim();

    if (/^<p\b[^>]*align=["']?center["']?[^>]*>$/i.test(trimmed)) {
        return '<div class="readme-center">';
    }
    if (/^<\/p>$/i.test(trimmed)) return "</div>";
    if (/^<br\s*\/?>$/i.test(trimmed)) return "<br>";

    const image = trimmed.match(/^<img\b([^>]*)>$/i);
    if (image) {
        const attributes = image[1];
        const src = attributes.match(/\bsrc=["']([^"']+)["']/i)?.[1] || "";
        const alt = attributes.match(/\balt=["']([^"']*)["']/i)?.[1] || "";
        const width = attributes.match(/\bwidth=["']?(\d+)["']?/i)?.[1] || "";
        return renderReadmeImage(project, src, alt, width);
    }

    return null;
}

// Transforme le README en HTML sans exécuter de script ni de code dangereux.
function renderSafeMarkdown(markdown, project) {
    const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let inCode = false;
    let code = [];
    let listType = "";

    function closeList() {
        if (listType) html.push(`</${listType}>`);
        listType = "";
    }

    for (const originalLine of lines) {
        const line = originalLine;

        if (line.startsWith("```")) {
            closeList();
            if (!inCode) {
                inCode = true;
                code = [];
            } else {
                html.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
                inCode = false;
            }
            continue;
        }

        if (inCode) {
            code.push(line);
            continue;
        }

        const allowedHtml = renderAllowedHtmlLine(line, project);
        if (allowedHtml !== null) {
            closeList();
            html.push(allowedHtml);
            continue;
        }

        if (!line.trim()) {
            closeList();
            continue;
        }

        const heading = line.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
            closeList();
            const level = heading[1].length;
            html.push(`<h${level}>${renderInlineMarkdown(heading[2], project)}</h${level}>`);
            continue;
        }

        const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
        if (unordered) {
            if (listType !== "ul") {
                closeList();
                listType = "ul";
                html.push("<ul>");
            }
            html.push(`<li>${renderInlineMarkdown(unordered[1], project)}</li>`);
            continue;
        }

        const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
        if (ordered) {
            if (listType !== "ol") {
                closeList();
                listType = "ol";
                html.push("<ol>");
            }
            html.push(`<li>${renderInlineMarkdown(ordered[1], project)}</li>`);
            continue;
        }

        const quote = line.match(/^>\s?(.*)$/);
        if (quote) {
            closeList();
            html.push(`<blockquote>${renderInlineMarkdown(quote[1], project)}</blockquote>`);
            continue;
        }

        if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
            closeList();
            html.push("<hr>");
            continue;
        }

        closeList();
        html.push(`<p>${renderInlineMarkdown(line, project)}</p>`);
    }

    closeList();
    if (inCode) html.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
    return html.join("\n");
}
