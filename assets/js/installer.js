// =====================================================================
// INSTALLATION DU PORTFOLIO COMME APPLICATION
// Ce fichier affiche le bouton seulement lorsque le navigateur autorise
// réellement l'installation de la PWA.
// =====================================================================

// Sur GitHub Pages, le portfolio est dans un sous-dossier.
// Un chemin relatif évite de chercher sw.js à la racine du domaine.
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").then(
            (registration) => {
                console.log(
                    "Service Worker enregistré avec le scope :",
                    registration.scope
                );
            },
            (error) => {
                console.log(
                    "Échec de l'enregistrement du Service Worker :",
                    error
                );
            }
        );
    });
}

// L'événement d'installation est conservé jusqu'au clic de l'utilisateur.
let deferredPrompt = null;

// Le bouton peut ne pas être présent sur toutes les pages.
const installButton = document.getElementById("installButton");

if (installButton) {
    // Le bouton reste caché tant que Chrome ne propose pas l'installation.
    installButton.style.display = "none";

    window.addEventListener("beforeinstallprompt", (event) => {
        // Empêche Chrome d'afficher sa propre bannière automatiquement.
        event.preventDefault();

        // Garde l'événement pour l'utiliser lors du clic.
        deferredPrompt = event;

        // inline-flex permet au texte et à l'icône de rester bien alignés.
        installButton.style.display = "inline-flex";
    });

    installButton.addEventListener("click", async () => {
        if (!deferredPrompt) return;

        // Ouvre la fenêtre officielle d'installation du navigateur.
        deferredPrompt.prompt();

        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
            console.log("Installation acceptée.");
        } else {
            console.log("Installation annulée.");
        }

        // L'invite ne peut être utilisée qu'une fois.
        deferredPrompt = null;
        installButton.style.display = "none";
    });

    window.addEventListener("appinstalled", () => {
        // Une fois installée, l'application n'a plus besoin du bouton.
        deferredPrompt = null;
        installButton.style.display = "none";
        console.log("Le portfolio a été installé.");
    });
}
