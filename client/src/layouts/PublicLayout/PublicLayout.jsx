import { Outlet } from "react-router-dom";
import styles from "./PublicLayout.module.scss";

function PublicLayout() {
  return (
    <>
      <header className={styles.header}>
        <h1>CinéDélices</h1>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>© CinéDélices</p>
      </footer>
    </>
  );
}

export default PublicLayout;