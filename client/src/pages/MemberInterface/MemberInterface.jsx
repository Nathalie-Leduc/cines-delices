import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MembreInterface.module.scss';

// ──────────────────────────────────────────────────────────────────────────
//  MODIF : import du hook useAuth pour accéder au contexte d'authentification
//  Avant  : pas d'import, le composant gérait la déconnexion tout seul
//           en supprimant manuellement le token dans le localStorage.
//  Après  : on passe par le contexte qui centralise tout (comme la Navbar).
// ──────────────────────────────────────────────────────────────────────────
import { useAuth } from '../../contexts/AuthContext.jsx';

const PROFILE_API = import.meta.env.VITE_PROFILE_API || 'http://localhost:3000/api/auth/me';
const USER_RECIPES_API = import.meta.env.VITE_RECIPES_API || 'http://localhost:3000/api/users/me/recipes';
const ADMIN_PENDING_RECIPES_API = import.meta.env.VITE_ADMIN_RECIPES_API || 'http://localhost:3000/api/admin/recipes/pending';
const USER_NOTIFICATIONS_API = import.meta.env.VITE_NOTIFICATIONS_API || 'http://localhost:3000/api/users/me/notifications';

// Décode le payload d'un JWT stocké dans le localStorage sans bibliothèque externe
function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function Membre() {
  const navigate = useNavigate();

   // ──────────────────────────────────────────────────────────────────────
  // 🔧 MODIF : on récupère logout depuis le contexte AuthContext
  //    Avant  : pas de useAuth(), le logout se faisait manuellement
  //    Après  : logout() vide le state React ET le localStorage d'un coup
  // ──────────────────────────────────────────────────────────────────────
   const { logout } = useAuth();

  // Nombre de recettes de l'utilisateur, mis à jour après l'appel API
  const [recipeCount, setRecipeCount] = useState(0);
  const [pendingRecipeCount, setPendingRecipeCount] = useState(0);

  // Rôle de l'utilisateur (ADMIN ou MEMBER)
  const [userRole, setUserRole] = useState('');

  // E-mail de l'utilisateur connecté, extrait du JWT
  const [userEmail, setUserEmail] = useState('');

  // Prénom/pseudo affiché dans le message de bienvenue
  const [userName, setUserName] = useState(localStorage.getItem('displayName') || '');
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  function formatNotificationDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getNotificationVariantClass(message) {
    const normalizedMessage = String(message || '').toLowerCase();

    if (
      normalizedMessage.includes('a ete validee')
      || normalizedMessage.includes('a été validée')
      || normalizedMessage.includes('validee')
      || normalizedMessage.includes('validée')
      || normalizedMessage.includes('valide')
      || normalizedMessage.includes('validé')
    ) {
      return styles.notificationApproved;
    }

    if (
      normalizedMessage.includes('a ete refusee')
      || normalizedMessage.includes('a été refusée')
      || normalizedMessage.includes('refusee')
      || normalizedMessage.includes('refusée')
      || normalizedMessage.includes('refuse')
      || normalizedMessage.includes('refusé')
    ) {
      return styles.notificationRejected;
    }

    return '';
  }

  async function handleDeleteNotification(notificationId, isRead) {
    const token = localStorage.getItem('token');
    if (!token || !notificationId) {
      return;
    }

    try {
      const response = await fetch(`${USER_NOTIFICATIONS_API}/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok && response.status !== 204) {
        throw new Error('Suppression impossible');
      }

      setRecentNotifications((previous) => previous.filter((notification) => notification.id !== notificationId));

      if (!isRead) {
        setUnreadNotifications((previous) => Math.max(0, previous - 1));
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  }

  // Au montage : lit l'e-mail et le rôle depuis le JWT et récupère le nombre de recettes via l'API
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('❌ Pas de token trouvé');
      return;
    }

    // Extrait l'e-mail et le rôle directement depuis le payload du token
    const payload = parseJwtPayload(token);
    console.log('✅ JWT Payload:', { email: payload?.email, role: payload?.role });
    
    if (payload?.email) {
      setUserEmail(payload.email);
    }
    // Extraire et stocker le rôle depuis le JWT
    if (payload?.role) {
      setUserRole(payload.role);
      console.log('✅ Rôle détecté:', payload.role);
    }

    if (!userName) {
      const savedDisplayName = localStorage.getItem('displayName');
      if (savedDisplayName) {
        setUserName(savedDisplayName);
      }
    }

    // Appel API pour récupérer le profil : prénom et nom
    const fetchProfile = async () => {
      try {
        const response = await fetch(PROFILE_API, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération du profil');

        const payload = await response.json();
        const user = payload?.data ?? payload;
        const rawName = (typeof user?.prenom === 'string' && user.prenom.trim())
          ? user.prenom
          : (typeof user?.pseudo === 'string' && user.pseudo.trim())
            ? user.pseudo
            : '';

        if (rawName) {
          const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
          setUserName(normalizedName);
          localStorage.setItem('displayName', normalizedName);
          window.dispatchEvent(new Event('user-display-name-updated'));
        }
      } catch (error) {
        console.error('Erreur fetchProfile:', error);
      }
    };

    // Appel API pour récupérer les recettes : adapté selon le rôle
    const fetchRecipes = async () => {
      try {
        // Pour les admins : récupérer les recettes en attente (modération)
        // Pour les membres : récupérer leurs recettes personnelles
        // ATTENTION: 'payload' est le JWT payload défini dans le useEffect scope
        const isAdmin = payload?.role === 'ADMIN';
        const recipesUrl = isAdmin ? ADMIN_PENDING_RECIPES_API : USER_RECIPES_API;

        const response = await fetch(recipesUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des recettes');

        const apiResponse = await response.json();
        // Les deux endpoints retournent directement un tableau
        const recipes = Array.isArray(apiResponse) ? apiResponse : [];
        const memberPendingRecipes = recipes.filter((recipe) => String(recipe?.status || '').toUpperCase() === 'PENDING');
        const memberVisibleRecipes = recipes.filter((recipe) => String(recipe?.status || '').toUpperCase() !== 'PENDING');

        const visibleRecipeCount = isAdmin ? recipes.length : memberVisibleRecipes.length;

        if (isAdmin) {
          setPendingRecipeCount(0);
        } else {
          setPendingRecipeCount(memberPendingRecipes.length);
        }

        console.log('✅ Recettes chargées:', visibleRecipeCount, 'recette(s)');
        setRecipeCount(visibleRecipeCount);
      } catch (error) {
        console.error('❌ Erreur fetchRecipes:', error);
        setRecipeCount(0);
        setPendingRecipeCount(0);
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await fetch(USER_NOTIFICATIONS_API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Erreur lors de la récupération des notifications');

        const payload = await response.json();
        const notifications = Array.isArray(payload?.notifications) ? payload.notifications : [];
        setRecentNotifications(notifications.slice(0, 3));
        setUnreadNotifications(Number(payload?.unreadCount || 0));
      } catch (error) {
        console.error('Erreur fetchNotifications:', error);
        setRecentNotifications([]);
        setUnreadNotifications(0);
      }
    };

    fetchProfile();
    fetchRecipes();
    fetchNotifications();
  }, []);

  // Éléments du menu de navigation du compte membre (adapté selon le rôle)
  const menuItems = [
    {
      icon: '/icon/Recipes.svg',
      // Pour admin : "Recettes en attente", pour membre : "Mes recettes"
      label: userRole === 'ADMIN' ? 'Recettes en attente' : 'Mes recettes',
      // Affiche le nombre réel de recettes récupéré depuis l'API
      sub: `${recipeCount} recette${recipeCount > 1 ? 's' : ''}`,
      details: userRole === 'ADMIN'
        ? []
        : [
          `Recettes en cours de validation : ${pendingRecipeCount}`,
        ],
      // Pour admin : rediriger vers le tableau admin, pour membre : vers ses recettes
      path: userRole === 'ADMIN' ? '/admin' : '/membre/mes-recettes',
      subTone: 'recipe',
    },
    {
      icon: '/icon/Message_fill.svg',
      label: 'Notifications',
      sub: `${unreadNotifications} non lue${unreadNotifications > 1 ? 's' : ''}`,
      path: '/membre',
    },
    {
      icon: '/icon/User.svg',
      label: 'Mes informations',
      // Affiche l'e-mail extrait du JWT (ou vide si non connecté)
      sub: userEmail,
      path: '/membre/profil',
    },
    {
      icon: '/icon/Contact.svg',
      label: 'Contact',
      sub: 'help@support.cine-delices.com',
      path: '/contact',
    },
  ];


  // ──────────────────────────────────────────────────────────────────────
  // 🔧 MODIF : handleLogout passe par le contexte AuthContext
  //
  //    Avant  : localStorage.removeItem('token') → supprimait le token
  //             mais l'AuthContext ne savait pas que l'utilisateur s'était
  //             déconnecté → la Navbar affichait toujours "Bonjour Marie"
  //
  //    Après  : logout() du contexte fait TOUT d'un coup :
  //             - supprime token, auth_user et displayName du localStorage
  //             - remet isAuthenticated à false dans le state React
  //             - la Navbar se re-rend automatiquement avec "Se connecter"
  // Supprime le token JWT et redirige vers l'accueil
  // ──────────────────────────────────────────────────────────────────────
  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className={styles.membre}>
      <h1 className={styles.title}>Mon compte</h1>
      <p className={styles.welcome}>
        Bonjour <strong>{userName}</strong>,<br />
        Bienvenue chez Cinés Délices !
      </p>

      <section className={styles.notificationsCard} aria-label="Notifications membre">
        <div className={styles.notificationsHeader}>
          <strong>Notifications</strong>
          <span>{unreadNotifications} non lue{unreadNotifications > 1 ? 's' : ''}</span>
        </div>

        {recentNotifications.length === 0 ? (
          <p className={styles.notificationsEmpty}>Aucune notification recente.</p>
        ) : (
          <ul className={styles.notificationsList}>
            {recentNotifications.map((notification) => (
              <li
                key={notification.id}
                className={`${styles.notificationItem} ${getNotificationVariantClass(notification.message)}`.trim()}
              >
                <button
                  type="button"
                  className={styles.notificationClose}
                  aria-label="Supprimer cette notification"
                  onClick={() => handleDeleteNotification(notification.id, notification.isRead)}
                >
                  ×
                </button>
                <p>{notification.message}</p>
                <small>{formatNotificationDate(notification.createdAt)}</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className={styles.menu}>
        {/* Génère dynamiquement chaque entrée du menu */}
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={styles.menuItem}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.icon}>
              <img src={item.icon} alt="" aria-hidden="true" />
            </span>
            <div className={styles.menuText}>
              <span className={styles.menuLabel}>{item.label}</span>
              <span className={`${styles.menuSub} ${item.subTone === 'recipe' ? styles.menuSubTag : ''}`.trim()}>{item.sub}</span>
              {item.path === '/membre/mes-recettes' && userRole !== 'ADMIN' ? (
                <div className={styles.menuMeta}>
                  <span className={styles.menuMetaItem}>Recettes en cours de validation : {pendingRecipeCount}</span>
                </div>
              ) : null}
            </div>
            <span className={styles.arrow}>›</span>
          </button>
        ))}

        {/* Bouton de déconnexion séparé du menu principal */}
        <button className={styles.logout} onClick={handleLogout}>
          <span className={styles.icon}>
            <img src="/icon/Logout.svg" alt="" aria-hidden="true" />
          </span>
          <span className={styles.menuLabel}>Se déconnecter</span>
          <span className={styles.arrow}>›</span>
        </button>
      </nav>
    </div>
  );
}
