import { getReadableFeedbackMessage } from '../../utils/uiFeedback';
import styles from './StatusBlock.module.scss';

const DEFAULT_TITLES = {
  loading: 'Chargement en cours',
  empty: 'Aucune donnée disponible',
  error: 'Impossible d’afficher ce contenu',
  success: 'Action confirmée',
  info: 'Information',
};

const SYMBOLS = {
  empty: '·',
  error: '!',
  success: '✓',
  info: 'i',
};

export default function StatusBlock({
  variant = 'info',
  title,
  message = '',
  fallbackMessage = '',
  size = 'default',
  className = '',
  role,
  ariaLive,
}) {
  const resolvedTitle = title || DEFAULT_TITLES[variant] || DEFAULT_TITLES.info;
  const resolvedMessage = variant === 'error'
    ? getReadableFeedbackMessage(message, fallbackMessage)
    : message;

  const rootClassName = [
    styles.stateBlock,
    styles[variant] || styles.info,
    size === 'compact' ? styles.compact : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={rootClassName}
      role={role || (variant === 'error' ? 'alert' : 'status')}
      aria-live={ariaLive || (variant === 'error' ? 'assertive' : 'polite')}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        {variant === 'loading' ? (
          <span className={styles.spinner} />
        ) : (
          <span className={styles.symbol}>{SYMBOLS[variant] || SYMBOLS.info}</span>
        )}
      </span>

      <div className={styles.copy}>
        <p className={styles.title}>{resolvedTitle}</p>
        {resolvedMessage ? <p className={styles.message}>{resolvedMessage}</p> : null}
      </div>
    </div>
  );
}
