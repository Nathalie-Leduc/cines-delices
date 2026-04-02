import { Outlet } from 'react-router-dom';
import MemberSidebar from '../../components/MemberSidebar/MemberSidebar.jsx';
import styles from './MemberDashboardLayout.module.scss';

export default function MemberDashboardLayout() {
  return (
    <section className={styles.memberSection}>
      <div className={styles.memberContainer}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeading}>
            <h1>Tableau de bord</h1>
            <span className={styles.roleBadge}>Espace membre</span>
          </div>
        </header>

        <div className={styles.memberGrid}>
          <div className={styles.leftRail}>
            <div className={styles.desktopSidebar}>
              <MemberSidebar />
            </div>
          </div>

          <main className={styles.memberMain}>
            <Outlet />
          </main>
        </div>
      </div>
    </section>
  );
}
