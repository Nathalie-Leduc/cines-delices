import { getReadableFeedbackMessage } from '../../utils/uiFeedback';
import styles from './Alert.module.scss';

const SYMBOLS = {
  success: '✓',
  error: '!',
  info: 'i',
};

export default function Alert({
  type = 'error',
  title = '',
  message,
  children,
  fallbackMessage = '',
  onClose,
  className = '',
}) {
  const hasCustomContent = children !== undefined && children !== null;
  const hasMessage = typeof message === 'string'
    ? message.trim().length > 0
    : Boolean(message);

  if (!hasCustomContent && !hasMessage && !title) return null;

  const resolvedMessage = !hasCustomContent && type === 'error'
    ? getReadableFeedbackMessage(
        message,
        fallbackMessage || 'Une erreur empêche d’afficher cette information pour le moment.',
      )
    : message;
  const content = hasCustomContent ? children : resolvedMessage;

  if (!content && !title) return null;

  return (
    <div
      className={`${styles.alert} ${styles[type]} ${className}`.trim()}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span className={styles.icon} aria-hidden="true">
        {SYMBOLS[type] || SYMBOLS.info}
      </span>
      <span className={styles.copy}>
        {title ? <strong className={styles.title}>{title}</strong> : null}
        {content ? <div className={styles.message}>{content}</div> : null}
      </span>
      {onClose && (
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer le message">
          ✕
        </button>
      )}
    </div>
  );
}
