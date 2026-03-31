import { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.scss";
import { getRecipesCatalog } from "../../services/recipesService";
import { useAuth } from "../../contexts/AuthContext.jsx"

// ──────────────────────────────────────────────────────────────────────────
// Tâche f-05 : Navbar branchée sur AuthContext
//
// 🎬 Analogie : Avant, la Navbar allait elle-même fouiller dans le casier
//    (localStorage) pour vérifier le badge du visiteur, décoder le JWT,
//    et même appeler l'API /auth/me pour récupérer le prénom.
//
//    Maintenant, elle demande simplement à la guérite (AuthContext) :
//    « Ce visiteur est-il identifié ? Comment s'appelle-t-il ? Est-il admin ? »
//    → useAuth() lui donne tout ça directement, sans bricolage.
//
// Ce qui a été SUPPRIMÉ (car AuthContext le gère déjà) :
//   - parseJwtPayload() → le contexte décode le JWT
//   - getUserName()     → le contexte + normalizeDisplayName dans AuthProvider
//   - getAccountPath()  → remplacé par isAdmin du contexte
//   - Le useEffect qui appelait request("/api/auth/me") pour le prénom
//   - La lecture directe de localStorage.getItem("token")
//   - import de {request} depuis api.js (plus nécessaire ici)
// ──────────────────────────────────────────────────────────────────────────


// ──────────────────────────────────────────────────────────────────────────
// Détermine le nom à afficher pour l'utilisateur
// On garde cette logique ici car elle concerne l'affichage dans la Navbar,
// pas l'état d'authentification (qui est dans AuthContext)
// ──────────────────────────────────────────────────────────────────────────
function getDisplayName(user) {
  if (!user) return "Membre";

  // Priorité : prenom > pseudo > name > email > fallback
  if (typeof user.prenom === "string" && user.prenom.trim()) {
    const prenom = user.prenom.trim();
    return prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase();
  }

  if (typeof user.pseudo === "string" && user.pseudo.trim()) {
    const pseudo = user.pseudo.trim();
    return pseudo.charAt(0).toUpperCase() + pseudo.slice(1).toLowerCase();
  }

  if (typeof user.name === "string" && user.name.trim()) {
    return user.name.trim();
  }

  if (typeof user.email === "string" && user.email.includes("@")) {
    const userFromEmail = user.email.split("@")[0].trim();
    if (userFromEmail) {
      return userFromEmail.charAt(0).toUpperCase() + userFromEmail.slice(1);
    }
  }

  return "Membre";
}

export default function Navbar({ mobileMenuMode = "default", onBurgerClick }) {
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────────────────
  // 🔹 Tâche f-05 : on récupère tout depuis AuthContext
  //    Avant : const token = localStorage.getItem("token");
  //            const payload = parseJwtPayload(token);
  //    Maintenant : une seule ligne, le contexte fait tout le travail
  // ──────────────────────────────────────────────────────────────────────
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Le nom affiché dans la Navbar (ex: "Bonjour, Nathalie")
  const userName = isAuthenticated ? getDisplayName(user) : "";

  // Le lien "Mon compte" pointe vers /admin si admin, /membre/profil sinon
  const accountPath = isAdmin ? "/admin" : "/membre/profil";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Valeur de l'input de recherche
  const [search, setSearch] = useState("");
  // Résultats de recherche à afficher sous l'input
  const [results, setResults] = useState([]);

  // Crée une référence vers le div qui contient le formulaire de recherche
  // null = pas encore attaché au DOM
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  // Met simplement à jour le state search
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const clearSearch = () => {
    setSearch("");
    setResults([]);
    mobileSearchInputRef.current?.focus();
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const normalized = search.trim();

    if (!normalized) {
      navigate("/recipes");
      setResults([]);
      setIsMobileSearchOpen(false);
      return;
    }

    navigate(`/recipes?q=${encodeURIComponent(normalized)}`);
    setResults([]);
    setIsMobileSearchOpen(false);
  };

  const handleResultClick = () => {
    setSearch("");
    setResults([]);
    setIsMobileSearchOpen(false);
  };

  // ──────────────────────────────────────────────────────────────────────
  // 🔹 Tâche f-05 : handleLogout utilise logout() du contexte
  //    Avant : localStorage.removeItem("token") + navigate("/")
  //    Maintenant : logout() vide le contexte ET le localStorage d'un coup
  // ──────────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();       // vide AuthContext + localStorage (token, user, displayName)
    closeMenu();
    navigate("/");  // retour accueil
  };

  // FETCH API AVEC DEBOUNCE
  // ---------------------------
  useEffect(() => {
    // Si input vide ou moins de 2 caractères, on vide les résultats et on ne fetch pas
    if (!search || search.trim().length < 2) {
      setResults([]);
      return;
    }

    // Définir un timeout pour attendre 400ms après la dernière frappe
    const timeout = setTimeout(async () => {
      try {
        const payload = await getRecipesCatalog({
          q: search.trim(),
          limit: 5,
        });
        const rawRecipes = Array.isArray(payload?.recipes) ? payload.recipes : [];
        const mappedResults = rawRecipes.map((recipe) => ({
          id: recipe.id,
          slug: recipe.slug,
          title: recipe.titre || "Recette sans titre",
          mediaTitle: recipe.media?.titre || "",
          image: recipe.imageURL || recipe.imageUrl || recipe.media?.posterUrl || "/img/hero-home.png",
        }));
        setResults(mappedResults);
      } catch (err) {
        console.error("Erreur fetch recettes :", err);
        setResults([]);
      }
    }, 400); // 400ms de debounce

    // Nettoyage : si l'utilisateur tape encore avant la fin du timeout
    return () => clearTimeout(timeout);
  }, [search]); // dépendance : se déclenche à chaque changement de search

  // Ferme la liste des résultats quand l'utilisateur clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedDesktopSearch = desktopSearchRef.current?.contains(e.target);
      const clickedMobileSearch = mobileSearchRef.current?.contains(e.target);

      if (!clickedDesktopSearch && !clickedMobileSearch) {
        // Le clic est en dehors → on vide les résultats
        setResults([]);
      }
    };

    // On écoute tous les clics sur la page
    document.addEventListener("mousedown", handleClickOutside);

    // Nettoyage : supprime l'écouteur quand le composant est démonté
    // Évite les fuites mémoire
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // [] = s'exécute une seule fois au montage du composant

  // Gestion de l'ouverture/fermeture du panneau de recherche mobile
  useEffect(() => {
    if (!isMobileSearchOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileSearchInputRef.current?.focus();

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileSearchOpen]);

  // Écoute l'événement custom "open-mobile-search" (ex: depuis la Home)
  useEffect(() => {
    const handleOpenMobileSearch = (event) => {
      const nextSearch = typeof event?.detail?.search === "string" ? event.detail.search : "";
      setIsMenuOpen(false);
      setSearch(nextSearch);
      setIsMobileSearchOpen(true);
    };

    window.addEventListener("open-mobile-search", handleOpenMobileSearch);

    return () => {
      window.removeEventListener("open-mobile-search", handleOpenMobileSearch);
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // 🔹 Tâche f-05 : SUPPRIMÉ — le useEffect qui faisait fetch("/api/auth/me")
  //    pour récupérer le prénom. AuthContext gère déjà l'objet user
  //    avec toutes les infos (prenom, pseudo, email, role).
  //    Plus besoin d'un appel API supplémentaire ici !
  // ──────────────────────────────────────────────────────────────────────

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openMobileSearch = () => {
    setIsMenuOpen(false);
    setIsMobileSearchOpen(true);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setResults([]);
  };

  // ──────────────────────────────────────────────────────────────────────
  // 🔹 Tâche f-05 : handleMobileAction simplifié
  //    Avant : localStorage.removeItem("token") manuellement
  //    Maintenant : handleLogout() qui passe par le contexte
  // ──────────────────────────────────────────────────────────────────────
  const handleMobileAction = () => {
    if (isAuthenticated) {
      handleLogout();
      return;
    }

    closeMenu();
    navigate("/login");
  };

  const navItems = [
    { label: "Accueil", to: "/" },
    { label: "Recettes", to: "/recipes" },
    { label: "Film", to: "/films" },
    { label: "Série", to: "/series" },
  ];

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.container}>
          <button
            type="button"
            className={styles.burger}
            aria-label={mobileMenuMode === "external" ? "Ouvrir le menu admin" : "Ouvrir le menu"}
            onClick={() => {
              if (mobileMenuMode === "external") {
                onBurgerClick?.();
                return;
              }

              setIsMenuOpen(true);
            }}
          >
            <img src="/icon/Menu.svg" alt="Menu" />
          </button>

          <NavLink to="/" className={styles.logoLink}>
            <img
              src="/img/logo-cine-delices.png"
              alt="CinéDélices"
              className={styles.logo}
            />
          </NavLink>

          <nav className={styles.desktopNav} aria-label="Navigation principale">
            <ul className={styles.desktopLinks}>
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? styles.activeLink : styles.link
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.rightZone}>
            {/* Wrapper relatif pour positionner la liste sous l'input */}
            <div ref={desktopSearchRef} className={styles.searchWrapper}>
              {/* Formulaire de recherche */}
              <form className={styles.searchForm} role="search" onSubmit={handleSearchSubmit}>
                <input
                  type="search"
                  value={search}  // Valeur contrôlée par le state
                  onChange={handleSearch}  // Déclenché à chaque frappe
                  placeholder="Rechercher..."
                  className={styles.searchInput}
                />
                <button
                  type="submit"
                  className={styles.searchButton}
                  aria-label="Rechercher"
                >
                  <img
                    src="/icon/Search.svg"
                    alt=""
                    className={styles.searchIcon}
                  />
                </button>
                {/* Liste des résultats recettes — visible uniquement si résultats */}
                {results.length > 0 && (
                  <ul className={styles.searchResults}>
                    {results.map((recipe) => (
                      <li key={recipe.id} className={styles.searchResultItem}>
                        <NavLink
                          to={`/recipes/${recipe.slug || recipe.id}`}
                          onClick={handleResultClick}
                        >
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            className={styles.searchResultThumb}
                          />
                          <span className={styles.searchResultCopy}>
                            <span>{recipe.title}</span>
                            {recipe.mediaTitle && (
                              <small className={styles.searchResultMeta}>{recipe.mediaTitle}</small>
                            )}
                          </span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </form>
            </div>

            {/* ────────────────────────────────────────────────────────────
                🔹 Tâche f-05 : le rendu conditionnel utilise isAuthenticated
                   Avant : isLoggedIn (calculé manuellement depuis le JWT)
                   Maintenant : isAuthenticated vient de useAuth()
            ──────────────────────────────────────────────────────────── */}
            {isAuthenticated ? (
              <div className={styles.userBlock}>
                <NavLink to={accountPath} className={styles.userTextLink}>
                  <span className={styles.userGreeting}>Bonjour,</span>
                  <span className={styles.userName}>{userName}</span>
                </NavLink>
                <NavLink
                  to={accountPath}
                  className={styles.userIcon}
                  aria-label="Mon compte"
                >
                  <img
                    src="/icon/Profil.svg"
                    alt="Profil"
                    className={styles.profileIcon}
                  />
                </NavLink>
                <button
                  type="button"
                  className={styles.desktopLogoutButton}
                  onClick={handleLogout}
                >
                  Se déconnecter
                </button>
              </div>
            ) : (
              <NavLink to="/login" className={styles.desktopLoginLink}>
                <img
                  src="/icon/Profil.svg"
                  alt=""
                  aria-hidden="true"
                  className={styles.desktopLoginIcon}
                />
                <span>Se connecter</span>
              </NavLink>
            )}
          </div>

          <button
            type="button"
            className={styles.mobileSearch}
            aria-label="Rechercher"
            aria-expanded={isMobileSearchOpen}
            onClick={openMobileSearch}
          >
            <img
              src="/icon/Search.svg"
              alt="Recherche"
              className={styles.searchIcon}
            />
          </button>
        </div>
      </header>

      {mobileMenuMode === "default" && (
        <>
          <div
            className={`${styles.overlay} ${isMenuOpen ? styles.overlayVisible : ""}`}
            onClick={closeMenu}
            aria-hidden="true"
          />

          <aside
            className={`${styles.mobilePanel} ${isMenuOpen ? styles.mobilePanelOpen : ""}`}
            aria-hidden={!isMenuOpen}
          >
            <div className={styles.mobilePanelHeader}>
              {isAuthenticated ? (
                <div className={styles.mobileUser}>
                  <NavLink
                    to={accountPath}
                    onClick={closeMenu}
                    className={styles.mobileAvatar}
                    aria-label="Mon profil"
                  >
                    <img
                      src="/icon/Profil.svg"
                      alt="Profil"
                      className={styles.profileIcon}
                    />
                  </NavLink>
                  <div className={styles.mobileUserText}>
                    <span>Bonjour,</span>
                    <NavLink
                      to={accountPath}
                      onClick={closeMenu}
                      className={styles.mobileUserLink}
                    >
                      <strong>{userName}</strong>
                    </NavLink>
                  </div>
                </div>
              ) : (
                <div />
              )}

              <button
                type="button"
                className={styles.closeButton}
                aria-label="Fermer le menu"
                onClick={closeMenu}
              >
                <img src="/icon/close_menu.svg" alt="Fermer" />
              </button>
            </div>

            <nav className={styles.mobileNav} aria-label="Navigation mobile">
              <ul className={styles.mobileLinks}>
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        isActive ? styles.mobileActiveLink : styles.mobileLink
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}

                {isAuthenticated && (
                  <li>
                    <NavLink
                      to={accountPath}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        isActive ? styles.mobileActiveLink : styles.mobileLink
                      }
                    >
                      Mon compte
                    </NavLink>
                  </li>
                )}
              </ul>
            </nav>

            <div className={styles.mobileBottom}>
              <button
                type="button"
                className={styles.mobileActionButton}
                onClick={handleMobileAction}
              >
                {isAuthenticated ? "Se déconnecter" : "Se connecter"}
              </button>

              <img
                src="/img/logo-cine-delices.png"
                alt="CinéDélices"
                className={styles.mobileBottomLogo}
              />
            </div>
          </aside>
        </>
      )}

      <div
        className={`${styles.mobileSearchOverlay} ${isMobileSearchOpen ? styles.mobileSearchOverlayVisible : ""}`}
        aria-hidden={!isMobileSearchOpen}
      >
        <button
          type="button"
          className={styles.mobileSearchBackdrop}
          aria-label="Fermer la recherche"
          onClick={closeMobileSearch}
        />

        <section
          className={`${styles.mobileSearchModal} ${isMobileSearchOpen ? styles.mobileSearchModalOpen : ""}`}
          aria-label="Recherche mobile"
        >
          <div className={styles.mobileSearchHeader}>
            <div className={styles.mobileSearchTitleRow}>
              <p className={styles.mobileSearchEyebrow}>Recherche rapide</p>
              <span className={styles.mobileSearchTitleLine} />
            </div>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Fermer la recherche"
              onClick={closeMobileSearch}
            >
              <img src="/icon/close_menu.svg" alt="Fermer" />
            </button>
          </div>

          <div ref={mobileSearchRef} className={styles.mobileSearchContent}>
            <form className={styles.mobileSearchForm} role="search" onSubmit={handleSearchSubmit}>
              <div className={styles.mobileSearchField}>
                <img
                  src="/icon/Search.svg"
                  alt=""
                  aria-hidden="true"
                  className={styles.searchIcon}
                />
                <input
                  ref={mobileSearchInputRef}
                  type="search"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Rechercher une recette, un film, une serie"
                  className={styles.mobileSearchInput}
                />
                {search && (
                  <button
                    type="button"
                    className={styles.clearSearchButton}
                    onClick={clearSearch}
                    aria-label="Effacer la recherche"
                  >
                    ×
                  </button>
                )}
              </div>

              {results.length > 0 && (
                <ul className={styles.mobileSearchResults}>
                  {results.map((recipe) => (
                    <li key={recipe.id} className={styles.searchResultItem}>
                      <NavLink
                        to={`/recipes/${recipe.slug || recipe.id}`}
                        onClick={handleResultClick}
                      >
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className={styles.searchResultThumb}
                        />
                        <span className={styles.searchResultCopy}>
                          <span>{recipe.title}</span>
                          {recipe.mediaTitle && (
                            <small className={styles.searchResultMeta}>{recipe.mediaTitle}</small>
                          )}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
