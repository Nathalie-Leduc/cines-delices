import { useNavigate } from 'react-router-dom';
import styles from './MembreInterface.module.scss';

export default function Membre() {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: '/icon/Recipes.svg',
      label: 'Mes recettes',
      sub: '15 recettes',
      path: '/membre/mes-recettes',
    },
    {
      icon: '/icon/User.svg',
      label: 'Mes informations',
      sub: 'johndoe@email.com',
      path: '/membre/profil',
    },
    {
      icon: '/icon/Contact.svg',
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
        Bienvenue chez Ciné Délices !
      </p>

      <nav className={styles.menu}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={styles.menuItem}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.icon}>
              <img src={item.icon} alt="" aria-hidden="true" />
            </span>
            <div className={styles.menuText}>
              <span className={styles.menuLabel}>{item.label}</span>
              <span className={styles.menuSub}>{item.sub}</span>
            </div>
            <span className={styles.arrow}>›</span>
          </button>
        ))}

        <button className={styles.logout} onClick={handleLogout}>
          <span className={styles.icon}>
            <img src="/icon/Logout.svg" alt="" aria-hidden="true" />
          </span>
          <span className={styles.menuLabel}>Se déconnecter</span>
          <span className={styles.arrow}>›</span>
        </button>
      </nav>
    </div>
  );
}