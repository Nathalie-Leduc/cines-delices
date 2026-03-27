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
      <h1 className={styles.title}>Politique de gestion des cookies</h1>

      {/* ── Introduction ── */}
      <section className={styles.section}>
        <p>
          La présente politique vous informe sur l'utilisation des cookies
          et technologies similaires sur le site CinéDélices, conformément
          aux recommandations de la{' '}
          <a
            href="https://www.cnil.fr/fr/cookies-et-autres-traceurs"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            CNIL
          </a>{' '}
          (délibération n° 2020-091 du 17 septembre 2020).
        </p>
      </section>

      {/* ── 1. Qu'est-ce qu'un cookie ? ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Qu'est-ce qu'un cookie ?</h2>
        <p>
          Un cookie est un petit fichier texte déposé sur votre terminal
          (ordinateur, tablette, smartphone) lors de la visite d'un site web.
          Il permet au site de mémoriser des informations sur votre visite
          (préférences, session, etc.).
        </p>
        <p>
          Certains cookies sont strictement nécessaires au fonctionnement du
          site et ne requièrent pas votre consentement. D'autres, liés à des
          services tiers, nécessitent votre accord explicite avant d'être
          activés.
        </p>
      </section>

      {/* ── 2. Gestionnaire de consentement ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Gestionnaire de consentement</h2>
        <p>
          CinéDélices utilise <strong>Tarteaucitron.js</strong>, une solution
          open source française, pour gérer le consentement aux cookies.
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Solution :</span> Tarteaucitron.js
            (open source, gratuit)
          </li>
          <li>
            <span className={styles.label}>Site officiel :</span>{' '}
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
            <span className={styles.label}>Conformité :</span> conforme aux
            recommandations CNIL (consentement préalable, refus aussi
            simple que l'acceptation)
          </li>
        </ul>
      </section>

      {/* ── 3. Cookies utilisés ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Cookies utilisés sur CinéDélices</h2>

        <h3 className={styles.sectionTitle}>
          3.1 Cookies strictement nécessaires (exemptés de consentement)
        </h3>
        <p>
          Ces cookies sont indispensables au fonctionnement du site. Ils ne
          peuvent pas être désactivés.
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Token JWT (localStorage) :</span>{' '}
            permet votre authentification et maintient votre session
            connectée. Supprimé automatiquement à la déconnexion.
            Durée : jusqu'à la déconnexion ou 7 jours maximum.
          </li>
          <li>
            <span className={styles.label}>Cookie « tarteaucitron » :</span>{' '}
            enregistre vos préférences de consentement cookies (accepté,
            refusé, personnalisé). Durée : 182 jours (6 mois),
            conformément à la CNIL.
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>
          3.2 Services tiers (soumis à consentement)
        </h3>
        <p>
          Les services suivants ne sont activés qu'après votre consentement
          explicite via le bandeau cookies :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>TMDB (The Movie Database) :</span>{' '}
            les images des films et séries (posters, affiches) sont
            hébergées sur les serveurs de TMDB (image.tmdb.org). Le
            chargement de ces images permet potentiellement à TMDB de
            collecter certaines données techniques de navigation
            (adresse IP, user-agent, page de provenance).
          </li>
        </ul>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Type :</span> API / contenu média
          </li>
          <li>
            <span className={styles.label}>Éditeur :</span> TiVo Platform
            Technologies (TMDB)
          </li>
          <li>
            <span className={styles.label}>Finalité :</span> affichage des
            affiches de films et séries
          </li>
          <li>
            <span className={styles.label}>Cookies déposés :</span> aucun
            cookie direct, mais requêtes HTTP vers image.tmdb.org
          </li>
          <li>
            <span className={styles.label}>Politique de confidentialité :</span>{' '}
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

      {/* ── 4. Ce que nous n'utilisons PAS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          4. Services que nous n'utilisons PAS
        </h2>
        <p>
          Pour votre information, CinéDélices n'utilise aucun des services
          suivants :
        </p>
        <ul className={styles.list}>
          <li>✅ Aucun service d'analyse d'audience (Google Analytics, Matomo, etc.)</li>
          <li>✅ Aucune régie publicitaire</li>
          <li>✅ Aucun réseau social intégré (boutons de partage, pixels)</li>
          <li>✅ Aucun outil de profilage ou de remarketing</li>
          <li>✅ Aucun A/B testing</li>
          <li>✅ Aucune vidéo embarquée (YouTube, Vimeo, etc.)</li>
        </ul>
      </section>

      {/* ── 5. Gérer vos préférences ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Gérer vos préférences cookies</h2>

        <h3 className={styles.sectionTitle}>5.1 Via Tarteaucitron</h3>
        <p>
          Vous pouvez modifier vos choix à tout moment :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Icône cookies :</span> cliquez sur
            l'icône 🍋 en bas à gauche de l'écran
          </li>
          <li>
            <span className={styles.label}>URL directe :</span> ajoutez{' '}
            <code>#tarteaucitron</code> à l'URL de n'importe quelle page
          </li>
          <li>
            <span className={styles.label}>Renouvellement :</span> le bandeau
            réapparaît automatiquement tous les 6 mois pour renouveler
            votre consentement
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>5.2 Via votre navigateur</h3>
        <p>
          Vous pouvez également configurer votre navigateur pour bloquer
          ou supprimer les cookies. Voici les liens vers les instructions
          des principaux navigateurs :
        </p>
        <ul className={styles.list}>
          <li>
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Google Chrome
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a
              href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Safari
            </a>
          </li>
          <li>
            <a
              href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Microsoft Edge
            </a>
          </li>
        </ul>
      </section>

      {/* ── 6. Durée de validité du consentement ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Durée de validité du consentement</h2>
        <p>
          Conformément aux recommandations de la CNIL, votre consentement
          (acceptation ou refus) est valable pour une durée maximale
          de <strong>6 mois (182 jours)</strong>.
        </p>
        <p>
          Passé ce délai, le bandeau de consentement réapparaît
          automatiquement pour vous permettre de renouveler ou modifier
          votre choix. Cette durée s'applique aussi bien à l'acceptation
          qu'au refus des cookies.
        </p>
      </section>

      {/* ── 7. En savoir plus ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. En savoir plus</h2>
        <p>
          Pour plus d'informations sur les cookies et vos droits :
        </p>
        <ul className={styles.list}>
          <li>
            <a
              href="https://www.cnil.fr/fr/cookies-et-autres-traceurs"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              CNIL — Cookies et autres traceurs
            </a>
          </li>
          <li>
            <Link to="/mentions-legales" className={styles.link}>
              Mentions légales de CinéDélices
            </Link>
          </li>
          <li>
            <Link to="/politique-confidentialite" className={styles.link}>
              Politique de confidentialité de CinéDélices
            </Link>
          </li>
        </ul>
        <p>
          Pour toute question, contactez-nous via
          la <Link to="/contact" className={styles.link}>page Contact</Link>.
        </p>
      </section>

      {/* ── Dernière mise à jour ── */}
      <p style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', marginTop: '2rem' }}>
        Dernière mise à jour : mars 2026
      </p>
    </div>
  );
}
