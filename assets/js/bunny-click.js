// =====================================================================
// NOTES PERSONNELLES
// Fait apparaître de petits lapins lorsque je clique sur une page.
// Notes simples pour comprendre rapidement le rôle du fichier lors d’une future reprise.
// =====================================================================

(function () {
    const BUNNIES = ['🐰', '🐇'];
    let cooldown = false;

// Crée un petit lapin animé à la position du clic.
    function createBunny(x, y) {
        const bunny = document.createElement('span');
        bunny.className = 'click-bunny';
        bunny.textContent = BUNNIES[Math.floor(Math.random() * BUNNIES.length)];

        const offsetX = (Math.random() - 0.5) * 80;
        const offsetY = (Math.random() - 0.5) * 40;
        const rotate = (Math.random() - 0.5) * 40;
        const duration = 1200 + Math.random() * 600;

        bunny.style.left = `${x + offsetX}px`;
        bunny.style.top = `${y + offsetY}px`;
        bunny.style.setProperty('--bunny-rotate', `${rotate}deg`);
        bunny.style.animationDuration = `${duration}ms`;

        document.body.appendChild(bunny);
        setTimeout(() => bunny.remove(), duration);
    }

// Fait apparaître plusieurs lapins avec un léger décalage.
    function burstBunnies(x, y, count) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => createBunny(x, y), i * 60);
        }
    }

// Récupère les coordonnées d’un clic de souris ou d’un toucher sur mobile.
    function getPointFromEvent(event) {
        if (event.touches && event.touches[0]) {
            return { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
        return { x: event.clientX, y: event.clientY };
    }

// Déclenche l’animation de lapins sans en créer trop rapidement.
    function handleInteraction(event) {
        if (cooldown) return;
        const point = getPointFromEvent(event);
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return;
        cooldown = true;
        burstBunnies(point.x, point.y, 3);
        setTimeout(() => { cooldown = false; }, 120);
    }

    document.addEventListener('click', handleInteraction, true);
    document.addEventListener('touchstart', handleInteraction, { passive: true, capture: true });
})();
