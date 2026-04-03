import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Page dédiée aux informations cookies
const PRIVACY_URL = '/politique-cookies';
const PRIVACY_TRIGGER_SELECTOR = '#tarteaucitronPrivacyUrl, #tarteaucitronPrivacyUrlDialog';

export default function CookieConsent() {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePrivacyLinkClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const privacyButton = target.closest(PRIVACY_TRIGGER_SELECTOR);
      if (privacyButton) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        navigate(PRIVACY_URL);
        window.tarteaucitron?.userInterface?.closePanel?.();
        return;
      }

      const anchor = target.closest('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return;
      }

      let url;
      try {
        url = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin || url.pathname !== PRIVACY_URL) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      navigate(`${url.pathname}${url.search}${url.hash}`);
      window.tarteaucitron?.userInterface?.closePanel?.();
    };

    document.addEventListener('click', handlePrivacyLinkClick, true);

    return () => {
      document.removeEventListener('click', handlePrivacyLinkClick, true);
    };
  }, [navigate]);

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

      // Forcer la langue française pour éviter les erreurs de clé manquante
      window.tarteaucitronForceLanguage = 'fr';
      window.tarteaucitronCustomText = {
        alertSmall: 'Gérer les cookies',
        title: 'Gestion des cookies',
        privacyUrl: 'Politique des cookies',
      };

      // ─────────────────────────────────────────────
      // Initialisation Tarteaucitron
      // ─────────────────────────────────────────────
      window.tarteaucitron.init({
        // Lien vers la politique des cookies
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
