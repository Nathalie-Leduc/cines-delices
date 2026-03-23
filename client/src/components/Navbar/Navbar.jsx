import { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.scss";
import { getRecipesCatalog } from "../../services/recipesService";

const PROFILE_API = import.meta.env.VITE_PROFILE_API || "http://localhost:3000/api/auth/me";

function parseJwtPayload(rawToken) {
  if (!rawToken || typeof rawToken !== "string") {
    return null;
  }

  const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getUserName(payload) {
  if (!payload) {
    return null;
  }

  if (typeof payload.name === "string" && payload.name.trim()) {
    return payload.name.trim();
  }

  if (typeof payload.email === "string" && payload.email.includes("@")) {
    const userFromEmail = payload.email.split("@")[0].trim();

    if (userFromEmail) {
      return userFromEmail.charAt(0).toUpperCase() + userFromEmail.slice(1);
    }
  }

  return "Membre";
}

export default function Navbar({ mobileMenuMode = "default", onBurgerClick }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState(localStorage.getItem("displayName") || "");
  // Valeur de l'input de recherche
  const [search, setSearch] = useState('');
  // Résultats de recherche à afficher sous l'input
  const [results, setResults] = useState([]);
 
  // Crée une référence vers le div qui contient le formulaire de recherche
  // null = pas encore attaché au DOM
  const searchRef = useRef(null);

   // Met simplement à jour le state search
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const normalized = search.trim();

    if (!normalized) {
      navigate("/recipes");
      setResults([]);
      return;
    }

    navigate(`/recipes?q=${encodeURIComponent(normalized)}`);
    setResults([]);
  };

  const handleResultClick = () => {
    setSearch("");
    setResults([]);
  };

  // FETCH API AVEC DEBOUNCE
  // ---------------------------
  useEffect(() => {
    // Si input vide ou moins de 3 caractères, on vide les résultats et on ne fetch pas
    if (!search || search.length < 4) {
      setResults([]);
      return;
    }

    // Définir un timeout pour attendre 400ms après la dernière frappe
    const timeout = setTimeout(async () => {
      try {
          const payload = await getRecipesCatalog({
            q: search,
            limit: 5,
          });

          const recipes = Array.isArray(payload?.recipes) ? payload.recipes : [];
          const mappedResults = recipes.map((recipe) => ({
            id: recipe.id,
            slug: recipe.slug,
            title: recipe.titre || "Recette sans titre",
            mediaTitle: recipe.media?.titre || "",
            image: recipe.media?.posterUrl || recipe.imageURL || "/img/placeholder.jpg",
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

  const token = localStorage.getItem("token");
  const payload = parseJwtPayload(token);
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const isLoggedIn = Boolean(payload && typeof payload.exp === "number" && payload.exp > nowInSeconds);
  const userName = isLoggedIn ? profileFirstName || getUserName(payload) : "";

  

  // Ferme la liste des résultats quand l'utilisateur clique en dehors
useEffect(() => {
  const handleClickOutside = (e) => {
    // searchRef.current = le div du formulaire
    // contains(e.target) = vérifie si le clic est à l'intérieur du div
    if (searchRef.current && !searchRef.current.contains(e.target)) {
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

  useEffect(() => {
    const refreshDisplayName = () => {
      setProfileFirstName(localStorage.getItem("displayName") || "");
    };

    window.addEventListener("user-display-name-updated", refreshDisplayName);

    const fetchProfileFirstName = async () => {
      if (!token || !isLoggedIn) {
        setProfileFirstName("");
        return;
      }

      try {
        const response = await fetch(PROFILE_API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const user = payload?.data ?? payload;

        const rawName = typeof user?.prenom === "string" && user.prenom.trim()
          ? user.prenom
          : typeof user?.pseudo === "string" && user.pseudo.trim()
            ? user.pseudo
            : "";

        if (rawName) {
          const trimmed = rawName.trim();
          const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
          localStorage.setItem("displayName", normalized);
          setProfileFirstName(normalized);
        }
      } catch {
        // Fallback handled by getUserName(payload)
      }
    };

    fetchProfileFirstName();

    return () => {
      window.removeEventListener("user-display-name-updated", refreshDisplayName);
    };
  }, [token, isLoggedIn]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleMobileAction = () => {
    if (isLoggedIn) {
      localStorage.removeItem("token");
      closeMenu();
      navigate("/");
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
            <div ref={searchRef} className={styles.searchWrapper}>
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

            {isLoggedIn ? (
              <div className={styles.userBlock}>
                <NavLink to="/membre" className={styles.userTextLink}>
                  <span className={styles.userGreeting}>Bonjour,</span>
                  <span className={styles.userName}>{userName}</span>
                </NavLink>
                <NavLink
                  to="/membre"
                  className={styles.userIcon}
                  aria-label="Mon compte"
                >
                  <img
                    src="/icon/Profil.svg"
                    alt="Profil"
                    className={styles.profileIcon}
                  />
                </NavLink>
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
          {isLoggedIn ? (
            <div className={styles.mobileUser}>
              <NavLink
                to="/membre/profil"
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
                  to="/membre/profil"
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

            {isLoggedIn && (
              <li>
                <NavLink
                  to="/membre"
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
            {isLoggedIn ? "Se déconnecter" : "Se connecter"}
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
    </>
  );
}
