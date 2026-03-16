import { useNavigate } from 'react-router-dom';
import styles from './Membre.module.scss';

export default function Membre() {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: '📋',
      label: 'Mes recettes',
      sub: '15 recettes',
      path: '/membre/mes-recettes',
    },
    {
      icon: '👤',
      label: 'Mes informations',
      sub: 'johndoe@email.com',
      path: '/membre/profil',
    },
    {
      icon: '✉️',
      label: 'Contact',
      sub: 'help@support.cine-delices.com',
      path: '/contact',
    },
  ];

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  return (
    <div className={styles.membre}>
      <h1 className={styles.title}>Mon compte</h1>
      <p className={styles.welcome}>
        Bonjour <strong>John</strong>,<br />
        bienvenue chez Ciné Délices !
      </p>

      <nav className={styles.menu}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={styles.menuItem}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <div className={styles.menuText}>
              <span className={styles.menuLabel}>{item.label}</span>
              <span className={styles.menuSub}>{item.sub}</span>
            </div>
            <span className={styles.arrow}>›</span>
          </button>
        ))}

        <button className={styles.logout} onClick={handleLogout}>
          <span className={styles.icon}>⏻</span>
          <span className={styles.menuLabel}>Se déconnecter</span>
          <span className={styles.arrow}>›</span>
        </button>
      </nav>
    </div>
  );
}