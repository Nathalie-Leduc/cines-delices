import { Outlet } from 'react-router-dom';
import styles from './MemberLayout.module.scss';

export default function MemberLayout() {
  return (
    <div className={styles.memberLayout}>
      <header className={styles.header}>
        <button className={styles.burger}>☰</button>
        <img
          src="/img/logo-cine-delices.png"
          alt="Ciné Délices"
          className={styles.logo}
        />
        <button className={styles.searchBtn}>🔍</button>
      </header>

      <main className={styles.content}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerLogo}>
          <img src="/img/logo-cine-delices.png" alt="Ciné Délices" />
        </span>
        <span>Mentions légales</span>
        <span className={styles.separator}>|</span>
        <span>Contact</span>
      </footer>
    </div>
  );
}