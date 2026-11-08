const API_URL = "https://openlibrary.org/search.json";

const LIMIT = 8;

let pageActuelle = 1;

let derniereRecherche = "programmation";

let livresActuels = [];

let favoris = JSON.parse(localStorage.getItem("biblioweb-favoris")) || [];

const grille = document.querySelector("#grille");

const statut = document.querySelector("#statut");

const formulaire = document.querySelector("#form-recherche");

const champ = document.querySelector("#recherche");

const retryBtn = document.querySelector("#retry-btn");

const precedentBtn = document.querySelector("#precedent");

const suivantBtn = document.querySelector("#suivant");

const numeroPage = document.querySelector("#numero-page");

const themeBtn = document.querySelector("#theme-btn");

const favorisBtn = document.querySelector("#favoris-btn");

const grilleFavoris = document.querySelector("#grille-favoris");

function afficherStatut(message, type = "info") {
  statut.textContent = message;

  statut.className = type;

  statut.hidden = !message;
}

function afficherChargement() {
  statut.innerHTML = `
        <div class="spinner"></div>
        <p>Chargement des livres en cours...</p>
    `;

  statut.className = "info";

  statut.hidden = false;
}

async function chercherLivres(terme, page) {
  const url =
    `${API_URL}?q=${encodeURIComponent(terme)}` +
    `&page=${page}` +
    `&limit=${LIMIT}` +
    `&fields=key,title,author_name,first_publish_year,cover_i`;

  const reponse = await fetch(url);

  if (!reponse.ok) {
    throw new Error("Erreur HTTP : " + reponse.status);
  }

  const donnees = await reponse.json();

  return donnees.docs;
}

function creerCarte(livre) {
  const { key, title, author_name, first_publish_year, cover_i } = livre;

  const carte = document.createElement("article");

  carte.className = "carte";

  let visuel;

  if (cover_i) {
    visuel = document.createElement("img");

    visuel.src = `https://covers.openlibrary.org/b/id/${cover_i}-M.jpg`;

    visuel.alt = `Couverture de ${title}`;

    visuel.loading = "lazy";
  } else {
    visuel = document.createElement("div");

    visuel.className = "sans-couverture";

    visuel.textContent = "📘";
  }

  const corps = document.createElement("div");

  corps.className = "carte-corps";

  const titre = document.createElement("h3");

  titre.textContent = title || "Titre inconnu";

  const auteur = document.createElement("p");

  auteur.textContent = author_name ? author_name.join(", ") : "Auteur inconnu";

  const annee = document.createElement("p");

  annee.textContent = first_publish_year
    ? `Publié en ${first_publish_year}`
    : "Année inconnue";

  const favori = document.createElement("button");

  favori.className = "favori-btn";

  const dejaFavori = favoris.some((item) => item.key === key);

  favori.textContent = dejaFavori
    ? "❤️ Retirer des favoris"
    : "🤍 Ajouter aux favoris";

  favori.addEventListener("click", () => {
    modifierFavoris(livre);

    afficherLivres(livresActuels);

    if (!grilleFavoris.hidden) {
      afficherFavoris();
    }
  });

  corps.append(titre, auteur, annee);

  carte.append(visuel, corps, favori);

  return carte;
}

function afficherLivres(livres) {
  grille.replaceChildren();

  livres.forEach((livre) => {
    grille.appendChild(creerCarte(livre));
  });
}

function modifierFavoris(livre) {
  const existe = favoris.some((item) => item.key === livre.key);

  if (existe) {
    favoris = favoris.filter((item) => item.key !== livre.key);
  } else {
    favoris.push(livre);
  }

  localStorage.setItem("biblioweb-favoris", JSON.stringify(favoris));
}

function afficherFavoris() {
  grilleFavoris.replaceChildren();

  if (favoris.length === 0) {
    grilleFavoris.textContent = "Vous n'avez encore aucun livre favori.";

    return;
  }

  favoris.forEach((livre) => {
    grilleFavoris.appendChild(creerCarte(livre));
  });
}

favorisBtn.addEventListener("click", () => {
  grilleFavoris.hidden = !grilleFavoris.hidden;

  if (!grilleFavoris.hidden) {
    favorisBtn.textContent = "Masquer mes favoris";

    afficherFavoris();
  } else {
    favorisBtn.textContent = "Afficher mes favoris";
  }
});

function mettreAJourPagination() {
  numeroPage.textContent = `Page ${pageActuelle}`;

  precedentBtn.disabled = pageActuelle === 1;
}

precedentBtn.addEventListener("click", () => {
  if (pageActuelle > 1) {
    pageActuelle--;

    lancerRecherche(derniereRecherche);
  }
});

suivantBtn.addEventListener("click", () => {
  pageActuelle++;

  lancerRecherche(derniereRecherche);
});

async function lancerRecherche(terme) {
  derniereRecherche = terme;

  grille.replaceChildren();

  retryBtn.hidden = true;

  precedentBtn.disabled = true;

  suivantBtn.disabled = true;

  afficherChargement();

  try {
    const livres = await chercherLivres(terme, pageActuelle);

    livresActuels = livres;

    if (livres.length === 0) {
      afficherStatut("Aucun livre trouvé pour cette recherche.", "info");

      return;
    }

    afficherStatut("Recherche terminée !", "info");

    afficherLivres(livres);

    mettreAJourPagination();

    suivantBtn.disabled = livres.length < LIMIT;
  } catch (erreur) {
    afficherStatut(
      "Impossible de charger les livres : " + erreur.message,
      "erreur",
    );

    retryBtn.hidden = false;
  }
}

retryBtn.addEventListener("click", () => {
  lancerRecherche(derniereRecherche);
});

formulaire.addEventListener("submit", (e) => {
  e.preventDefault();

  const terme = champ.value.trim();

  if (terme === "") {
    afficherStatut("Veuillez saisir un titre ou un auteur.", "erreur");

    return;
  }

  pageActuelle = 1;

  lancerRecherche(terme);
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const modeSombre = document.body.classList.contains("dark");

  themeBtn.textContent = modeSombre ? "☀️ Mode clair" : "🌙 Mode sombre";

  localStorage.setItem("biblioweb-theme", modeSombre ? "dark" : "light");
});

if (localStorage.getItem("biblioweb-theme") === "dark") {
  document.body.classList.add("dark");

  themeBtn.textContent = "☀️ Mode clair";
}

afficherFavoris();

lancerRecherche(derniereRecherche);
