// Le dashboard est disponible sans code uniquement sur cette machine.
function isLocalDashboardHost(location = window.location) {
    return location.protocol === "file:"
        || ["localhost", "127.0.0.1", "[::1]", "::1"].includes(location.hostname.toLowerCase())
        || location.hostname.toLowerCase().endsWith(".localhost");
}

function updateDashboardAccess() {
    const local = isLocalDashboardHost();
    if (document.body?.dataset.protectedDashboard === "true") {
        if (!local) {
            window.location.replace(new URL("index.html", document.baseURI));
            return;
        }
        document.body.classList.remove("dashboard-auth-pending");
    }

    if (!local || document.querySelector("[data-local-dashboard-link]")) return;
    const navigation = document.querySelector("header .navbar-nav");
    if (!navigation) return;
    const item = document.createElement("li");
    item.className = "nav-item";
    item.dataset.localDashboardLink = "true";
    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = new URL("../../admin/dashboard.html", dashboardAccessScriptUrl).href;
    link.textContent = "Dashboard";
    if (document.body?.dataset.protectedDashboard === "true") {
        link.setAttribute("aria-current", "page");
    }
    item.appendChild(link);
    navigation.appendChild(item);
}

const dashboardAccessScriptUrl = document.currentScript.src;
// La page reste masquee par son CSS pendant la redirection en ligne.
if (!isLocalDashboardHost() && /\/admin\/dashboard\.html$/.test(window.location.pathname)) {
    window.location.replace(new URL("../../index.html", dashboardAccessScriptUrl));
}
document.addEventListener("DOMContentLoaded", updateDashboardAccess);
window.addEventListener("pageshow", updateDashboardAccess);
