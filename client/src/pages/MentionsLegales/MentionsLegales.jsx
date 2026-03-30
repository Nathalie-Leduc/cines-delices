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
      <h1 className={styles.title}>🎬 Mentions Légales</h1>

      {/* ── 1. Éditeur ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🎥 Scène 1 — La production</h2>
        <p>
          CinéDélices est une production indépendante réalisée dans le cadre
          de la formation Concepteur Développeur d'Applications (CDA)
          de l'école O'Clock. Comme tout bon film indé, il est fait avec
          passion, du café et beaucoup de commits Git.
        </p>
        <ul className={styles.list}>
          <li><span className={styles.label}>Production :</span> CinéDélices</li>
          <li><span className={styles.label}>Genre :</span> Projet pédagogique (non commercial)</li>
          <li><span className={styles.label}>Studio :</span> O'Clock</li>
          <li><span className={styles.label}>Année de sortie :</span> 2026</li>
          <li>
            <span className={styles.label}>Distribution :</span> Hameni Abanya,
            Vincent Duverger, Orianne Jaunet, Nathalie Leduc, Emilie Vatelin
          </li>
        </ul>
      </section>

      {/* ── 2. Hébergement ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🏢 Scène 2 — Les studios (hébergement)</h2>
        <p>
          Tout film a besoin de studios pour être tourné. Voici les nôtres :
        </p>
        <ul className={styles.list}>
          <li><span className={styles.label}>Studio principal :</span> Render (render.com)</li>
          <li><span className={styles.label}>Plateau front-end :</span> React (Vite) — tourné sur Render</li>
          <li><span className={styles.label}>Plateau back-end :</span> Node.js / Express — tourné sur Render</li>
          <li><span className={styles.label}>Archives du film :</span> PostgreSQL — stockées sur Render</li>
          <li>
            <span className={styles.label}>Localisation des studios :</span> Union
            européenne ou États-Unis (Render Inc.)
          </li>
        </ul>
      </section>

      {/* ── 3. Propriété intellectuelle ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>©️ Scène 3 — Les droits d'auteur</h2>
        <p>
          Les recettes publiées sur CinéDélices sont les scénarios originaux
          de nos membres-scénaristes et restent leur propriété. Les affiches
          et données sur les films et séries proviennent de l'API TMDB
          (The Movie Database) — nos fournisseurs d'accessoires officiels.
        </p>
        <p>
          Le code source de cette production est réalisé dans un cadre
          pédagogique. Pas de suite commerciale prévue... pour l'instant.
        </p>
        <p className={styles.tmdb}>
          🎬 This product uses the TMDB API but is not endorsed or certified
          by TMDB. Comme dirait un producteur : « On utilise leurs affiches,
          mais ils ne nous ont pas donné d'Oscar pour autant. »
        </p>
      </section>

      {/* ── 4. RGPD ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🔐 Scène 4 — Les coulisses (vos données personnelles)</h2>
        <p>
          Même dans les coulisses d'un tournage, on respecte la vie privée
          de chacun. Conformément au RGPD (le scénario européen de protection
          des données) et à la loi Informatique et Libertés, voici comment
          on gère vos infos :
        </p>

        <h3 className={styles.sectionTitle}>🎬 Prise 1 — Ce qu'on filme (données collectées)</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>À l'inscription :</span> email,
            pseudo, nom (optionnel), mot de passe (hashé avec Argon2 —
            même la CIA ne pourrait pas le lire)
          </li>
          <li>
            <span className={styles.label}>À chaque connexion :</span> date
            et heure de dernière visite (pour savoir si vous êtes encore
            dans la salle ou si vous avez quitté le cinéma)
          </li>
          <li>
            <span className={styles.label}>En coulisses :</span> recettes
            créées, ingrédients soumis, préférences cookies
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>🎬 Prise 2 — Pourquoi on filme</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Authentification :</span> vous
            reconnaître à l'entrée du cinéma (login)
          </li>
          <li>
            <span className={styles.label}>Contribution :</span> vous
            permettre de soumettre vos scénarios culinaires
          </li>
          <li>
            <span className={styles.label}>Gestion de l'inactivité :</span> savoir
            si vous êtes toujours spectateur ou si vous avez quitté la salle
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>🎬 Prise 3 — Combien de temps on garde les rushes</h3>
        <p>
          Comme au cinéma, les rushes inutilisés finissent par être effacés.
          La CNIL recommande une <strong>durée maximale de 12 mois
          d'inactivité</strong>.
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>11 mois sans connexion :</span> on
            vous envoie un courrier de rappel — « Hé, le film continue
            sans vous ! Revenez ! »
          </li>
          <li>
            <span className={styles.label}>12 mois sans connexion :</span> générique
            de fin. Votre compte est supprimé automatiquement avec un
            email de confirmation.
          </li>
          <li>
            <span className={styles.label}>Vos recettes publiées :</span> elles
            restent au programme sous la mention « Ancien membre ».
            Les brouillons et recettes en attente sont coupés au montage.
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>🎬 Prise 4 — Vos droits de star</h3>
        <p>
          Même les figurants ont des droits. Et vous, vous êtes la star :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Droit d'accès :</span> consulter
            votre fiche de casting depuis votre profil
          </li>
          <li>
            <span className={styles.label}>Droit de rectification :</span> corriger
            votre nom au générique (pseudo, email, nom)
          </li>
          <li>
            <span className={styles.label}>Droit de suppression :</span> quitter
            la production à tout moment via « Supprimer mon compte »
          </li>
          <li>
            <span className={styles.label}>Droit d'opposition :</span> refuser
            les cookies non essentiels via le panneau Tarteaucitron
            (l'icône 🍋 en bas à gauche)
          </li>
          <li>
            <span className={styles.label}>Droit à la portabilité :</span> demander
            l'export de votre filmographie personnelle
          </li>
        </ul>
        <p>
          Pour exercer vos droits de star, contactez la production via
          la <Link to="/contact" className={styles.link}>page Contact</Link>.
        </p>
      </section>

      {/* ── 5. Cookies ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🍪 Scène 5 — Le buffet (cookies)</h2>
        <p>
          Sur notre plateau, le buffet est géré par{' '}
          <strong>Tarteaucitron.js</strong> — un chef pâtissier open source
          et français qui s'assure que vous ne mangez que ce que vous
          avez choisi.
        </p>

        <h3 className={styles.sectionTitle}>Les plats obligatoires (cookies techniques)</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Token JWT :</span> votre badge
            d'accès aux coulisses. Supprimé à la déconnexion.
          </li>
          <li>
            <span className={styles.label}>Cookie tarteaucitron :</span> la
            note du chef pâtissier qui retient vos préférences au buffet.
            Durée : 6 mois max (le chef a bonne mémoire, mais pas éternelle).
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>Le menu à la carte (services tiers)</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>TMDB :</span> les affiches de films
            sont livrées par TMDB (image.tmdb.org). Ce livreur peut
            noter votre adresse de livraison (IP, user-agent).
            Soumis à votre consentement.{' '}
            <a
              href="https://www.themoviedb.org/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Sa carte de visite
            </a>
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>Ce qu'il n'y a PAS au buffet</h3>
        <ul className={styles.list}>
          <li>✅ Aucun cookie publicitaire (pas de pop-corn sponsorisé)</li>
          <li>✅ Aucun traceur analytique (on ne compte pas vos pas dans le cinéma)</li>
          <li>✅ Aucune donnée vendue (votre billet reste votre billet)</li>
          <li>✅ Aucun profilage (on ne note pas vos goûts en films d'horreur)</li>
        </ul>

        <h3 className={styles.sectionTitle}>Changer d'avis au buffet</h3>
        <p>
          Cliquez sur l'icône 🍋 en bas à gauche ou ajoutez{' '}
          <code>#tarteaucitron</code> à l'URL. Le buffet rouvre ses portes
          automatiquement tous les <strong>6 mois</strong> pour vous
          redemander vos préférences.
        </p>
      </section>

      {/* ── 6. Suppression de compte ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🎬 Scène 6 — Le générique de fin (suppression de compte)</h2>

        <h3 className={styles.sectionTitle}>Départ volontaire</h3>
        <p>
          Vous pouvez quitter la distribution à tout moment depuis votre
          espace membre : « Mon profil » → « Supprimer mon compte ».
          Fondu au noir, générique.
        </p>

        <h3 className={styles.sectionTitle}>Fin de contrat automatique (inactivité)</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>11 mois d'absence :</span> le
            réalisateur vous envoie un courrier : « On tourne bientôt
            la suite, vous venez ? »
          </li>
          <li>
            <span className={styles.label}>12 mois d'absence :</span> clap
            de fin. Votre contrat est résilié automatiquement.
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>Ce qui reste après le générique</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Supprimé :</span> email, pseudo,
            nom, mot de passe, notifications — tout part avec vous
          </li>
          <li>
            <span className={styles.label}>Brouillons / en attente :</span> coupés
            au montage définitivement
          </li>
          <li>
            <span className={styles.label}>Recettes publiées :</span> restent
            à l'affiche sous « Ancien membre » — votre héritage culinaire
            cinématographique
          </li>
        </ul>
      </section>

      {/* ── 7. Sécurité ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🛡️ Scène 7 — La sécurité du plateau</h2>
        <p>
          Notre plateau est mieux gardé que le coffre-fort de Gringotts :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Mots de passe :</span> hashés avec
            Argon2 — même Voldemort ne pourrait pas les lire
          </li>
          <li>
            <span className={styles.label}>Authentification :</span> tokens
            JWT avec date d'expiration, comme un pass VIP temporaire
          </li>
          <li>
            <span className={styles.label}>Communications :</span> chiffrées
            en HTTPS — vos données voyagent en limousine blindée
          </li>
          <li>
            <span className={styles.label}>Headers HTTP :</span> sécurisés
            avec Helmet.js — le casque de protection du plateau
          </li>
          <li>
            <span className={styles.label}>API TMDB :</span> la clé est
            planquée côté serveur, comme le twist final d'un Shyamalan
          </li>
          <li>
            <span className={styles.label}>Rate limiting :</span> pas plus
            de 30 requêtes/minute — on ne court pas dans les couloirs
            du plateau
          </li>
        </ul>
      </section>

      {/* ── 8. Contact ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📬 Scène 8 — Contacter la production</h2>
        <p>
          Une question ? Un bug ? Un compliment ? Contactez l'équipe via
          la <Link to="/contact" className={styles.link}>page Contact</Link>.
          On répond plus vite que Flash, promis.
        </p>
        <p>
          Si vous estimez qu'on a mal joué notre rôle de protecteur de
          données, vous pouvez porter plainte auprès de la{' '}
          <a
            href="https://www.cnil.fr/fr/plaintes"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            CNIL
          </a>{' '}
          — les critiques de cinéma version données personnelles.
        </p>
      </section>

      <p style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', marginTop: '2rem' }}>
        Dernière mise à jour : mars 2026
      </p>
    </div>
  );
}
