import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  getAdminCategories,
  getAdminIngredients,
  getAdminRecipes,
  getAdminUsers,
  getPendingRecipes,
} from '../../services/adminService.js';
import styles from './AdminSidebar.module.scss';

export default function AdminSidebar({ className = '', onNavigate, mobile = false }) {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    recipes: 0,
    users: 0,
    categories: 0,
    pendingRecipes: 0,
    pendingIngredients: 0,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadCounts() {
      try {
        const [recipes, users, categories, pendingRecipes, pendingIngredients] = await Promise.all([
          getAdminRecipes(),
          getAdminUsers(),
          getAdminCategories(),
          getPendingRecipes(),
          getAdminIngredients(),
        ]);

        if (!isMounted) {
          return;
        }

        setCounts({
          recipes: Array.isArray(recipes) ? recipes.length : 0,
          users: Array.isArray(users) ? users.length : 0,
          categories: Array.isArray(categories) ? categories.length : 0,
          pendingRecipes: Array.isArray(pendingRecipes) ? pendingRecipes.length : 0,
          pendingIngredients: Array.isArray(pendingIngredients) ? pendingIngredients.length : 0,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setCounts({
          recipes: 0,
          users: 0,
          categories: 0,
          pendingRecipes: 0,
          pendingIngredients: 0,
        });
      }
    }

    loadCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  const items = [
    {
      to: '/admin/recettes',
      icon: '/icon/Recipes.svg',
      title: 'Gérer les recettes',
      sub: `${counts.recipes} recette${counts.recipes > 1 ? 's' : ''}`,
    },
    {
      to: '/admin/utilisateurs',
      icon: '/icon/User.svg',
      title: 'Gérer les utilisateurs',
      sub: `${counts.users} utilisateur${counts.users > 1 ? 's' : ''}`,
    },
    {
      to: '/admin/categories',
      icon: '/icon/Recipes.svg',
      title: 'Gérer les catégories',
      sub: `${counts.categories} catégorie${counts.categories > 1 ? 's' : ''}`,
    },
    {
      to: '/admin/validation-recettes',
      icon: '/icon/check_ring_round.svg',
      title: 'Validation des recettes',
      sub: `${counts.pendingRecipes} à valider`,
    },
    {
      to: '/admin/validation-ingredients',
      icon: '/icon/check_ring_round.svg',
      title: 'Validation des ingrédients',
      sub: `${counts.pendingIngredients} à valider`,
    },
  ];

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('displayName');
    onNavigate?.();
    navigate('/');
  }

  return (
    <aside className={`${styles.adminSidebar} ${mobile ? styles.adminSidebarMobile : ''} ${className}`.trim()}>
      <nav className={styles.nav}>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`.trim()}
              >
                <span className={styles.icon}>
                  <img src={item.icon} alt="" aria-hidden="true" />
                </span>
                <span className={styles.text}>
                  <strong>{item.title}</strong>
                  <small>{item.sub}</small>
                </span>
                <span className={styles.arrow} aria-hidden="true">›</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
        <span className={styles.logoutIcon}>
          <img src="/icon/Logout.svg" alt="" aria-hidden="true" />
        </span>
        Se déconnecter
        <span className={styles.arrow} aria-hidden="true">›</span>
      </button>
    </aside>
  );
}