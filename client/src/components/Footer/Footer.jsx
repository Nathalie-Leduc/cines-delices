import { NavLink } from 'react-router-dom';
import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span className={styles.footerLogo}>
          <img src="/img/logo-cines-delices-v6.webp" alt="Cines Delices" />
        </span>

        <nav className={styles.footerNav} aria-label="Liens du footer">
          <NavLink
            to="/mentions-legales"
            className={({ isActive }) => `${styles.footerLink} ${isActive ? styles.active : ''}`.trim()}
          >
            Mentions légales
          </NavLink>
          <span className={styles.separator} aria-hidden="true" />
          <NavLink
            to="/politique-confidentialite"
            className={({ isActive }) => `${styles.footerLink} ${isActive ? styles.active : ''}`.trim()}
          >
            Politique de confidentialité
          </NavLink>
          <span className={styles.separator} aria-hidden="true" />
          <NavLink
            to="/politique-cookies"
            className={({ isActive }) => `${styles.footerLink} ${isActive ? styles.active : ''}`.trim()}
          >
            Politique de cookies
          </NavLink>
          <span className={styles.separator} aria-hidden="true" />
          <NavLink
            to="/regles-moderation"
            className={({ isActive }) => `${styles.footerLink} ${isActive ? styles.active : ''}`.trim()}
>
            Règles de modération
          </NavLink>
          <span className={styles.separator} aria-hidden="true" />

          <NavLink
            to="/contact"
            className={({ isActive }) => `${styles.footerLink} ${isActive ? styles.active : ''}`.trim()}
          >
            Contact
          </NavLink>
        </nav>
      </div>
    </footer>
  );
}
