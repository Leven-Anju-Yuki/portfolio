// =====================================================================
// NOTES PERSONNELLES
// Affiche un README enregistré sans envoyer le visiteur sur GitHub.
// Notes simples pour comprendre rapidement le rôle du fichier lors d’une future reprise.
// =====================================================================

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

    document.title = `${project.title || project.repository} - Portfolio`;
    title.textContent = project.title || project.repository || "Projet";
    description.textContent = project.description || "";
    tags.innerHTML = (project.languages || []).map(language =>
        `<span style="--language-color:${languageColor(language)}">${esc(language)}</span>`
    ).join("");

    if (!project.readmeMarkdown) {
        content.innerHTML = `<p>Le README n’a pas encore été copié dans le portfolio. Retourne dans le dashboard, choisis « README », puis enregistre ou exporte la configuration.</p>`;
        return;
    }

    content.innerHTML = renderSafeMarkdown(project.readmeMarkdown);
});

// Convertit les éléments simples du Markdown comme le gras, les liens et les images.
function renderInlineMarkdown(text) {
    return text
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/__([^_]+)__/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/_([^_]+)_/g, "<em>$1</em>")
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
            if (/^https?:\/\//i.test(url)) return `<img src="${url}" alt="${alt}" loading="lazy">`;
            return `<span class="readme-image-note">🖼️ ${alt || "Image du README"} (image interne non publiée)</span>`;
        })
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
            if (/^https?:\/\//i.test(url)) return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
            return `<span class="readme-relative-link">${label}</span>`;
        });
}

// Transforme le README en HTML après avoir neutralisé le code dangereux.
function renderSafeMarkdown(markdown) {
    const escaped = esc(markdown).replace(/\r\n/g, "\n");
    const lines = escaped.split("\n");
    const html = [];
    let inCode = false;
    let code = [];
    let listType = "";

// Ferme proprement la liste Markdown en cours avant de changer de bloc.
    function closeList() {
        if (listType) html.push(`</${listType}>`);
        listType = "";
    }

    for (const line of lines) {
        if (line.startsWith("```")) {
            closeList();
            if (!inCode) { inCode = true; code = []; }
            else { html.push(`<pre><code>${code.join("\n")}</code></pre>`); inCode = false; }
            continue;
        }
        if (inCode) { code.push(line); continue; }
        if (!line.trim()) { closeList(); continue; }

        const heading = line.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
            closeList();
            const level = heading[1].length;
            html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
            continue;
        }
        const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
        if (unordered) {
            if (listType !== "ul") { closeList(); listType = "ul"; html.push("<ul>"); }
            html.push(`<li>${renderInlineMarkdown(unordered[1])}</li>`);
            continue;
        }
        const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
        if (ordered) {
            if (listType !== "ol") { closeList(); listType = "ol"; html.push("<ol>"); }
            html.push(`<li>${renderInlineMarkdown(ordered[1])}</li>`);
            continue;
        }
        const quote = line.match(/^&gt;\s?(.*)$/);
        if (quote) { closeList(); html.push(`<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`); continue; }
        if (/^(-{3,}|\*{3,})$/.test(line.trim())) { closeList(); html.push("<hr>"); continue; }
        closeList();
        html.push(`<p>${renderInlineMarkdown(line)}</p>`);
    }
    closeList();
    if (inCode) html.push(`<pre><code>${code.join("\n")}</code></pre>`);
    return html.join("\n");
}
