import { NavLink } from 'react-router-dom';
import styles from './PolitiqueCookies.module.scss';

export default function PolitiqueCookies() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Politique de cookies</h1>
      <p className={styles.lastUpdate}>Dernière mise à jour : 25 mars 2026</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Objet de cette politique</h2>
        <p>
          Cette politique décrit l&apos;usage des cookies et technologies similaires sur CinéDélices.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Cookies utilisés</h2>
        <p>
          A la date de mise à jour, CinéDélices n&apos;utilise pas de cookies publicitaires,
          de cookies de mesure d&apos;audience tiers ou de traceurs marketing.
        </p>
        <ul className={styles.list}>
          <li>Aucun cookie publicitaire</li>
          <li>Aucun traceur tiers de profilage</li>
          <li>Aucune revente de donnees de navigation</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Stockage local nécessaire</h2>
        <p>
          Pour maintenir la session utilisateur, l&apos;application enregistre un jeton
          d&apos;authentification côté navigateur (local storage). Ce mécanisme est strictement
          nécessaire au fonctionnement de la connexion et de l&apos;espace membre.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Gestion par l&apos;utilisateur</h2>
        <p>Vous pouvez a tout moment :</p>
        <ul className={styles.list}>
          <li>vous deconnecter pour invalider la session côté application</li>
          <li>vider le stockage local depuis les paramètres de votre navigateur</li>
          <li>supprimer les données de site depuis votre navigateur</li>
        </ul>
        <p>
          Attention : supprimer ces données peut vous déconnecter et réinitialiser certaines préférences.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Evolution de cette politique</h2>
        <p>
          Si de nouveaux cookies non essentiels sont introduits (statistiques, personnalisation,
          services tiers), cette page sera mise à jour et une demande de consentement explicite
          sera présentée avant dépôt.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Liens utiles</h2>
        <p>
          Consultez aussi la{' '}
          <NavLink to="/politique-confidentialite" className={styles.link}>
            politique de confidentialité
          </NavLink>
          {' '}pour connaître le traitement de vos données personnelles.
        </p>
      </section>
    </div>
  );
}
