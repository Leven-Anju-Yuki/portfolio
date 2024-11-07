// Lors de l'événement 'install', le service worker s'exécute pour la première fois.
self.addEventListener("install", function (event) {
    // `event.waitUntil()` attend la fin d'une opération asynchrone (ici l'ouverture d'un cache et l'ajout des ressources).
    event.waitUntil(
        // Ouvre le cache nommé "v1" (version 1 du cache). Si ce cache n'existe pas encore, il est créé.
        caches.open("v1").then(function (cache) {
            // Ajoute les fichiers spécifiés au cache pour qu'ils puissent être utilisés hors ligne.
            return cache.addAll([
                "/",                   // La racine du site (page d'accueil).
                "/index.html",         // La page principale.
                "/styles.css",         // Le fichier CSS pour le style.
                "/manifest.json",      // Le fichier manifest qui configure la PWA.
                "/icon-192x192.png",   // L'icône en 192x192 pixels (utilisée pour les petites résolutions).
                "/icon-512x512.png",   // L'icône en 512x512 pixels (pour les résolutions plus grandes).
            ]);
        })
    );
});

// Lors de l'événement 'fetch', chaque fois qu'une ressource est demandée (par exemple, lors de la navigation), le service worker intervient.
self.addEventListener("fetch", function (event) {
    // `event.respondWith()` intercepte la requête réseau et permet de définir une réponse personnalisée (ici, le cache).
    event.respondWith(
        // Vérifie si la requête est déjà présente dans le cache.
        caches.match(event.request).then(function (response) {
            // Si elle est dans le cache, elle est renvoyée directement (hors ligne).
            // Sinon, la requête est transmise au réseau via `fetch()`.
            return response || fetch(event.request);
        })
    );
});
