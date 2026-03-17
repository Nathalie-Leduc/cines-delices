import styles from './AdminSidebar.module.scss';

export default function AdminSidebar() {
  return (
    <aside className={styles.adminSidebar}>
      <nav>
        <ul>
          <li>Recettes</li>
          <li>Catégories</li>
          <li>Utilisateurs</li>
        </ul>
      </nav>
    </aside>
  );
}

/*const AdminSidebar = () => {
  return (
    <aside className={styles.adminSidebar}>
      <nav>
        <ul>
          <li>Recettes</li>
          <li>Catégories</li>
          <li>Utilisateurs</li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;*/