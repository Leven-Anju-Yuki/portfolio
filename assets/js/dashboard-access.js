// =====================================================================
// Accès protégé au dashboard
// =====================================================================
// Code à 4 chiffres à modifier ici si besoin :
const DASHBOARD_CODE = '2653';

// Chemin vers le dashboard depuis index.html
const DASHBOARD_PATH = './dashboard.html';

function openDashboardPrompt() {
    let code = window.prompt('Code à 4 chiffres :');

    if (code === null) {
        // l'utilisateur a annulé, on ne fait rien
        return;
    }

    if (code.trim() === DASHBOARD_CODE) {
        window.location.href = DASHBOARD_PATH;
    } else {
        window.alert('Code incorrect.');
    }
}
