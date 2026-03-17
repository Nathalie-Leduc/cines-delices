import styles from './Alert.module.scss';

export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null;

  return (
    <div className={`${styles.alert} ${styles[type]}`}>
      <span className={styles.icon}>
        {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span className={styles.message}>{message}</span>
      {onClose && (
        <button type="button" className={styles.close} onClick={onClose}>✕</button>
      )}
    </div>
  );
}