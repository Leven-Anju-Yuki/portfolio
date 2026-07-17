// =====================================================================
// NOTES PERSONNELLES
// Calcule mon âge automatiquement à partir de ma date de naissance.
// Notes simples pour comprendre rapidement le rôle du fichier lors d’une future reprise.
// =====================================================================

// Calcule l’âge actuel à partir de la date de naissance.
function calculerAge(dateNaissance) {
    const maintenant = new Date();
    const naissance = new Date(dateNaissance);

    let age = maintenant.getFullYear() - naissance.getFullYear();
    const mois = maintenant.getMonth() - naissance.getMonth();

    // Si on n’a pas encore passé le mois d’anniversaire cette année
    if (mois < 0 || (mois === 0 && maintenant.getDate() < naissance.getDate())) {
        age--;
    }

    return age;
}

document.getElementById("age").textContent = calculerAge("2003-05-26");
