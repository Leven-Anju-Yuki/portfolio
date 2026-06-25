 // Afficher le bouton quand l'utilisateur défile vers le bas de 20px depuis le haut de la page
 window.onscroll = function() {
    scrollFunction();
};

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