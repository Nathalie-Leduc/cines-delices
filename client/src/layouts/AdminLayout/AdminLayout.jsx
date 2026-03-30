import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import styles from './AdminLayout.module.scss';

function parseJwtPayload(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function toTitleCase(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getRoleLabel(payload) {
  const role = String(payload?.role || '').trim().toLowerCase();

  if (!role) {
    return 'Admin';
  }

  if (role.includes('super') && role.includes('admin')) {
    return 'Super Admin';
  }

  if (role === 'admin') {
    return 'Admin';
  }

  return toTitleCase(role);
}

function getDisplayName(payload) {
  if (typeof payload?.prenom === 'string' && payload.prenom.trim()) {
    return toTitleCase(payload.prenom);
  }

  if (typeof payload?.pseudo === 'string' && payload.pseudo.trim()) {
    return toTitleCase(payload.pseudo);
  }

  const savedDisplayName = localStorage.getItem('displayName');
  if (savedDisplayName?.trim()) {
    return savedDisplayName.trim();
  }

  if (typeof payload?.name === 'string' && payload.name.trim()) {
    return payload.name.trim();
  }

  if (typeof payload?.email === 'string' && payload.email.includes('@')) {
    return payload.email.split('@')[0].trim();
  }

  return 'toi';
}

export default function AdminLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [displayName, setDisplayName] = useState('toi');
  const [roleLabel, setRoleLabel] = useState('Admin');

  useEffect(() => {
    const refreshIdentity = () => {
      const token = localStorage.getItem('token');
      const payload = parseJwtPayload(token);
      setDisplayName(getDisplayName(payload));
      setRoleLabel(getRoleLabel(payload));
    };

    refreshIdentity();
    window.addEventListener('user-display-name-updated', refreshIdentity);
    window.addEventListener('storage', refreshIdentity);

    return () => {
      window.removeEventListener('user-display-name-updated', refreshIdentity);
      window.removeEventListener('storage', refreshIdentity);
    };
  }, []);

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
          <h2>{roleLabel}</h2>
          <button
            type="button"
            className={styles.mobileSidebarClose}
            aria-label="Fermer le menu admin"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
          </button>
        </div>

        <p className={styles.mobileSidebarWelcome}>
          Bonjour <strong>{displayName}</strong>, bienvenue dans ton royaume !
        </p>

        <AdminSidebar mobile className={styles.mobileSidebarPanel} onNavigate={() => setIsMobileSidebarOpen(false)} />
      </aside>

      <section className={styles.adminSection}>
        <div className={styles.adminContainer}>
          <header className={styles.pageHeader}>
            <h1>{roleLabel}</h1>
          </header>

          <div className={styles.adminGrid}>
            <div className={styles.leftRail}>
              <p className={styles.welcomeText}>
                Bonjour <strong>{displayName}</strong>, bienvenue dans ton royaume !
              </p>

              <div className={styles.desktopSidebar}>
                <AdminSidebar />
              </div>
            </div>

            <main className={styles.adminMain}>
              <Outlet />
            </main>
          </div>

          <div className={styles.mobileWelcome}>
            <p className={styles.welcomeText}>
              Bonjour <strong>{displayName}</strong>, bienvenue dans ton royaume !
            </p>
          </div>

          <div className={styles.mobileSidebarOnly}>
            <AdminSidebar />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
