// =====================================================================
// ACCÈS AU DASHBOARD
// =====================================================================
// Le mot de passe n'est pas écrit en clair : seul son hash SHA-256 est gardé.
// Cette protection suffit pour décourager un visiteur ordinaire sur un site statique.

const DASHBOARD_CODE_HASH = "862952ddccaf02d8b0b4769112b0f26c0af6cd4ae815b088d689c954cc09ee8b";
const DASHBOARD_PATH = "./admin/dashboard.html";
const DASHBOARD_SESSION_KEY = "portfolio-dashboard-authorized";
const DASHBOARD_ATTEMPTS_KEY = "portfolio-dashboard-attempts";
const DASHBOARD_MAX_ATTEMPTS = 5;
let dashboardCheckRunning = false;

// Calcule le hash du code saisi pour pouvoir le comparer sans stocker le code réel.
async function hashDashboardCode(value) {
    const encodedValue = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedValue);
    return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

// Affiche la demande de mot de passe et bloque après cinq erreurs dans le même onglet.
async function requestDashboardAccess() {
    const attempts = Number(sessionStorage.getItem(DASHBOARD_ATTEMPTS_KEY) || "0");
    if (attempts >= DASHBOARD_MAX_ATTEMPTS) {
        window.alert("Trop de tentatives. Ferme cet onglet avant de réessayer.");
        return false;
    }

    const code = window.prompt("Code à 4 chiffres :");
    if (code === null) return false;

    if (await hashDashboardCode(code.trim()) === DASHBOARD_CODE_HASH) {
        sessionStorage.setItem(DASHBOARD_SESSION_KEY, "yes");
        sessionStorage.removeItem(DASHBOARD_ATTEMPTS_KEY);
        return true;
    }

    sessionStorage.setItem(DASHBOARD_ATTEMPTS_KEY, String(attempts + 1));
    window.alert("Code incorrect.");
    return false;
}

// Ouvre le dashboard depuis le cadenas de l'index après validation du mot de passe.
async function openDashboardPrompt() {
    const authorized = sessionStorage.getItem(DASHBOARD_SESSION_KEY) === "yes";
    if (authorized || await requestDashboardAccess()) {
        window.location.href = DASHBOARD_PATH;
    }
}

// Vérifie aussi l'adresse directe du dashboard, pas seulement le bouton cadenas.
async function protectDashboardPage(forcePassword = false) {
    if (document.body?.dataset.protectedDashboard !== "true" || dashboardCheckRunning) return;
    dashboardCheckRunning = true;

    try {
        if (forcePassword) sessionStorage.removeItem(DASHBOARD_SESSION_KEY);
        const authorized = sessionStorage.getItem(DASHBOARD_SESSION_KEY) === "yes";
        if (!authorized && !(await requestDashboardAccess())) {
            window.location.replace(new URL("../index.html", window.location.href));
            return;
        }
        document.body.classList.remove("dashboard-auth-pending");
    } finally {
        dashboardCheckRunning = false;
    }
}

// Quand on quitte le dashboard, l'autorisation est retirée.
// Ainsi, la flèche « page précédente » redemande bien le mot de passe.
window.addEventListener("pagehide", () => {
    if (document.body?.dataset.protectedDashboard === "true") {
        sessionStorage.removeItem(DASHBOARD_SESSION_KEY);
    }
});

// Le navigateur peut restaurer une ancienne page depuis son cache avec la flèche retour.
// L'évènement pageshow permet de relancer la protection dans ce cas précis.
window.addEventListener("pageshow", (event) => {
    if (document.body?.dataset.protectedDashboard !== "true") return;
    const navigation = performance.getEntriesByType("navigation")[0];
    const cameFromHistory = event.persisted || navigation?.type === "back_forward";
    protectDashboardPage(cameFromHistory);
});

document.addEventListener("DOMContentLoaded", () => protectDashboardPage(false));
