import styles from './AdminModal.module.scss';

export default function AdminModal({
  title,
  children,
  confirmLabel = 'Valider',
  cancelLabel = 'Annuler',
  confirmVariant = 'danger',
  onCancel,
  onConfirm,
}) {
  return (
    <div className={styles.backdrop} role="presentation" onClick={onCancel}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        {title ? <h2 className={styles.title}>{title}</h2> : null}

        <div className={styles.content}>
          {children}
        </div>

        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.muted}`.trim()} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.button} ${confirmVariant === 'success' ? styles.success : styles.danger}`.trim()}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
