// Service Worker du portfolio.
// Le numéro change à chaque correction importante pour supprimer l'ancien cache.
const CACHE_NAME = "portfolio";

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
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
