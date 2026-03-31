import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  getAdminCategories,
  getAdminIngredients,
  getAdminNotifications,
  getAdminRecipes,
  getAdminUsers,
  getPendingRecipes,
  getValidatedAdminIngredients,
} from '../../services/adminService.js';
import styles from './AdminSidebar.module.scss';

export default function AdminSidebar({ className = '', onNavigate, mobile = false }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [counts, setCounts] = useState({
    recipes: 0,
    users: 0,
    categories: 0,
    validatedIngredients: 0,
    pendingRecipes: 0,
    pendingIngredients: 0,
    unreadNotifications: 0,
  });
  const [recentNotifications, setRecentNotifications] = useState([]);

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

  async function loadCounts() {
    try {
      const [recipes, users, categories, validatedIngredients, pendingRecipes, pendingIngredients, notificationsPayload] = await Promise.all([
        getAdminRecipes(),
        getAdminUsers(),
        getAdminCategories(),
        getValidatedAdminIngredients(),
        getPendingRecipes(),
        getAdminIngredients(),
        getAdminNotifications(),
      ]);

      const notifications = Array.isArray(notificationsPayload?.notifications)
        ? notificationsPayload.notifications
        : [];

      setRecentNotifications(notifications);

      setCounts({
        recipes: Array.isArray(recipes) ? recipes.length : 0,
        users: Array.isArray(users) ? users.length : 0,
        categories: Array.isArray(categories) ? categories.length : 0,
        validatedIngredients: Array.isArray(validatedIngredients) ? validatedIngredients.length : 0,
        pendingRecipes: Array.isArray(pendingRecipes) ? pendingRecipes.length : 0,
        pendingIngredients: Array.isArray(pendingIngredients) ? pendingIngredients.length : 0,
        unreadNotifications: Number(notificationsPayload?.unreadCount || 0),
      });
    } catch {
      setRecentNotifications([]);
      setCounts({
        recipes: 0,
        users: 0,
        categories: 0,
        pendingRecipes: 0,
        pendingIngredients: 0,
        unreadNotifications: 0,
      });
    }
  }

  useEffect(() => {
    loadCounts();

    // Rafraîchir les comptes toutes les 5 secondes
    const interval = setInterval(loadCounts, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleNotificationConsumed(event) {
      const recipeId = event?.detail?.recipeId;
      if (!recipeId) {
        return;
      }

      setRecentNotifications((previous) => previous.filter((item) => item.recipeId !== recipeId));
      setCounts((previous) => ({
        ...previous,
        unreadNotifications: Math.max(0, previous.unreadNotifications - 1),
      }));
    }

    window.addEventListener('admin-notification-consumed', handleNotificationConsumed);

    return () => {
      window.removeEventListener('admin-notification-consumed', handleNotificationConsumed);
    };
  }, []);

  const items = [
    {
      to: '/admin/recettes',
      icon: '/icon/Recipes.svg',
      title: 'Gérer les recettes',
      sub: `${counts.recipes} recette${counts.recipes > 1 ? 's' : ''}`,
      subTone: 'recipe',
    },
    {
      to: '/admin/utilisateurs',
      icon: '/icon/User.svg',
      title: 'Gérer les utilisateurs',
      sub: `${counts.users} utilisateur${counts.users > 1 ? 's' : ''}`,
    },
    {
      to: '/admin/categories',
      icon: '/icon/Recipes.svg',
      title: 'Gérer les catégories',
      sub: `${counts.categories} catégorie${counts.categories > 1 ? 's' : ''}`,
    },
    {
      to: '/admin/ingredients',
      icon: '/icon/Recipes.svg',
      title: 'Gérer les ingrédients',
      sub: `${counts.validatedIngredients} ingrédient${counts.validatedIngredients > 1 ? 's' : ''}`,
    },
    {
      to: '/admin/validation-recettes',
      icon: '/icon/check_ring_round.svg',
      title: 'Validation des recettes',
      sub: `${counts.pendingRecipes} à valider`,
    },
    {
      to: '/admin/validation-ingredients',
      icon: '/icon/check_ring_round.svg',
      title: 'Validation des ingrédients',
      sub: `${counts.pendingIngredients} à valider`,
    },
  ];

  function handleLogout() {
    logout();
    onNavigate?.();
    navigate('/');
  }

  function handleItemClick(item) {
    if (item.to === '/admin/categories') {
      window.dispatchEvent(new Event('admin-categories-reset'));
    }

    onNavigate?.();
  }

  function handleOpenNotification(notification) {
    const message = String(notification?.message || '').toLowerCase();
    const isIngredientNotification = message.includes('nouvel ingrédient soumis');

    if (!notification?.recipeId && !isIngredientNotification) {
      return;
    }

    onNavigate?.();

    if (isIngredientNotification) {
      navigate('/admin/validation-ingredients');
      return;
    }

    navigate('/admin/validation-recettes', {
      state: { openRecipeId: notification.recipeId },
    });
  }

  const hasUnreadNotifications = counts.unreadNotifications > 0;
  const hasScrollableNotifications = recentNotifications.length > 2;

  return (
    <aside className={`${styles.adminSidebar} ${mobile ? styles.adminSidebarMobile : ''} ${className}`.trim()}>
      <nav className={styles.nav}>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => handleItemClick(item)}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`.trim()}
              >
                <span className={styles.icon}>
                  <img src={item.icon} alt="" aria-hidden="true" />
                </span>
                <span className={styles.text}>
                  <strong>{item.title}</strong>
                  <small className={item.subTone === 'recipe' ? styles.recipeCountTag : undefined}>{item.sub}</small>
                </span>
                <span className={styles.arrow} aria-hidden="true">›</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <section
        className={`${styles.notificationsBox} ${hasUnreadNotifications ? styles.notificationsBoxUnread : ''}`.trim()}
        aria-label="Notifications admin"
      >
        <div className={styles.notificationsHeader}>
          <strong>Notification(s)</strong>
          <span className={hasUnreadNotifications ? styles.notificationsCountUnread : styles.notificationsCount}>
            {hasUnreadNotifications ? <span className={styles.notificationsUnreadDot} aria-hidden="true" /> : null}
            {counts.unreadNotifications} non lue{counts.unreadNotifications > 1 ? 's' : ''}
          </span>
        </div>

        {recentNotifications.length === 0 ? (
          <p className={styles.notificationsEmpty}>Aucune alerte récente.</p>
        ) : (
          <ul className={`${styles.notificationsList} ${hasScrollableNotifications ? styles.notificationsListScrollable : ''}`.trim()}>
            {recentNotifications.map((notification) => (
              <li key={notification.id} className={styles.notificationItem}>
                <button
                  type="button"
                  className={styles.notificationButton}
                  onClick={() => handleOpenNotification(notification)}
                >
                  <p>{notification.message}</p>
                  <small>{formatNotificationDate(notification.createdAt)}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
        <span className={styles.logoutIcon}>
          <img src="/icon/Logout.svg" alt="" aria-hidden="true" />
        </span>
        Se déconnecter
        <span className={styles.arrow} aria-hidden="true">›</span>
      </button>
    </aside>
  );
}
