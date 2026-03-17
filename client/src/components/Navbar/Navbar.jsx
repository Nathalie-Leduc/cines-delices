import { useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLoggedIn = false;
  const userName = "John Doe";

  const closeMenu = () => {
    setIsMenuOpen(false);
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
              <div className={styles.mobileAvatar}>
                <img
                  src="/icon/Profil.svg"
                  alt="Profil"
                  className={styles.profileIcon}
                />
              </div>
              <div className={styles.mobileUserText}>
                <span>Bonjour,</span>
                <strong>{userName}</strong>
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
          <button type="button" className={styles.mobileActionButton}>
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