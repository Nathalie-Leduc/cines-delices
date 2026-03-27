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
      <h1 className={styles.title}>Politique de confidentialité</h1>

      {/* ── Introduction ── */}
      <section className={styles.section}>
        <p>
          La présente politique de confidentialité décrit comment CinéDélices
          collecte, utilise et protège vos données personnelles, conformément
          au Règlement Général sur la Protection des Données (RGPD — Règlement
          UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978
          modifiée.
        </p>
        <p>
          CinéDélices est un projet pédagogique réalisé dans le cadre de la
          formation CDA de l'école O'Clock. Il n'a pas de vocation commerciale.
        </p>
      </section>

      {/* ── 1. Responsable du traitement ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Responsable du traitement</h2>
        <ul className={styles.list}>
          <li><span className={styles.label}>Projet :</span> CinéDélices</li>
          <li><span className={styles.label}>Responsable :</span> Équipe CinéDélices — O'Clock 2026</li>
          <li>
            <span className={styles.label}>Contact :</span> via
            la <Link to="/contact" className={styles.link}>page Contact</Link> du site
          </li>
        </ul>
      </section>

      {/* ── 2. Données collectées ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Données collectées</h2>

        <h3 className={styles.sectionTitle}>2.1 Données fournies par l'utilisateur</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Inscription :</span> adresse email,
            pseudo, nom (optionnel), mot de passe
          </li>
          <li>
            <span className={styles.label}>Contribution :</span> recettes
            (titre, instructions, ingrédients, image), association à un
            film ou une série
          </li>
          <li>
            <span className={styles.label}>Profil :</span> modifications du
            pseudo, de l'email ou du nom
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>2.2 Données collectées automatiquement</h3>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Date de dernière connexion :</span> enregistrée
            à chaque authentification réussie, utilisée exclusivement pour
            la gestion de l'inactivité des comptes
          </li>
          <li>
            <span className={styles.label}>Préférences cookies :</span> votre
            choix d'acceptation ou de refus des cookies, stocké dans le
            cookie « tarteaucitron » (durée : 6 mois)
          </li>
        </ul>

        <h3 className={styles.sectionTitle}>2.3 Données NON collectées</h3>
        <ul className={styles.list}>
          <li>✅ Aucune donnée de géolocalisation</li>
          <li>✅ Aucune donnée de navigation (pas d'analytics)</li>
          <li>✅ Aucune donnée bancaire ou de paiement</li>
          <li>✅ Aucune donnée sensible (santé, religion, orientation, etc.)</li>
        </ul>
      </section>

      {/* ── 3. Finalités du traitement ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Finalités du traitement</h2>
        <p>Vos données sont utilisées exclusivement pour :</p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Authentification :</span> créer
            votre compte, vous connecter et sécuriser votre session
          </li>
          <li>
            <span className={styles.label}>Fonctionnalités :</span> publier
            des recettes, gérer vos contributions, recevoir des notifications
            de modération
          </li>
          <li>
            <span className={styles.label}>Conformité RGPD :</span> détecter
            les comptes inactifs et vous prévenir avant suppression
            automatique
          </li>
          <li>
            <span className={styles.label}>Communication :</span> vous envoyer
            des emails liés au fonctionnement du service (prévenance
            d'inactivité, confirmation de suppression)
          </li>
        </ul>
        <p>
          Vos données ne sont <strong>jamais</strong> utilisées à des fins
          publicitaires, de profilage, ou transmises à des tiers à des fins
          commerciales.
        </p>
      </section>

      {/* ── 4. Base légale ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Base légale du traitement</h2>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Consentement :</span> pour le dépôt
            de cookies non essentiels (images TMDB)
          </li>
          <li>
            <span className={styles.label}>Exécution du contrat :</span> pour
            la création du compte et l'utilisation des fonctionnalités
            du site
          </li>
          <li>
            <span className={styles.label}>Intérêt légitime :</span> pour
            la sécurité du site (rate limiting, hashage des mots de passe)
            et la gestion de l'inactivité
          </li>
        </ul>
      </section>

      {/* ── 5. Durée de conservation ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Durée de conservation</h2>
        <p>
          Conformément aux recommandations de la CNIL, vos données
          personnelles sont conservées selon les règles suivantes :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Compte actif :</span> vos données
            sont conservées tant que vous utilisez le service
          </li>
          <li>
            <span className={styles.label}>11 mois d'inactivité :</span> un
            email de prévenance vous est envoyé pour vous informer de
            la suppression prochaine de votre compte
          </li>
          <li>
            <span className={styles.label}>12 mois d'inactivité :</span> votre
            compte et vos données personnelles sont automatiquement
            supprimés. Un email de confirmation vous est envoyé.
          </li>
          <li>
            <span className={styles.label}>Mot de passe :</span> stocké
            uniquement sous forme hashée (Argon2), jamais en clair.
            Supprimé avec le compte.
          </li>
          <li>
            <span className={styles.label}>Cookie de consentement :</span> durée
            maximale de 6 mois (182 jours), conformément à la CNIL
          </li>
        </ul>
      </section>

      {/* ── 6. Partage des données ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Partage des données</h2>
        <p>
          Vos données personnelles ne sont <strong>jamais vendues</strong> à
          des tiers. Elles peuvent être partagées dans les cas suivants
          uniquement :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Hébergeur (Render) :</span> vos
            données sont stockées sur les serveurs de Render dans le
            cadre de l'hébergement du site
          </li>
          <li>
            <span className={styles.label}>TMDB :</span> lorsque vous
            consultez une page contenant des images de films/séries,
            votre navigateur contacte les serveurs de TMDB
            (image.tmdb.org) pour charger les posters. Ce chargement
            est soumis à votre consentement via le bandeau cookies.
          </li>
          <li>
            <span className={styles.label}>Email (SMTP) :</span> les emails
            de prévenance et de confirmation transitent par notre
            fournisseur SMTP
          </li>
        </ul>
      </section>

      {/* ── 7. Vos droits ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez des droits suivants :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Droit d'accès (art. 15) :</span> consulter
            toutes les données associées à votre compte depuis votre profil
          </li>
          <li>
            <span className={styles.label}>Droit de rectification (art. 16) :</span> modifier
            vos informations depuis votre profil membre
          </li>
          <li>
            <span className={styles.label}>Droit à l'effacement (art. 17) :</span> supprimer
            votre compte à tout moment via « Supprimer mon compte »
            dans votre profil
          </li>
          <li>
            <span className={styles.label}>Droit d'opposition (art. 21) :</span> refuser
            les cookies non essentiels via le panneau Tarteaucitron
          </li>
          <li>
            <span className={styles.label}>Droit à la portabilité (art. 20) :</span> demander
            l'export de vos données en nous contactant
          </li>
          <li>
            <span className={styles.label}>Droit à la limitation (art. 18) :</span> demander
            la suspension du traitement de vos données
          </li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous via
          la <Link to="/contact" className={styles.link}>page Contact</Link>.
          Nous répondrons dans un délai maximum de 30 jours.
        </p>
      </section>

      {/* ── 8. Sécurité ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Mesures de sécurité</h2>
        <p>
          CinéDélices met en œuvre les mesures techniques et organisationnelles
          suivantes pour protéger vos données :
        </p>
        <ul className={styles.list}>
          <li>
            <span className={styles.label}>Hashage :</span> mots de passe
            hashés avec Argon2 (recommandation OWASP)
          </li>
          <li>
            <span className={styles.label}>Chiffrement :</span> communications
            HTTPS (TLS) entre votre navigateur et nos serveurs
          </li>
          <li>
            <span className={styles.label}>Protection HTTP :</span> headers
            de sécurité configurés avec Helmet.js
          </li>
          <li>
            <span className={styles.label}>API sécurisée :</span> clé API TMDB
            protégée côté serveur (proxy), rate limiting sur les routes
            sensibles
          </li>
          <li>
            <span className={styles.label}>Authentification :</span> tokens
            JWT avec expiration automatique
          </li>
        </ul>
      </section>

      {/* ── 9. Réclamation ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Réclamation</h2>
        <p>
          Si vous estimez que le traitement de vos données ne respecte
          pas la réglementation en vigueur, vous pouvez introduire une
          réclamation auprès de la{' '}
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
