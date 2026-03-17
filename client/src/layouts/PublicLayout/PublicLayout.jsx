import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar";
import styles from "./PublicLayout.module.scss";

export default function PublicLayout() {
  return (
    <>
      <Navbar />

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>© CinéDélices</p>
      </footer>
    </>
  );
}