// NOTES PERSONNELLES : ce service worker gère le cache de la version installable du portfolio.
// Je change son nom de cache lorsque je veux forcer le navigateur à reprendre les nouveaux fichiers.

const CACHE_NAME = "portfolio-v18";
const ASSETS = [
    "./",
    "./index.html",
  "./readme.html",
    "./dashboard.html",
    "./manifest.json",
    "./assets/css/style accueil.css",
    "./assets/css/dashboard.css",
    "./assets/image/portefeuille.png"
];
self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(ASSETS.map(asset => cache.add(asset)))));
    self.skipWaiting();
});
self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
    self.clients.claim();
});
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Les fichiers du dashboard changent souvent pendant le développement.
    // On les récupère toujours sur le réseau pour éviter de mélanger deux versions.
    if (url.pathname.includes("/admin/") || url.pathname.includes("/assets/js/portfolio-")) {
        event.respondWith(fetch(event.request, { cache: "no-store" }));
        return;
    }

    event.respondWith(fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
    }).catch(() => caches.match(event.request)));
});
