import styles from './AuthShell.module.scss';

export default function AuthShell({
  title,
  subtitle = '',
  children,
  contentClassName = '',
  bodyClassName = '',
  showBrand = true,
}) {
  return (
    <section className={styles.page}>
      <section className={`${styles.content} ${contentClassName}`.trim()}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>

        <div className={`${styles.body} ${bodyClassName}`.trim()}>
          {children}
        </div>

        {showBrand ? (
          <div className={styles.brand}>
            <img
              src="/img/logo-cines-delices.webp"
              alt="Ciné Délices"
              className={styles.logo}
            />
          </div>
        ) : null}
      </section>
    </section>
  );
}
