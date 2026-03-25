import { Outlet } from 'react-router-dom';
import Footer from '../../components/Footer';
import Navbar from '../../components/Navbar';
import styles from './MemberLayout.module.scss';

export default function MemberLayout() {
  return (
    <div className={styles.memberLayout}>
      <Navbar />

      <main className={styles.content}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}