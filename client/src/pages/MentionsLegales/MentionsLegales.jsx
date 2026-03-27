import styles from './MentionsLegales.module.scss'; 

export default function MentionsLegales() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mentions Légales</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Éditeur du site</h2>
        <p>CinéDélices est un projet pédagogique réalisé dans le cadre de la formation développeur web de l'école O'Clock.</p>
        <ul className={styles.list}>
          <li><span className={styles.label}>Projet :</span> CinéDélices</li>
          <li><span className={styles.label}>Type :</span> Projet pédagogique</li>
          <li><span className={styles.label}>École :</span> O'Clock</li>
          <li><span className={styles.label}>Année :</span> 2026</li>
          <li><span className={styles.label}>Équipe :</span> Hameni Abanya, Vincent Duverger, Orianne Jaunet, Nathalie Leduc, Emilie Vatelin</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Hébergement</h2>
        <ul className={styles.list}>
          <li><span className={styles.label}>Front-end :</span> Render</li>
          <li><span className={styles.label}>Back-end :</span> Render</li>
          <li><span className={styles.label}>Base de données :</span> PostgreSQL</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Propriété intellectuelle</h2>
        <p>Les recettes publiées sur CinéDélices sont proposées par les utilisateurs du site. Les visuels et données relatifs aux films et séries proviennent de l'API TMDB (The Movie Database).</p>
        <p className={styles.tmdb}>
          🎬 This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Données personnelles (RGPD)</h2>
        <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
        <ul className={styles.list}>
          <li><span className={styles.label}>Données collectées :</span> email, pseudo, mot de passe (hashé)</li>
          <li><span className={styles.label}>Finalité :</span> authentification et contribution au catalogue de recettes</li>
          <li><span className={styles.label}>Conservation :</span> jusqu'à suppression du compte</li>
          <li><span className={styles.label}>Suppression :</span> via la rubrique "Supprimer mon compte" dans votre profil</li>
          <li><span className={styles.label}>Responsable :</span> équipe CinéDélices — O'Clock 2026</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Cookies</h2>
        <p>CinéDélices utilise uniquement un token JWT stocké en local storage pour gérer votre authentification.</p>
        <ul className={styles.list}>
          <li>✅ Aucun cookie publicitaire</li>
          <li>✅ Aucun traceur tiers</li>
          <li>✅ Aucune donnée vendue à des partenaires</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Contact</h2>
        <p>Pour toute question relative au site ou à vos données personnelles, vous pouvez contacter l'équipe via la page <span className={styles.link}>Contact</span>.</p>
      </section>

    </div>
  );
};
