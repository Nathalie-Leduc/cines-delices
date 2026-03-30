import { Link } from 'react-router-dom';
import styles from './PolitiqueConfidentialite.module.scss';

// ============================================================
// PAGE POLITIQUE DE CONFIDENTIALITÉ — Ciné Délices
// ============================================================
// Complète les mentions légales avec le détail du traitement
// des données personnelles (RGPD).
// ============================================================

export default function PolitiqueConfidentialite() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>🔐 Politique de confidentialité</h1>

      {/* ── Introduction ── */}
      <section className={styles.section}>
        <p>
          Bienvenue dans les coulisses de CinéDélices ! Ce document
          explique comment on gère vos données personnelles. Spoiler
          alert : on les protège mieux que le One Ring dans le Mordor.
        </p>
        <p>
          CinéDélices est une production pédagogique O'Clock 2026.
          Pas de studio hollywoodien derrière, juste une équipe de
          développeurs passionnés de cinéma et de cuisine.
        </p>
      </section>

      {/* ── 1. Le réalisateur des données ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🎬 Scène 1 — Le réalisateur des données</h2>
        <ul className={styles.list}>
          <li><span className={styles.label}>Production :</span> CinéDélices</li>
          <li><span className={styles.label}>Réalisateur :</span> Équipe CinéDélices — O'Clock 2026</li>
          <li>
            <span className={styles.label}>Contacter le réalisateur :</span> via
            la <Link to="/contact" className={styles.link}>page Contact</Link>
          </li>
        </ul>
      </section>

      {/* ── 2. Ce qu'on filme ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📹 Scène 2 — Ce qu'on filme (données collectées)</h2>

        <h3 className={styles.sectionTitle}>Les scènes que vous nous donnez</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Casting (inscription) :</span> email,
            pseudo, nom (optionnel), mot de passe — votre fiche d'acteur
          </li>
          <li>
            <span className={styles.label}>Tournage (contribution) :</span> recettes,
            ingrédients, photos — vos scénarios culinaires
          </li>
          <li>
            <span className={styles.label}>Retouches (profil) :</span> modifications
            de pseudo, email ou nom — corrections au générique
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>Les scènes captées automatiquement</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Date de dernière visite :</span> on
            note quand vous êtes venu au cinéma pour la dernière fois.
            Uniquement pour savoir si vous êtes encore dans la salle.
          </li>
          <li>
            <span className={styles.label}>Préférences cookies :</span> votre
            choix au buffet Tarteaucitron (6 mois de mémoire)
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>Ce qu'on ne filme JAMAIS</h3>
        <ul className={styles.list}>
          <li>✅ Aucune donnée de géolocalisation (on ne vous suit pas avec un drone)</li>
          <li>✅ Aucune donnée de navigation (pas de caméra cachée)</li>
          <li>✅ Aucune donnée bancaire (c'est gratuit, comme un film en plein air)</li>
          <li>✅ Aucune donnée sensible (votre vie privée reste hors-champ)</li>
        </ul>
      </section>

      {/* ── 3. Pourquoi on filme ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🎯 Scène 3 — Pourquoi on filme (finalités)</h2>
        <p>
          Chaque scène a une raison d'être dans un bon film.
          Pareil pour vos données :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Vous reconnaître :</span> vérifier
            votre badge d'accès au plateau (authentification)
          </li>
          <li>
            <span className={styles.label}>Tourner ensemble :</span> publier
            des recettes, gérer vos contributions, recevoir les notes
            du réalisateur (notifications de modération)
          </li>
          <li>
            <span className={styles.label}>Ranger le plateau :</span> détecter
            les acteurs qui ont quitté la salle et nettoyer après eux (RGPD)
          </li>
          <li>
            <span className={styles.label}>Vous prévenir :</span> envoyer
            des courriers de production (prévenance d'inactivité,
            confirmation de suppression)
          </li>
        </ul>
        <p className={styles.tmdb}>
          🎯 Vos données ne sont <strong>jamais</strong> vendues,
          échangées, ou projetées dans un autre cinéma. Promis sur
          le Code du Cinéma.
        </p>
      </section>

      {/* ── 4. Base légale ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>⚖️ Scène 4 — Le contrat de production (base légale)</h2>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Consentement :</span> pour le
            buffet cookies (vous choisissez ce que vous mangez)
          </li>
          <li>
            <span className={styles.label}>Exécution du contrat :</span> pour
            créer votre compte et utiliser le plateau (les fonctionnalités)
          </li>
          <li>
            <span className={styles.label}>Intérêt légitime :</span> pour
            la sécurité du plateau (rate limiting, hashage) et le ménage
            des comptes inactifs
          </li>
        </ul>
      </section>

      {/* ── 5. Durée de conservation ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>⏱️ Scène 5 — Combien de temps on garde les rushes</h2>
        <p>
          Comme au cinéma, les rushes inutilisés finissent par être effacés.
          La CNIL (notre critique de cinéma officiel) recommande :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Compte actif :</span> vos rushes
            sont conservés tant que vous tournez avec nous
          </li>
          <li>
            <span className={styles.label}>11 mois d'absence :</span> on
            vous envoie un pigeon voyageur — « Le tournage continue,
            vous revenez quand ? »
          </li>
          <li>
            <span className={styles.label}>12 mois d'absence :</span> clap
            de fin. Compte supprimé, email de confirmation envoyé.
            Fondu au noir.
          </li>
          <li>
            <span className={styles.label}>Mot de passe :</span> hashé avec
            Argon2 (illisible même pour nous), supprimé avec le compte
          </li>
          <li>
            <span className={styles.label}>Cookie de consentement :</span> 6
            mois max — le chef pâtissier a une mémoire limitée
          </li>
        </ul>
      </section>

      {/* ── 6. Partage des données ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🤝 Scène 6 — Les partenaires de production</h2>
        <p>
          Vos données ne sont <strong>jamais vendues</strong>. Mais comme
          tout film, on a quelques partenaires techniques :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Render (hébergeur) :</span> nos
            studios de tournage — vos données y sont stockées
          </li>
          <li>
            <span className={styles.label}>TMDB (affiches) :</span> quand
            vous regardez une page avec des posters, votre navigateur
            contacte les entrepôts de TMDB. Soumis à votre accord au buffet.
          </li>
          <li>
            <span className={styles.label}>SMTP (courrier) :</span> notre
            facteur qui livre vos emails de prévenance
          </li>
        </ul>
      </section>

      {/* ── 7. Vos droits ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>⭐ Scène 7 — Vos droits de star</h2>
        <p>
          Le RGPD, c'est comme la convention collective des acteurs.
          Voici vos droits :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Droit d'accès (art. 15) :</span> consulter
            votre fiche de casting depuis votre profil
          </li>
          <li>
            <span className={styles.label}>Droit de rectification (art. 16) :</span> corriger
            votre nom au générique
          </li>
          <li>
            <span className={styles.label}>Droit à l'effacement (art. 17) :</span> quitter
            la distribution à tout moment — « Supprimer mon compte »
          </li>
          <li>
            <span className={styles.label}>Droit d'opposition (art. 21) :</span> refuser
            les extras au buffet cookies via Tarteaucitron
          </li>
          <li>
            <span className={styles.label}>Droit à la portabilité (art. 20) :</span> demander
            une copie de votre filmographie personnelle
          </li>
          <li>
            <span className={styles.label}>Droit à la limitation (art. 18) :</span> mettre
            le tournage en pause sur vos données
          </li>
        </ul>
        <p>
          Pour exercer vos droits, contactez la production via
          la <Link to="/contact" className={styles.link}>page Contact</Link>.
          Réponse en moins de 30 jours — plus rapide qu'un Marvel au montage.
        </p>
      </section>

      {/* ── 8. Sécurité ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🛡️ Scène 8 — Les vigiles du plateau</h2>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Hashage Argon2 :</span> vos mots
            de passe sont broyés comme dans un mixer de Gordon Ramsay
          </li>
          <li>
            <span className={styles.label}>HTTPS :</span> vos données
            voyagent en limousine blindée, pas en bus scolaire
          </li>
          <li>
            <span className={styles.label}>Helmet.js :</span> le casque
            de sécurité obligatoire sur notre plateau
          </li>
          <li>
            <span className={styles.label}>Proxy TMDB :</span> la clé API
            est planquée côté serveur, comme le twist d'un Nolan
          </li>
          <li>
            <span className={styles.label}>JWT :</span> votre pass VIP
            expire automatiquement — pas de resquille
          </li>
        </ul>
      </section>

      {/* ── 9. Réclamation ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📝 Scène 9 — Le bureau des réclamations</h2>
        <p>
          Si vous pensez qu'on a raté notre prise sur la protection de
          vos données, vous pouvez contacter les critiques officiels :
          la{' '}
          <a
            href="https://www.cnil.fr/fr/plaintes"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            CNIL
          </a>{' '}
          — les Rotten Tomatoes de la vie privée.
        </p>
      </section>

      <p style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', marginTop: '2rem' }}>
        Dernière mise à jour : mars 2026
      </p>
    </div>
  );
}
