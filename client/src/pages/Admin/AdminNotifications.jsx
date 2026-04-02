import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import {
  deleteAdminNotification,
  getAdminNotifications,
} from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

const CONTACT_PREVIEW_LIMIT = 120;

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

function resolveNotificationTarget(notification) {
  const message = String(notification?.message || '').toLowerCase();
  const isIngredientNotification = message.includes('nouvel ingrédient soumis');

  if (isIngredientNotification) {
    return { path: '/admin/validation-ingredients' };
  }

  if (notification?.recipeId) {
    return {
      path: '/admin/validation-recettes',
      state: { openRecipeId: notification.recipeId },
    };
  }

  return null;
}

function isContactNotification(notification) {
  return String(notification?.message || '').toLowerCase().includes('formulaire de contact');
}

function buildContactNotificationPreview(message) {
  const normalized = String(message || '').replace(/\s+/g, ' ').trim();

  if (normalized.length <= CONTACT_PREVIEW_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, CONTACT_PREVIEW_LIMIT)}…`;
}

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [openedContactMessageNotification, setOpenedContactMessageNotification] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      setIsLoading(true);
      setError('');

      try {
        const payload = await getAdminNotifications(100);

        if (!isMounted) {
          return;
        }

        setNotifications(Array.isArray(payload?.notifications) ? payload.notifications : []);
        setUnreadCount(Number(payload?.unreadCount || 0));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || 'Impossible de charger les notifications admin.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDeleteNotification(notificationId) {
    try {
      await deleteAdminNotification(notificationId);
      setNotifications((previous) => previous.filter((notification) => notification.id !== notificationId));
      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (deleteError) {
      setError(deleteError.message || 'Suppression impossible.');
    }
  }

  function handleOpenNotification(notification) {
    const target = resolveNotificationTarget(notification);

    if (!target) {
      return;
    }

    navigate(target.path, target.state ? { state: target.state } : undefined);
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>Notifications</h2>
      </div>

      <p className={styles.pageIntro}>
        {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}.
      </p>

      <Alert
        type="error"
        message={error}
        onClose={() => setError('')}
        className={styles.pageState}
      />

      {isLoading ? (
        <StatusBlock
          variant="loading"
          title="Chargement des notifications"
          className={styles.pageState}
        />
      ) : null}

      {!isLoading && !error && notifications.length === 0 ? (
        <StatusBlock
          variant="empty"
          title="Aucune notification"
          message="Les nouvelles alertes admin apparaîtront ici."
          className={styles.pageState}
        />
      ) : null}

      {!isLoading && !error && notifications.length > 0 ? (
        <div className={styles.list}>
          {notifications.map((notification) => {
            const target = resolveNotificationTarget(notification);
            const isContact = isContactNotification(notification);
            const notificationMessage = isContact
              ? buildContactNotificationPreview(notification.message)
              : notification.message;

            return (
              <div key={notification.id} className={styles.categoryRow}>
                <div className={styles.ingredientIdentity}>
                  <strong style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.08rem', fontWeight: 700 }}>
                    {notificationMessage}
                  </strong>
                  <span className={styles.submittedByRowTag}>
                    {formatNotificationDate(notification.createdAt)}
                  </span>
                </div>

                <span className={styles.inlineTools}>
                  {target || isContact ? (
                    <button
                      type="button"
                      className={`${styles.roundIconBtn} ${styles.roundBlue}`.trim()}
                      title={isContact ? 'Voir le message complet' : 'Ouvrir'}
                      onClick={() => {
                        if (isContact) {
                          setOpenedContactMessageNotification(notification);
                          return;
                        }

                        handleOpenNotification(notification);
                      }}
                    >
                      <img src="/icon/Eye.svg" alt="" aria-hidden="true" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={`${styles.roundIconBtn} ${styles.roundRed}`.trim()}
                    title="Supprimer"
                    onClick={() => handleDeleteNotification(notification.id)}
                  >
                    <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {openedContactMessageNotification ? (
        <div className={styles.notificationMessageOverlay}>
          <div className={styles.notificationMessageModal}>
            <h3 className={styles.notificationMessageTitle}>Message de contact</h3>

            <p className={styles.notificationMessageBody}>
              {openedContactMessageNotification.message}
            </p>

            <p className={styles.notificationMessageMeta}>
              {formatNotificationDate(openedContactMessageNotification.createdAt)}
            </p>

            <div className={styles.notificationMessageActions}>
              <button
                type="button"
                className={styles.btnMuted}
                onClick={() => setOpenedContactMessageNotification(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
