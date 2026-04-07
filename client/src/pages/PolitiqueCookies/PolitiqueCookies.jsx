import { Link } from 'react-router-dom';
import styles from './PolitiqueCookies.module.scss';

// ============================================================
// PAGE POLITIQUE COOKIES — Ciné Délices
// ============================================================
// Détail de tous les cookies et technologies de suivi utilisés,
// conformément aux recommandations CNIL d'octobre 2020.
// ============================================================

export default function PolitiqueCookies() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>🍪 Le buffet des cookies</h1>

      {/* ── Introduction ── */}
      <section className={styles.section}>
        <p>
          Bienvenue au buffet ! Chez CinéDélices, on ne vous force pas
          à tout manger. Cette carte vous explique ce qu'il y a sur la
          table, ce qui est inclus dans le menu, et ce que vous pouvez
          refuser. Le tout en conformité avec la{' '}
          <a
            href="https://www.cnil.fr/fr/cookies-et-autres-traceurs"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            CNIL
          </a>{' '}
          — le guide Michelin de la vie privée.
        </p>
      </section>

      {/* ── 1. C'est quoi un cookie ? ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🍿 Scène 1 — C'est quoi un cookie, au juste ?</h2>
        <p>
          Un cookie, c'est un petit fichier texte déposé sur votre
          appareil quand vous visitez un site. Pensez-y comme un ticket
          de cinéma : il prouve que vous êtes déjà venu et garde une
          trace de vos préférences (place favorite, pop-corn sucré ou salé).
        </p>
        <p>
          Certains cookies sont comme le ticket d'entrée — obligatoires
          pour rentrer dans la salle. D'autres sont les extras au bar —
          vous les prenez seulement si vous voulez.
        </p>
      </section>

      {/* ── 2. Le chef pâtissier ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🍋 Scène 2 — Le chef pâtissier (Tarteaucitron)</h2>
        <p>
          Notre buffet est géré par <strong>Tarteaucitron.js</strong> —
          un chef pâtissier français, open source, et très à cheval sur
          les règles d'hygiène numérique.
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Solution :</span> Tarteaucitron.js
            — le meilleur pâtissier du web français
          </li>
          <li>
            <span className={styles.label}>Son restaurant :</span>{' '}
            <a
              href="https://tarteaucitron.io"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              tarteaucitron.io
            </a>
          </li>
          <li>
            <span className={styles.label}>Étoile CNIL :</span> conforme aux
            recommandations (consentement préalable, refuser est aussi
            simple qu'accepter — pas de dark pattern au menu)
          </li>
        </ul>
      </section>

      {/* ── 3. La carte du buffet ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🎬 Scène 3 — La carte du buffet</h2>

        <h3 className={styles.sectionTitle}>
          Le menu fixe (cookies obligatoires — pas le choix, comme le générique)
        </h3>
        <p>
          Ces cookies sont le ticket d'entrée. Sans eux, pas de film :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Token JWT (localStorage) :</span> votre
            badge VIP pour accéder aux coulisses (espace membre).
            Disparaît à la déconnexion, comme les lumières à la fin
            de la séance. Durée max : 7 jours.
          </li>
          <li>
            <span className={styles.label}>Cookie « tarteaucitron » :</span> le
            carnet du chef pâtissier qui note vos préférences au buffet.
            Durée : 182 jours (6 mois). Après, il vous redemande ce que
            vous voulez — mémoire courte, mais conforme CNIL.
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>
          Le menu à la carte (services tiers — vous choisissez)
        </h3>
        <p>
          Ces extras ne sont servis qu'avec votre accord explicite :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>TMDB (The Movie Database) :</span> notre
            fournisseur d'affiches de films. Quand vous voyez un poster,
            votre navigateur va le chercher dans l'entrepôt de TMDB
            (image.tmdb.org). Ce livreur peut noter votre adresse
            (IP, user-agent, page visitée).
          </li>
        </ul>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Type :</span> fournisseur
            d'accessoires (API / contenu média)
          </li>
          <li>
            <span className={styles.label}>Producteur :</span> TiVo
            Platform Technologies (TMDB)
          </li>
          <li>
            <span className={styles.label}>Rôle :</span> livrer les
            affiches de films et séries sur votre écran
          </li>
          <li>
            <span className={styles.label}>Cookies déposés :</span> aucun
            cookie direct, mais des requêtes HTTP vers image.tmdb.org
          </li>
          <li>
            <span className={styles.label}>Sa carte de visite :</span>{' '}
            <a
              href="https://www.themoviedb.org/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              themoviedb.org/privacy-policy
            </a>
          </li>
        </ul>
      </section>

      {/* ── 4. Ce qu'il n'y a PAS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          🚫 Scène 4 — Ce qu'il n'y a PAS au buffet
        </h2>
        <p>
          Pour être clair comme de l'eau de roche (ou comme le scénario
          d'un Pixar) :
        </p>
        <ul className={styles.list}>
          <li>✅ Aucun traceur d'audience (on ne compte pas les spectateurs avec une caméra cachée)</li>
          <li>✅ Aucune publicité (pas de bande-annonce avant le film)</li>
          <li>✅ Aucun réseau social intégré (pas de bouton « J'aime » espion)</li>
          <li>✅ Aucun profilage (on ne note pas si vous préférez les comédies romantiques)</li>
          <li>✅ Aucun A/B testing (tout le monde voit le même film)</li>
          <li>✅ Aucune vidéo embarquée (pas de YouTube, pas de Vimeo)</li>
        </ul>
      </section>

      {/* ── 5. Changer d'avis ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🔄 Scène 5 — Changer d'avis au buffet</h2>

        <h3 className={styles.sectionTitle}>Via le chef pâtissier (Tarteaucitron)</h3>
        <p>
          Vous avez le droit de changer d'avis — même les meilleurs
          critiques révisent leurs notes :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>L'icône 🍋 :</span> en bas
            à gauche de l'écran, toujours disponible. Un clic et le
            buffet s'ouvre à nouveau.
          </li>
          <li>
            <span className={styles.label}>L'URL magique :</span> ajoutez{' '}
            <code>#tarteaucitron</code> à n'importe quelle page —
            comme un code de triche dans un jeu vidéo.
          </li>
          <li>
            <span className={styles.label}>Renouvellement automatique :</span> tous
            les 6 mois, le chef pâtissier vous redemande vos préférences.
            Il a une mémoire de poisson rouge (mais c'est la CNIL qui
            l'exige).
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>Via votre navigateur (la sortie de secours)</h3>
        <p>
          Vous pouvez aussi gérer les cookies directement depuis votre
          navigateur. Voici les modes d'emploi des principales salles :
        </p>
        <ul className={styles.list}>
          <li>
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Google Chrome — la salle IMAX
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Mozilla Firefox — le cinéma d'art et d'essai
            </a>
          </li>
          <li>
            <a
              href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Safari — la salle Apple
            </a>
          </li>
          <li>
            <a
              href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Microsoft Edge — le multiplexe du quartier
            </a>
          </li>
        </ul>
      </section>

      {/* ── 6. Durée du consentement ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>⏰ Scène 6 — La durée de validité du ticket</h2>
        <p>
          Votre consentement (que vous ayez dit oui ou non au buffet)
          est valable <strong>6 mois (182 jours)</strong>. C'est la CNIL
          qui fixe la date de péremption.
        </p>
        <p>
          Passé ce délai, le bandeau réapparaît — comme un film qui
          ressort en salle pour son anniversaire. Vous pouvez confirmer
          ou changer vos choix.
        </p>
      </section>

      {/* ── 7. En savoir plus ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📚 Générique — En savoir plus</h2>
        <p>
          Pour les cinéphiles de la vie privée, voici les bonus du DVD :
        </p>
        <ul className={styles.list}>
          <li>
            <a
              href="https://www.cnil.fr/fr/cookies-et-autres-traceurs"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              CNIL — Le guide complet des cookies (version director's cut)
            </a>
          </li>
          <li>
            <Link to="/mentions-legales" className={styles.link}>
              Mentions légales de CinéDélices (le making-off)
            </Link>
          </li>
          <li>
            <Link to="/politique-confidentialite" className={styles.link}>
              Politique de confidentialité (les coulisses)
            </Link>
          </li>
        </ul>
        <p>
          Une question sur le buffet ? Contactez le chef via
          la <Link to="/contact" className={styles.link}>page Contact</Link>.
        </p>
      </section>

      <p style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', marginTop: '2rem' }}>
        Dernière mise à jour : mars 2026
      </p>
    </div>
  );
}
