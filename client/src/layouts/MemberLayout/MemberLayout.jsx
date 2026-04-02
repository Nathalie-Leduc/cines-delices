import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Footer from '../../components/Footer';
import Navbar from '../../components/Navbar';
import MemberSidebar from '../../components/MemberSidebar/MemberSidebar.jsx';
import styles from './MemberLayout.module.scss';

export default function MemberLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const siteNavItems = [
    { label: 'Accueil', to: '/' },
    { label: 'Recettes', to: '/recipes' },
    { label: 'Film', to: '/films' },
    { label: 'Série', to: '/series' },
  ];

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className={styles.memberLayout}>
      <Navbar mobileMenuMode="external" onBurgerClick={() => setIsMobileSidebarOpen(true)} />

      <div
        className={`${styles.mobileSidebarOverlay} ${isMobileSidebarOpen ? styles.mobileSidebarOverlayVisible : ''}`.trim()}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />

      <aside
        className={`${styles.mobileSidebarDrawer} ${isMobileSidebarOpen ? styles.mobileSidebarDrawerOpen : ''}`.trim()}
        aria-hidden={!isMobileSidebarOpen}
      >
        <div className={styles.mobileSidebarHeader}>
          <div className={styles.mobileSidebarHeading}>
            <h2>Tableau de bord</h2>
            <span className={styles.roleBadge}>Espace membre</span>
          </div>
          <button
            type="button"
            className={styles.mobileSidebarClose}
            aria-label="Fermer le menu membre"
            onClick={closeMobileSidebar}
          >
            <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
          </button>
        </div>

        <nav className={styles.mobileSiteNav} aria-label="Explorer le site">
          <p className={styles.mobileSiteNavLabel}>Explorer le site</p>
          <ul className={styles.mobileSiteNavList}>
            {siteNavItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) => `${styles.mobileSiteLink} ${isActive ? styles.mobileSiteLinkActive : ''}`.trim()}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <MemberSidebar mobile className={styles.mobileSidebarPanel} onNavigate={closeMobileSidebar} />
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
