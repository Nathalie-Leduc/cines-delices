import { Link } from 'react-router-dom';
import styles from './MentionsLegales.module.scss';

// ============================================================
// PAGE MENTIONS LÉGALES — Ciné Délices
// ============================================================
// Mise à jour : mars 2026
// Couvre : éditeur, hébergement, propriété intellectuelle,
//          RGPD, cookies (Tarteaucitron), conservation des données,
//          suppression automatique, droits des utilisateurs, TMDB.
// ============================================================

export default function MentionsLegales() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mentions Légales</h1>

      {/* ── 1. Éditeur du site ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Éditeur du site</h2>
        <p>
          CinéDélices est un projet pédagogique réalisé dans le cadre
          de la formation Concepteur Développeur d'Applications (CDA)
          de l'école O'Clock.
        </p>
        <ul className={styles.list}>
          <li><span className={styles.label}>Projet :</span> CinéDélices</li>
          <li><span className={styles.label}>Type :</span> Projet pédagogique (non commercial)</li>
          <li><span className={styles.label}>École :</span> O'Clock</li>
          <li><span className={styles.label}>Année :</span> 2026</li>
          <li>
            <span className={styles.label}>Équipe :</span> Hameni Abanya,
            Vincent Duverger, Orianne Jaunet, Nathalie Leduc, Emilie Vatelin
          </li>
        </ul>
      </section>

      {/* ── 2. Hébergement ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Hébergement</h2>
        <ul className={styles.list}>
          <li><span className={styles.label}>Hébergeur :</span> Render (render.com)</li>
          <li><span className={styles.label}>Front-end :</span> React (Vite) — hébergé sur Render</li>
          <li><span className={styles.label}>Back-end :</span> Node.js / Express — hébergé sur Render</li>
          <li><span className={styles.label}>Base de données :</span> PostgreSQL — hébergé sur Render</li>
          <li>
            <span className={styles.label}>Localisation :</span> Serveurs situés
            dans l'Union européenne ou aux États-Unis (Render Inc.)
          </li>
        </ul>
      </section>

      {/* ── 3. Propriété intellectuelle ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Propriété intellectuelle</h2>
        <p>
          Les recettes publiées sur CinéDélices sont proposées par les
          utilisateurs du site et restent la propriété de leurs auteurs.
          Les visuels et données relatifs aux films et séries proviennent
          de l'API TMDB (The Movie Database).
        </p>
        <p>
          Le code source du projet est réalisé dans un cadre pédagogique
          et n'est pas destiné à un usage commercial.
        </p>
        <p className={styles.tmdb}>
          🎬 This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </section>

      {/* ── 4. Données personnelles (RGPD) ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Données personnelles (RGPD)</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données
          (RGPD — Règlement UE 2016/679) et à la loi Informatique et
          Libertés du 6 janvier 1978 modifiée, nous vous informons des
          éléments suivants :
        </p>

        <h3 className={styles.sectionTitle}>4.1 Données collectées</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Lors de l'inscription :</span> adresse
            email, pseudo, nom (optionnel), mot de passe (stocké sous forme
            hashée avec Argon2 — jamais en clair)
          </li>
          <li>
            <span className={styles.label}>Lors de la connexion :</span> date et
            heure de dernière connexion (champ technique nécessaire à la
            gestion de l'inactivité)
          </li>
          <li>
            <span className={styles.label}>Lors de l'utilisation :</span> recettes
            créées, ingrédients soumis, préférences de consentement cookies
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>4.2 Finalité du traitement</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Authentification :</span> permettre
            la connexion et l'accès à l'espace membre
          </li>
          <li>
            <span className={styles.label}>Contribution :</span> permettre la
            création et la publication de recettes
          </li>
          <li>
            <span className={styles.label}>Gestion de l'inactivité :</span> détecter
            les comptes inactifs et appliquer la politique de conservation
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>4.3 Durée de conservation</h3>
        <p>
          Conformément aux recommandations de la CNIL, les données personnelles
          sont conservées pendant la durée d'utilisation active du compte,
          avec une <strong>limite maximale de 12 mois d'inactivité</strong>.
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Après 11 mois d'inactivité :</span> un
            email de prévenance est envoyé à l'adresse associée au compte,
            vous informant de la suppression prochaine
          </li>
          <li>
            <span className={styles.label}>Après 12 mois d'inactivité :</span> le
            compte est automatiquement supprimé. Un email de confirmation
            vous est envoyé.
          </li>
          <li>
            <span className={styles.label}>Recettes publiées :</span> en cas de
            suppression du compte (volontaire ou automatique), vos recettes
            publiées restent visibles de manière anonyme sur le site.
            Les recettes en brouillon ou en attente de validation sont
            définitivement supprimées.
          </li>
          <li>
            <span className={styles.label}>Données supprimées :</span> email,
            pseudo, nom, mot de passe hashé, notifications, préférences
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>4.4 Vos droits</h3>
        <p>
          Vous disposez des droits suivants sur vos données personnelles :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Droit d'accès :</span> consulter
            les données associées à votre compte via votre profil membre
          </li>
          <li>
            <span className={styles.label}>Droit de rectification :</span> modifier
            vos informations (pseudo, email, nom) depuis votre profil
          </li>
          <li>
            <span className={styles.label}>Droit de suppression :</span> supprimer
            votre compte à tout moment via la rubrique « Supprimer mon
            compte » dans votre profil
          </li>
          <li>
            <span className={styles.label}>Droit d'opposition :</span> vous pouvez
            refuser le dépôt de cookies non essentiels via le panneau
            de gestion des cookies (icône en bas à gauche de l'écran)
          </li>
          <li>
            <span className={styles.label}>Droit à la portabilité :</span> vous
            pouvez demander l'export de vos données en contactant l'équipe
          </li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous via
          la <Link to="/contact" className={styles.link}>page Contact</Link>.
        </p>
      </section>

      {/* ── 5. Cookies ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Cookies</h2>
        <p>
          CinéDélices utilise un gestionnaire de consentement conforme
          aux recommandations de la CNIL :{' '}
          <strong>Tarteaucitron.js</strong> (solution open source française).
        </p>

        <h3 className={styles.sectionTitle}>5.1 Cookies strictement nécessaires</h3>
        <p>
          Ces cookies sont indispensables au fonctionnement du site et
          ne nécessitent pas votre consentement :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Token JWT :</span> stocké en
            localStorage, permet votre authentification. Supprimé à la
            déconnexion.
          </li>
          <li>
            <span className={styles.label}>Cookie tarteaucitron :</span> enregistre
            vos préférences de consentement cookies. Durée : 6 mois maximum
            (obligation CNIL).
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>5.2 Services tiers</h3>
        <p>
          Les services suivants nécessitent votre consentement explicite
          avant toute activation :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>TMDB (The Movie Database) :</span> les
            images des films et séries (posters) sont chargées depuis les
            serveurs de TMDB (image.tmdb.org). Ce chargement permet
            potentiellement à TMDB de collecter des données de navigation
            (adresse IP, user-agent).{' '}
            <a
              href="https://www.themoviedb.org/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Politique de confidentialité TMDB
            </a>
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>5.3 Ce que nous ne faisons PAS</h3>
        <ul className={styles.list}>
          <li>✅ Aucun cookie publicitaire</li>
          <li>✅ Aucun traceur analytique (pas de Google Analytics)</li>
          <li>✅ Aucune donnée vendue ou transmise à des partenaires commerciaux</li>
          <li>✅ Aucun profilage comportemental</li>
        </ul>

        <h3 className={styles.sectionTitle}>5.4 Gestion de vos préférences</h3>
        <p>
          Vous pouvez modifier vos préférences cookies à tout moment en
          cliquant sur l'icône 🍋 en bas à gauche de l'écran, ou en
          ajoutant <code>#tarteaucitron</code> à l'URL de n'importe
          quelle page du site.
        </p>
        <p>
          Le consentement cookies expire automatiquement après{' '}
          <strong>6 mois</strong> (182 jours), conformément aux
          recommandations de la CNIL. Passé ce délai, le bandeau de
          consentement réapparaît.
        </p>
      </section>

      {/* ── 6. Suppression de compte ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Suppression de compte</h2>

        <h3 className={styles.sectionTitle}>6.1 Suppression volontaire</h3>
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis votre
          espace membre (rubrique « Mon profil » → « Supprimer mon compte »).
        </p>

        <h3 className={styles.sectionTitle}>6.2 Suppression automatique (inactivité)</h3>
        <p>
          Conformément aux recommandations de la CNIL sur la durée de
          conservation des données :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>11 mois sans connexion :</span> vous
            recevez un email de prévenance vous invitant à vous reconnecter
          </li>
          <li>
            <span className={styles.label}>12 mois sans connexion :</span> votre
            compte est automatiquement supprimé et un email de confirmation
            vous est envoyé
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>6.3 Conséquences de la suppression</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Données supprimées :</span> email,
            pseudo, nom, mot de passe, notifications
          </li>
          <li>
            <span className={styles.label}>Recettes en brouillon / en attente :</span> supprimées
            définitivement
          </li>
          <li>
            <span className={styles.label}>Recettes publiées :</span> conservées
            de manière anonyme (mention « Ancien membre ») pour préserver
            le contenu communautaire du site
          </li>
        </ul>
      </section>

      {/* ── 7. Sécurité ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Sécurité</h2>
        <p>
          CinéDélices met en œuvre les mesures techniques suivantes pour
          protéger vos données :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Mots de passe :</span> hashés avec
            Argon2 (algorithme recommandé par l'OWASP) — jamais stockés
            en clair
          </li>
          <li>
            <span className={styles.label}>Authentification :</span> par token
            JWT avec expiration automatique
          </li>
          <li>
            <span className={styles.label}>Communications :</span> chiffrées
            en HTTPS (TLS)
          </li>
          <li>
            <span className={styles.label}>Headers HTTP :</span> sécurisés
            avec Helmet.js
          </li>
          <li>
            <span className={styles.label}>API tierce :</span> la clé API TMDB
            est protégée côté serveur (proxy), jamais exposée au navigateur
          </li>
          <li>
            <span className={styles.label}>Rate limiting :</span> protection
            contre les requêtes abusives sur les routes TMDB
          </li>
        </ul>
      </section>

      {/* ── 8. Contact ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Contact</h2>
        <p>
          Pour toute question relative au site, à vos données personnelles,
          ou pour exercer vos droits RGPD, vous pouvez contacter l'équipe
          via la <Link to="/contact" className={styles.link}>page Contact</Link>.
        </p>
        <p>
          En cas de litige relatif à la protection de vos données, vous
          pouvez introduire une réclamation auprès de la{' '}
          <a
            href="https://www.cnil.fr/fr/plaintes"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            CNIL (Commission Nationale de l'Informatique et des Libertés)
          </a>.
        </p>
      </section>

      {/* ── Dernière mise à jour ── */}
      <p style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', marginTop: '2rem' }}>
        Dernière mise à jour : mars 2026
      </p>
    </div>
  );
}
