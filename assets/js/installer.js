// =====================================================================
// INSTALLATION DU PORTFOLIO COMME APPLICATION
// Ce fichier affiche le bouton seulement lorsque le navigateur autorise
// réellement l'installation de la PWA.
// =====================================================================

// Aucun service worker en local pour eviter les anciennes versions en cache.
const portfolioWorkerUrl = new URL("../../sw.js", document.currentScript.src);
const portfolioLocalHost = location.protocol === "file:"
    || ["localhost", "127.0.0.1", "[::1]", "::1"].includes(location.hostname)
    || location.hostname.endsWith(".localhost");
if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", async () => {
        try {
            if (portfolioLocalHost) {
                const scope = new URL("./", portfolioWorkerUrl).href;
                const registrations = await navigator.serviceWorker.getRegistrations();
                let removed = false;
                for (const registration of registrations) {
                    if (registration.scope === scope) removed = (await registration.unregister()) || removed;
                }
                if (removed && navigator.serviceWorker.controller) location.reload();
                return;
            }
            const registration = await navigator.serviceWorker.register(portfolioWorkerUrl.href, { updateViaCache: "none" });
            await registration.update();
        } catch (error) {
            console.warn("Mise a jour du service worker impossible :", error);
        }
    });
}

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
