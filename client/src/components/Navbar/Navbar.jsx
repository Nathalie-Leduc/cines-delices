import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.scss";

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

export default function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState(localStorage.getItem("displayName") || "");

  const token = localStorage.getItem("token");
  const payload = parseJwtPayload(token);
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const isLoggedIn = Boolean(payload && typeof payload.exp === "number" && payload.exp > nowInSeconds);
  const userName = isLoggedIn ? profileFirstName || getUserName(payload) : "";

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
            aria-label="Ouvrir le menu"
            onClick={() => setIsMenuOpen(true)}
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
            <form className={styles.searchForm} role="search">
              <input
                type="search"
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
            </form>

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
                Se connecter
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
  );
}