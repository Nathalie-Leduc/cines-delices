import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import styles from './AdminLayout.module.scss';

export default function AdminLayout() {
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
    <>
      <Navbar mobileMenuMode="external" onBurgerClick={() => setIsMobileSidebarOpen(true)} />

      <div
        className={`${styles.mobileSidebarOverlay} ${isMobileSidebarOpen ? styles.mobileSidebarOverlayVisible : ''}`.trim()}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`${styles.mobileSidebarDrawer} ${isMobileSidebarOpen ? styles.mobileSidebarDrawerOpen : ''}`.trim()}
        aria-hidden={!isMobileSidebarOpen}
      >
        <div className={styles.mobileSidebarHeader}>
          <div className={styles.mobileSidebarHeading}>
            <h2>Tableau de bord</h2>
            <span className={styles.roleBadge}>Espace admin</span>
          </div>
          <button
            type="button"
            className={styles.mobileSidebarClose}
            aria-label="Fermer le menu admin"
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

        <AdminSidebar mobile className={styles.mobileSidebarPanel} onNavigate={closeMobileSidebar} />
      </aside>

      <section className={styles.adminSection}>
        <div className={styles.adminContainer}>
          <header className={styles.pageHeader}>
            <div className={styles.pageHeading}>
              <h1>Tableau de bord</h1>
              <span className={styles.roleBadge}>Espace admin</span>
            </div>
          </header>

          <div className={styles.adminGrid}>
            <div className={styles.leftRail}>
              <div className={styles.desktopSidebar}>
                <AdminSidebar />
              </div>
            </div>

            <main className={styles.adminMain}>
              <Outlet />
            </main>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
