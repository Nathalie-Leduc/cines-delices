import { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.scss";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { searchHeaderContent } from "../../services/searchService";
import AdminSidebar from "../AdminSidebar";
import MemberSidebar from "../MemberSidebar/MemberSidebar.jsx";

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

const NAVBAR_VARIANTS = {
  public: {
    roleLabel: "",
    items: [
      { label: "Accueil", to: "/", end: true },
      { label: "Recettes", to: "/recipes" },
      { label: "Film", to: "/films" },
      { label: "Série", to: "/series" },
    ],
  },
  member: {
    roleLabel: "Espace membre",
    items: [
      { label: "Mon espace", to: "/membre", end: true },
      { label: "Mes recettes", to: "/membre/mes-recettes" },
      { label: "Créer une recette", to: "/membre/creer-recette" },
      { label: "Profil", to: "/membre/profil" },
    ],
  },
  admin: {
    roleLabel: "Espace admin",
    items: [
      { label: "Dashboard", to: "/admin", end: true },
      { label: "Recettes", to: "/admin/recettes" },
      { label: "Utilisateurs", to: "/admin/utilisateurs" },
      { label: "Catégories", to: "/admin/categories" },
      { label: "Validation", to: "/admin/validation-recettes" },
    ],
  },
};

const SITE_EXPLORATION_ITEMS = [
  { label: "Accueil", to: "/" },
  { label: "Recettes", to: "/recipes" },
  { label: "Film", to: "/films" },
  { label: "Série", to: "/series" },
];

export default function Navbar({ mobileMenuMode = "default", onBurgerClick, variant = "auto" }) {
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────────────────
  // 🔹 Tâche f-05 : on récupère tout depuis AuthContext
  //    Avant : const token = localStorage.getItem("token");
  //            const payload = parseJwtPayload(token);
  //    Maintenant : une seule ligne, le contexte fait tout le travail
  // ──────────────────────────────────────────────────────────────────────
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const resolvedVariant = variant === "auto"
    ? (isAuthenticated ? (isAdmin ? "admin" : "member") : "public")
    : variant;

  // Le nom affiché dans la Navbar (ex: "Bonjour, Nathalie")
  const userName = isAuthenticated ? getDisplayName(user) : "";

  // Le lien "Mon compte" pointe vers /admin si admin, /membre/mes-recettes sinon
  const accountPath = isAdmin ? "/admin" : "/membre/mes-recettes";
  const desktopNavItems = NAVBAR_VARIANTS.public.items;
  const mobileNavItems = NAVBAR_VARIANTS[resolvedVariant]?.items ?? NAVBAR_VARIANTS.public.items;
  const roleLabel = NAVBAR_VARIANTS[resolvedVariant]?.roleLabel ?? "";
  const shouldShowSearch = resolvedVariant === "public";

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

    let isCancelled = false;

    // Définir un timeout pour attendre 400ms après la dernière frappe
    const timeout = setTimeout(async () => {
      try {
        const mappedResults = await searchHeaderContent(search.trim());

        if (!isCancelled) {
          setResults(mappedResults);
        }
      } catch (err) {
        console.error("Erreur fetch recettes :", err);

        if (!isCancelled) {
          setResults([]);
        }
      }
    }, 400); // 400ms de debounce

    // Nettoyage : si l'utilisateur tape encore avant la fin du timeout
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
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

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.container}>
          <button
            type="button"
            className={styles.burger}
            aria-label={
              mobileMenuMode === "external"
                ? (resolvedVariant === "admin" ? "Ouvrir le menu admin" : "Ouvrir le menu membre")
                : "Ouvrir le menu"
            }
            onClick={() => {
              if (mobileMenuMode === "external") {
                onBurgerClick?.();
                return;
              }

              setIsMenuOpen(true);
            }}
          >
            <img src="/icon/Menu.svg" alt="Menu" width="24" height="24" />
          </button>

          <NavLink to="/" className={styles.logoLink}>
            <img
              src="/img/logo-cines-delices-v6.webp"
              alt="Ciné Délices"
              width="180" height="51"
              className={styles.logo}
            />
          </NavLink>

          <nav className={styles.desktopNav} aria-label="Navigation principale">
            <ul
              className={styles.desktopLinks}
              style={{
                "--desktop-nav-columns": String(desktopNavItems.length),
                "--desktop-nav-max-width": "28rem",
              }}
            >
              {desktopNavItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
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
            <div ref={desktopSearchRef} className={styles.searchWrapper}>
              <form className={styles.searchForm} role="search" onSubmit={handleSearchSubmit}>
                <input
                  type="search"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Recette, film ou série."
                  aria-label="Rechercher une recette, un film ou une série"
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
                {results.length > 0 && (
                  <ul className={styles.searchResults}>
                    {results.map((result) => (
                      <li key={result.key} className={styles.searchResultItem}>
                        <NavLink
                          to={result.to}
                          onClick={handleResultClick}
                        >
                          <img
                            src={result.image}
                            alt={result.title}
                            className={styles.searchResultThumb}
                          />
                          <span className={styles.searchResultCopy}>
                            <span className={styles.searchResultTitle}>{result.title}</span>
                            <span className={styles.searchResultMetaRow}>
                              <span className={styles.searchResultBadge}>{result.badgeLabel}</span>
                              <small className={styles.searchResultMeta}>{result.meta}</small>
                            </span>
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
                  <span className={styles.userText}>
                    <span className={styles.userGreeting}>Bonjour,</span>
                  </span>
                  <span className={styles.userName}>{userName}</span>
                </NavLink>
                <button
                  type="button"
                  className={styles.desktopLogoutButton}
                  onClick={handleLogout}
                  aria-label="Se déconnecter"
                >
                  <img
                    src="/icon/On_button_fill.svg"
                    alt=""
                    aria-hidden="true"
                    className={styles.desktopLogoutIcon}
                  />
                  <span>Se déconnecter</span>
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

          {shouldShowSearch && (
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
          )}
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
            className={`${styles.mobilePanel} ${resolvedVariant === "admin" || resolvedVariant === "member" ? styles.mobilePanelDashboard : ""} ${isMenuOpen ? styles.mobilePanelOpen : ""}`.trim()}
            aria-hidden={!isMenuOpen}
            inert={!isMenuOpen ? '' : undefined}
          >
            {resolvedVariant === "admin" ? (
              isMenuOpen ? (
                <>
                  <div className={styles.adminMobileHeader}>
                    <div className={styles.adminMobileHeading}>
                      <h2>Tableau de bord</h2>
                      <span className={styles.adminMobileBadge}>Espace admin</span>
                    </div>

                    <button
                      type="button"
                      className={styles.closeButton}
                      aria-label="Fermer le menu admin"
                      onClick={closeMenu}
                    >
                      <img src="/icon/close_menu.svg" alt="Fermer" />
                    </button>
                  </div>

                  <nav className={styles.adminMobileSiteNav} aria-label="Explorer le site">
                    <p className={styles.adminMobileSiteNavLabel}>Explorer le site</p>

                    <ul className={styles.adminMobileSiteNavList}>
                      {SITE_EXPLORATION_ITEMS.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={closeMenu}
                            className={({ isActive }) =>
                              `${styles.adminMobileSiteLink} ${isActive ? styles.adminMobileSiteLinkActive : ""}`.trim()
                            }
                          >
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  <AdminSidebar mobile className={styles.adminMobileSidebar} onNavigate={closeMenu} />
                </>
              ) : null
            ) : resolvedVariant === "member" ? (
              isMenuOpen ? (
                <>
                  <div className={styles.adminMobileHeader}>
                    <div className={styles.adminMobileHeading}>
                      <h2>Tableau de bord</h2>
                      <span className={styles.memberMobileBadge}>Espace membre</span>
                    </div>

                    <button
                      type="button"
                      className={styles.closeButton}
                      aria-label="Fermer le menu membre"
                      onClick={closeMenu}
                    >
                      <img src="/icon/close_menu.svg" alt="Fermer" />
                    </button>
                  </div>

                  <nav className={styles.adminMobileSiteNav} aria-label="Explorer le site">
                    <p className={styles.adminMobileSiteNavLabel}>Explorer le site</p>

                    <ul className={styles.adminMobileSiteNavList}>
                      {SITE_EXPLORATION_ITEMS.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={closeMenu}
                            className={({ isActive }) =>
                              `${styles.adminMobileSiteLink} ${isActive ? styles.adminMobileSiteLinkActive : ""}`.trim()
                            }
                          >
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  <MemberSidebar mobile onNavigate={closeMenu} />
                </>
              ) : null
            ) : (
              <>
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
                        {roleLabel ? <span className={styles.mobileRoleBadge}>{roleLabel}</span> : null}
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
                    {mobileNavItems.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.end}
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
                    src="/img/logo-cines-delices-v6.webp
                    "
                    alt="Ciné Délices"
              width="180" height="51"
                    className={styles.mobileBottomLogo}
                  />
                </div>
              </>
            )}
          </aside>
        </>
      )}

      {shouldShowSearch && (
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
                    placeholder="Recette, film ou série."
                    aria-label="Rechercher une recette, un film ou une série"
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
                    {results.map((result) => (
                      <li key={result.key} className={styles.searchResultItem}>
                        <NavLink
                          to={result.to}
                          onClick={handleResultClick}
                        >
                          <img
                            src={result.image}
                            alt={result.title}
                            className={styles.searchResultThumb}
                          />
                          <span className={styles.searchResultCopy}>
                            <span className={styles.searchResultTitle}>{result.title}</span>
                            <span className={styles.searchResultMetaRow}>
                              <span className={styles.searchResultBadge}>{result.badgeLabel}</span>
                              <small className={styles.searchResultMeta}>{result.meta}</small>
                            </span>
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
      )}
    </>
  );
}
