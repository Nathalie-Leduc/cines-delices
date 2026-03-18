import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MembreInterface.module.scss';

// Décode le payload d'un JWT stocké dans le localStorage sans bibliothèque externe
function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function Membre() {
  const navigate = useNavigate();

  // Nombre de recettes de l'utilisateur, mis à jour après l'appel API
  const [recipeCount, setRecipeCount] = useState(0);

  // E-mail de l'utilisateur connecté, extrait du JWT
  const [userEmail, setUserEmail] = useState('');

  // Prénom/pseudo affiché dans le message de bienvenue
  const [userName, setUserName] = useState(localStorage.getItem('displayName') || '');

  // Au montage : lit l'e-mail depuis le JWT et récupère le nombre de recettes via l'API
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Extrait l'e-mail directement depuis le payload du token
    const payload = parseJwtPayload(token);
    if (payload?.email) {
      setUserEmail(payload.email);
    }

    if (!userName) {
      const savedDisplayName = localStorage.getItem('displayName');
      if (savedDisplayName) {
        setUserName(savedDisplayName);
      }
    }

    // Appel API pour récupérer le profil : prénom et nom
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération du profil');

        const user = await response.json();
        const rawName = (typeof user?.prenom === 'string' && user.prenom.trim())
          ? user.prenom
          : (typeof user?.pseudo === 'string' && user.pseudo.trim())
            ? user.pseudo
            : '';

        if (rawName) {
          const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
          setUserName(normalizedName);
          localStorage.setItem('displayName', normalizedName);
          window.dispatchEvent(new Event('user-display-name-updated'));
        }
      } catch (error) {
        console.error('Erreur fetchProfile:', error);
      }
    };

    // Appel API pour récupérer les recettes et en compter le total
    const fetchRecipes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/users/me/recipes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des recettes');

        const recipes = await response.json();
        setRecipeCount(recipes.length);
      } catch (error) {
        console.error('Erreur fetchRecipes:', error);
      }
    };

    fetchProfile();
    fetchRecipes();
  }, []);

  // Éléments du menu de navigation du compte membre
  const menuItems = [
    {
      icon: '/icon/Recipes.svg',
      label: 'Mes recettes',
      // Affiche le nombre réel de recettes récupéré depuis l'API
      sub: `${recipeCount} recette${recipeCount > 1 ? 's' : ''}`,
      path: '/membre/mes-recettes',
    },
    {
      icon: '/icon/User.svg',
      label: 'Mes informations',
      // Affiche l'e-mail extrait du JWT (ou vide si non connecté)
      sub: userEmail,
      path: '/membre/profil',
    },
    {
      icon: '/icon/Contact.svg',
      label: 'Contact',
      sub: 'help@support.cine-delices.com',
      path: '/contact',
    },
  ];

  // Supprime le token JWT et redirige vers l'accueil
  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  return (
    <div className={styles.membre}>
      <h1 className={styles.title}>Mon compte</h1>
      <p className={styles.welcome}>
        Bonjour <strong>{userName}</strong>,<br />
        Bienvenue chez Ciné Délices !
      </p>

      <nav className={styles.menu}>
        {/* Génère dynamiquement chaque entrée du menu */}
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

        {/* Bouton de déconnexion séparé du menu principal */}
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