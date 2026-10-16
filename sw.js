// Service Worker du portfolio.
// Le numéro change à chaque correction importante pour supprimer l'ancien cache.
const CACHE_NAME = "portfolio-v2";

const ASSETS = [
    "./",
    "./index.html",
    "./apropos.html",
    "./readme.html",
    "./admin/dashboard.html",
    "./manifest.json",
    "./assets/css/style accueil.css",
    "./assets/css/readme.css",
    "./assets/css/dashboard.css",
    "./assets/image/portefeuille.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => Promise.allSettled(ASSETS.map(asset => cache.add(asset))))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Les extensions et les services externes restent geres par le navigateur.
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== self.location.origin) return;

    // Ces fichiers changent souvent : le réseau est toujours prioritaire pour
    // éviter qu'un ancien JavaScript casse la recherche, les filtres ou le dashboard.
    if (
        url.pathname.includes("/admin/")
        || url.pathname.includes("/assets/js/")
        || url.pathname.endsWith("/projects-config.json")
    ) {
        event.respondWith(fetch(event.request, { cache: "no-store" }));
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response.ok && response.status !== 206) {
                    const copy = response.clone();
                    event.waitUntil(
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, copy))
                            .catch(error => console.warn("Cache du portfolio indisponible :", error))
                    );
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
