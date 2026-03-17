import { Outlet } from 'react-router-dom';
import Footer from '../../components/Footer';
import Navbar from '../../components/Navbar';
import styles from './PublicLayout.module.scss';

export default function PublicLayout() {
  return (
    <>
      <Navbar />

      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}