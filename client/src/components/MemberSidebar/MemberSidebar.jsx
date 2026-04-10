import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getMe } from '../../services/authService.js';
import { deleteMyNotification, getMyNotifications, getMyRecipes } from '../../services/recipesService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './MemberSidebar.module.scss';

function normalizeRecipe(rawRecipe) {
  const categoryLabel = String(rawRecipe?.categorie || rawRecipe?.category?.nom || rawRecipe?.category || '')
    .trim()
    .toLowerCase();

  return {
    ...rawRecipe,
    categorie: categoryLabel,
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function MemberSidebar({ className = '', onNavigate, mobile = false }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userEmail, setUserEmail] = useState('');
  const [memberRecipesCount, setMemberRecipesCount] = useState(0);
  const [pendingRecipesCount, setPendingRecipesCount] = useState(0);
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

    const isRejected =
      normalizedMessage.includes('a ete refusee')
      || normalizedMessage.includes('a été refusée')
      || normalizedMessage.includes('a ete refuse')
      || normalizedMessage.includes('a été refusé')
      || normalizedMessage.includes('refusee')
      || normalizedMessage.includes('refusée')
      || normalizedMessage.includes('refuse')
      || normalizedMessage.includes('refusé')
      || normalizedMessage.includes("n'a pas ete validee")
      || normalizedMessage.includes("n'a pas été validée")
      || normalizedMessage.includes('pas ete validee')
      || normalizedMessage.includes('pas été validée');

    if (isRejected) {
      return styles.notificationRejected;
    }

    const isApproved =
      normalizedMessage.includes('a ete validee')
      || normalizedMessage.includes('a été validée')
      || normalizedMessage.includes('validee')
      || normalizedMessage.includes('validée')
      || normalizedMessage.includes('valide')
      || normalizedMessage.includes('validé');

    if (isApproved) {
      return styles.notificationApproved;
    }

    return '';
  }

  useEffect(() => {
    let isActive = true;

    const loadSidebarData = async () => {
      try {
        const [profilePayload, recipesPayload, notificationsPayload] = await Promise.all([
          getMe().catch(() => null),
          getMyRecipes().catch(() => []),
          getMyNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
        ]);

        if (!isActive) {
          return;
        }

        const profile = profilePayload?.data ?? profilePayload ?? null;
        const recipesData = Array.isArray(recipesPayload)
          ? recipesPayload
          : Array.isArray(recipesPayload?.data)
            ? recipesPayload.data
            : [];
        const normalizedRecipes = recipesData.map(normalizeRecipe);
        const pendingCount = normalizedRecipes.filter(
          (recipe) => String(recipe?.status || '').toUpperCase() === 'PENDING',
        ).length;
        const notifications = Array.isArray(notificationsPayload?.notifications)
          ? notificationsPayload.notifications
          : [];

        setUserEmail(typeof profile?.email === 'string' ? profile.email : '');
        setPendingRecipesCount(pendingCount);
        setMemberRecipesCount(normalizedRecipes.length - pendingCount);
        setRecentNotifications(notifications);
        setUnreadNotifications(Number(notificationsPayload?.unreadCount || 0));
      } catch {
        if (!isActive) {
          return;
        }

        setUserEmail('');
        setPendingRecipesCount(0);
        setMemberRecipesCount(0);
        setRecentNotifications([]);
        setUnreadNotifications(0);
      }
    };

    loadSidebarData();

    const handleRecipesUpdated = () => {
      loadSidebarData();
    };

    window.addEventListener('member-recipes-updated', handleRecipesUpdated);

    return () => {
      isActive = false;
      window.removeEventListener('member-recipes-updated', handleRecipesUpdated);
    };
  }, []);

  function handleLogout() {
    logout();
    onNavigate?.();
    navigate('/');
  }

  function handleItemClick() {
    onNavigate?.();
  }

  function stopNotificationEvent(event) {
    if (!event) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  async function handleDeleteNotification(event, notification) {
    stopNotificationEvent(event);

    const notificationId = String(notification?.id || notification?.notificationId || '').trim();
    const isRead = Boolean(notification?.isRead);

    if (!notificationId) {
      return;
    }

    setRecentNotifications((previous) => (
      previous.filter((item) => String(item?.id || item?.notificationId || '').trim() !== notificationId)
    ));
    if (!isRead) {
      setUnreadNotifications((previous) => Math.max(0, previous - 1));
    }

    try {
      await deleteMyNotification(notificationId);
    } catch {
      const payload = await getMyNotifications().catch(() => ({ notifications: [], unreadCount: 0 }));
      const notifications = Array.isArray(payload?.notifications) ? payload.notifications : [];
      setRecentNotifications(notifications);
      setUnreadNotifications(Number(payload?.unreadCount || 0));
    }
  }

  function handleOpenNotification(notification) {
    const targetRecipeSlug = String(notification?.recipeSlug || '').trim();

    onNavigate?.();

    if (targetRecipeSlug) {
      navigate(`/recipes/${targetRecipeSlug}`);
      return;
    }

    if (notification?.recipeId && UUID_REGEX.test(String(notification.recipeId))) {
      navigate('/membre/mes-recettes', {
        state: { openEditRecipeId: notification.recipeId },
      });
      return;
    }

    if (notification?.recipeId) {
      navigate(`/recipes/${notification.recipeId}`);
      return;
    }

    navigate('/membre/notifications');
  }

  const accountItems = useMemo(() => [
    {
      icon: '/icon/Recipes.svg',
      label: 'Mes recettes',
      sub: `${memberRecipesCount} recette${memberRecipesCount > 1 ? 's' : ''}`,
      to: '/membre/mes-recettes',
      end: true,
      subTone: 'recipe',
    },
    {
      icon: '/icon/check_ring_round.svg',
      label: 'Recettes en cours de validation',
      sub: `${pendingRecipesCount} recette${pendingRecipesCount > 1 ? 's' : ''}`,
      to: '/membre/mes-recettes/recettes-en-validation',
      end: true,
    },
    {
      icon: '/icon/User.svg',
      label: 'Mes informations',
      sub: userEmail,
      to: '/membre/profil',
      end: true,
    },
    {
      icon: '/icon/Contact.svg',
      label: 'Contact',
      sub: 'help@support.cine-delices.com',
      to: '/membre/contact',
      end: true,
    },
  ], [memberRecipesCount, pendingRecipesCount, userEmail]);

  const hasUnreadNotifications = unreadNotifications > 0;
  const hasScrollableNotifications = recentNotifications.length > 2;

  return (
    <aside className={`${styles.accountPanel} ${mobile ? styles.accountPanelMobile : ''} ${className}`.trim()}>
      <div className={styles.accountLinks}>
        {accountItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={handleItemClick}
            className={({ isActive }) => `${styles.accountItem} ${isActive ? styles.accountItemActive : ''}`.trim()}
          >
            <span className={styles.accountIcon}>
              <img src={item.icon} alt="" aria-hidden="true" />
            </span>
            <span className={styles.accountContent}>
              <strong>{item.label}</strong>
              <small className={item.subTone === 'recipe' ? styles.accountSubTag : undefined}>
                {item.sub}
              </small>
            </span>
            <span className={styles.accountArrow} aria-hidden="true">
              <img src="/icon/arrow.svg" alt="" />
            </span>
          </NavLink>
        ))}
      </div>

      <section
        className={`${styles.notificationsBox} ${hasUnreadNotifications ? styles.notificationsBoxUnread : ''}`.trim()}
        aria-label="Notifications membre"
      >
        <div className={styles.notificationsHeader}>
          <button
            type="button"
            className={styles.notificationsHeadingButton}
            onClick={() => {
              onNavigate?.();
              navigate('/membre/notifications');
            }}
          >
            Notification(s)
          </button>
          <span className={hasUnreadNotifications ? styles.notificationsCountUnread : styles.notificationsCount}>
            {hasUnreadNotifications ? <span className={styles.notificationsUnreadDot} aria-hidden="true" /> : null}
            {unreadNotifications} non lue{unreadNotifications > 1 ? 's' : ''}
          </span>
        </div>

        {recentNotifications.length === 0 ? (
          <p className={styles.notificationsEmpty}>Aucune alerte récente.</p>
        ) : (
          <ul className={`${styles.notificationsList} ${hasScrollableNotifications ? styles.notificationsListScrollable : ''}`.trim()}>
            {recentNotifications.map((notification) => (
              <li
                key={notification.id}
                className={`${styles.notificationItem} ${getNotificationVariantClass(notification.message)}`.trim()}
              >
                <button
                  type="button"
                  className={styles.notificationButton}
                  onClick={() => handleOpenNotification(notification)}
                >
                  <p>{notification.message}</p>
                  <small>{formatNotificationDate(notification.createdAt)}</small>
                </button>
                <button
                  type="button"
                  className={styles.notificationDeleteButton}
                  aria-label="Supprimer cette notification"
                  title="Supprimer"
                  onPointerDown={stopNotificationEvent}
                  onClick={(event) => handleDeleteNotification(event, notification)}
                >
                  <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
        <span className={styles.logoutIcon}>
          <img src="/icon/On_button_fill.svg" alt="" aria-hidden="true" />
        </span>
        <span>Se déconnecter</span>
        <span className={styles.accountArrow} aria-hidden="true">
          <img src="/icon/arrow.svg" alt="" />
        </span>
      </button>
    </aside>
  );
}
