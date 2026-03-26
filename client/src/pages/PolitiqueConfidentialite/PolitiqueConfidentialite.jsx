import { NavLink } from 'react-router-dom';
import styles from './PolitiqueConfidentialite.module.scss';

export default function PolitiqueConfidentialite() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Politique de confidentialité</h1>
      <p className={styles.lastUpdate}>Dernière mise à jour : 25 mars 2026</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Objet de cette politique</h2>
        <p>
          Cette page explique quelles données personnelles sont traitées sur CinéDélices,
          pourquoi elles le sont et quels sont vos droits.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Responsable du traitement</h2>
        <ul className={styles.list}>
          <li><span className={styles.label}>Projet :</span> CinéDélices (projet pédagogique O&apos;Clock)</li>
          <li><span className={styles.label}>Equipe :</span> promotion 2026</li>
          <li><span className={styles.label}>Contact :</span> via la page Contact</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Données collectées</h2>
        <p>Lors de la création d&apos;un compte ou de l&apos;utilisation du service, nous pouvons traiter :</p>
        <ul className={styles.list}>
          <li>Identite de compte : nom, prenom, pseudo</li>
          <li>Coordonnées : adresse e-mail</li>
          <li>Sécurité : mot de passe (stocké sous forme de hash, jamais en clair)</li>
          <li>Contenus publiés : recettes, ingrédients, médias associés</li>
          <li>Données techniques minimales liées à l&apos;authentification (token de session)</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Finalités et base légale</h2>
        <ul className={styles.list}>
          <li><span className={styles.label}>Création et gestion du compte :</span> exécution du service</li>
          <li><span className={styles.label}>Connexion et sécurité :</span> intérêt légitime de protection de la plateforme</li>
          <li><span className={styles.label}>Publication des recettes :</span> execution du service</li>
          <li><span className={styles.label}>Respect légal :</span> obligations légales éventuelles</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Durée de conservation</h2>
        <p>
          Les données de compte sont conservées tant que le compte est actif.
          En cas de suppression du compte, les données personnelles associées sont supprimées
          ou anonymisées selon les contraintes techniques et légales applicables.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Destinataires des données</h2>
        <p>
          Les données sont destinées uniquement à l&apos;application CinéDélices et à son infrastructure
          technique. Aucune revente de données personnelles n&apos;est effectuée.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Vos droits (RGPD)</h2>
        <p>Conformement au RGPD, vous pouvez exercer les droits suivants :</p>
        <ul className={styles.list}>
          <li>Droit d&apos;acces</li>
          <li>Droit de rectification</li>
          <li>Droit d&apos;effacement</li>
          <li>Droit d&apos;opposition ou de limitation</li>
        </ul>
        <p>
          Pour exercer vos droits, utilisez la page Contact. Vous pouvez aussi supprimer votre compte
          depuis votre espace membre lorsque cette fonction est disponible.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Liens utiles</h2>
        <p>
          Consultez aussi la{' '}
          <NavLink to="/politique-cookies" className={styles.link}>
            politique de cookies
          </NavLink>
          {' '}pour comprendre le stockage local et les mécanismes d&apos;authentification.
        </p>
      </section>
    </div>
  );
}
