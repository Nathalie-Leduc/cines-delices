import { NavLink } from 'react-router-dom';
import styles from './AdminSidebar.module.scss';

export default function AdminSidebar() {
  return (
    <aside className={styles.adminSidebar}>
      <nav>
        <ul>
        <li><NavLink to="/admin">Tableau de bord</NavLink></li>
        <li><NavLink to="/admin/recettes">Recettes</NavLink></li>
        <li><NavLink to="/admin/categories">Catégories</NavLink></li>
        <li><NavLink to="/admin/utilisateurs">Utilisateurs</NavLink></li>
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