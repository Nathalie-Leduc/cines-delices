import { useEffect } from 'react';
import './tarteaucitron-theme-cines-delices.css';

// ============================================================
// COMPOSANT CookieConsent — Bandeau cookies RGPD
// ============================================================
//
// Intègre Tarteaucitron.js dans l'app React.
// Se charge UNE SEULE FOIS au montage du composant.

//
// Placement : dans App.jsx (PAS dans chaque Layout),
// car le bandeau doit apparaître une seule fois quelle
// que soit la page visitée.
//
// Configuration CNIL :
//   - cookieExpires: 182 jours (6 mois max, obligation CNIL)
//   - highPrivacy: true (pas de consentement implicite)
//   - serviceDefaultState: "wait" (aucun cookie avant choix)
//   - DenyAllCta: true (refuser aussi simple qu'accepter)
// ============================================================

// URL de votre page mentions légales / politique de confidentialité
const PRIVACY_URL = '/mentions-legales';

export default function CookieConsent() {
  useEffect(() => {
    // Éviter le double chargement (React StrictMode en dev)
    if (window.tarteaucitron) {
      return;
    }

    const script = document.createElement('script');
    script.src = '/tarteaucitron/tarteaucitron.js';
    script.async = true;

    script.onload = () => {
      if (!window.tarteaucitron) {
        return;
      }

      // ─────────────────────────────────────────────
      // Initialisation Tarteaucitron
      // ─────────────────────────────────────────────
      window.tarteaucitron.init({
        // Lien vers la politique de confidentialité
        privacyUrl: PRIVACY_URL,

        // Position du bandeau
        bodyPosition: 'bottom',
        orientation: 'bottom',

        // Identifiant du cookie de consentement
        hashtag: '#tarteaucitron',
        cookieName: 'tarteaucitron',

        // ⚠️ OBLIGATION CNIL : expiration max 6 mois (182 jours)
        cookieExpires: 182,

        // Grouper les services par catégorie
        groupServices: false,

        // Afficher les détails au clic
        showDetailsOnClick: true,

        // ⚠️ RGPD strict : aucun cookie avant consentement explicite
        serviceDefaultState: 'wait',

        // Pas de petit bandeau persistant en bas à droite
        showAlertSmall: false,

        // Icône pour rouvrir le panneau de préférences cookies
        showIcon: true,
        iconPosition: 'BottomLeft',

        // ⚠️ OBLIGATION CNIL : refuser doit être aussi simple qu'accepter
        highPrivacy: true,
        DenyAllCta: true,
        AcceptAllCta: true,

        // Accessibilité
        handleBrowserDNTRequest: false,

        // On ne retire pas le crédit Tarteaucitron (version gratuite)
        removeCredit: false,

        // Portée du cookie : tout le site
        cookieDomain: '',

        // Désactiver le rechargement automatique de la page
        // (évite un refresh inattendu en SPA React)
        reloadThePage: false,
      });

      // ─────────────────────────────────────────────
      // Déclaration du service custom : cookie JWT
      // ─────────────────────────────────────────────
      // Votre app utilise un cookie/localStorage pour le JWT.
      // Ce cookie est TECHNIQUE (nécessaire au fonctionnement),
      // mais on le déclare quand même pour la transparence.
      //
      // Analogie : c'est comme la carte de fidélité du restaurant.
      // Elle est nécessaire pour accéder à l'espace membre,
      // mais on informe le client qu'elle existe.
      // ─────────────────────────────────────────────
      // Service 1 : Cookie JWT (technique, obligatoire)
      // ─────────────────────────────────────────────
      // needConsent: false → pas besoin de consentement
      // C'est un cookie strictement nécessaire au fonctionnement
      window.tarteaucitron.services.cinesdelicesjwt = {
        key: 'cinesdelicesjwt',
        type: 'other',
        name: 'Authentification Cinés Délices',
        needConsent: false,
        cookies: ['token'],
        readmoreLink: PRIVACY_URL,
        js: function () { 'use strict'; },
        fallback: function () { 'use strict'; },
      };

      // ─────────────────────────────────────────────
      // Service 2 : TMDB (service tiers, consentement requis)
      // ─────────────────────────────────────────────
      // Les images des films/séries sont chargées depuis
      // image.tmdb.org — c'est un appel tiers qui permet
      // potentiellement à TMDB de collecter des données
      // de navigation (IP, user-agent, referer).
      //
      // needConsent: true → déclenche le bandeau !
      window.tarteaucitron.services.tmdb = {
        key: 'tmdb',
        type: 'api',
        name: 'TMDB (The Movie Database)',
        needConsent: true,
        cookies: [],
        uri: 'https://www.themoviedb.org/privacy-policy',
        readmoreLink: 'https://www.themoviedb.org/privacy-policy',
        js: function () {
          'use strict';
          // Quand l'utilisateur accepte : les images TMDB se chargent
          // On dispatch un événement custom pour que React réagisse
          document.dispatchEvent(new CustomEvent('tmdb-consent', { detail: true }));
        },
        fallback: function () {
          'use strict';
          // Quand l'utilisateur refuse : on peut afficher un placeholder
          document.dispatchEvent(new CustomEvent('tmdb-consent', { detail: false }));
        },
      };

      // Enregistrer les services
      (window.tarteaucitron.job = window.tarteaucitron.job || []).push(
        'cinesdelicesjwt'
      );
      (window.tarteaucitron.job = window.tarteaucitron.job || []).push(
        'tmdb'
      );
    };

    document.head.appendChild(script);
  }, []);

  return null;
}