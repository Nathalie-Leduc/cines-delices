import styles from './AdminHeader.module.scss';

const AdminHeader = ({ toggleSidebar }) => {
  return (
    <header className={styles.adminHeader}>
      <button onClick={toggleSidebar} className={styles.toggleButton}>
        ☰ {/* Icône hamburger */}
      </button>
      <h1>Panneau d'administration</h1>
      <button>Déconnexion</button>
    </header>
  );
};

export default AdminHeader;