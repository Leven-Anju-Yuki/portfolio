// =====================================================================
// NOTES PERSONNELLES
// Affiche le bouton permettant de revenir en haut de la page.
// Notes simples pour comprendre rapidement le rôle du fichier lors d’une future reprise.
// =====================================================================

 // Afficher le bouton quand l'utilisateur défile vers le bas de 20px depuis le haut de la page
 window.onscroll = function() {
    scrollFunction();
};

// Affiche le bouton de retour en haut seulement après avoir descendu la page.
function scrollFunction() {
    var scrollUpBtn = document.getElementById("scrollUpBtn");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        scrollUpBtn.style.display = "block";
    } else {
        scrollUpBtn.style.display = "none";
    }
}

// Fonction pour faire défiler vers le haut de la page
function scrollToTop() {
    document.body.scrollTop = 0; // Pour Safari
    document.documentElement.scrollTop = 0; // Pour Chrome, Firefox, IE et Opera
}
