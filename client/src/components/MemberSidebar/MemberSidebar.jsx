import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getMe } from '../../services/api.js';
import { getMyRecipes } from '../../services/recipesService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './MemberSidebar.module.scss';

function normalizeDisplayName(name) {
  const trimmed = String(name || '').trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function normalizeRecipe(rawRecipe) {
  const categoryLabel = String(rawRecipe?.categorie || rawRecipe?.category?.nom || rawRecipe?.category || '')
    .trim()
    .toLowerCase();

  return {
    ...rawRecipe,
    categorie: categoryLabel,
  };
}

export default function MemberSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userEmail, setUserEmail] = useState('');
  const [memberRecipesCount, setMemberRecipesCount] = useState(0);
  const [pendingRecipesCount, setPendingRecipesCount] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadSidebarData = async () => {
      try {
        const [profilePayload, recipesPayload] = await Promise.all([
          getMe().catch(() => null),
          getMyRecipes().catch(() => []),
        ]);

        if (!isActive) {
          return;
        }

        const profile = profilePayload?.data ?? profilePayload ?? null;
        const recipesData = Array.isArray(recipesPayload)
          ? recipesPayload
          : Array.isArray(recipesPayload?.data)
            ? recipesPayload.data
            : [];
        const normalizedRecipes = recipesData.map(normalizeRecipe);
        const pendingCount = normalizedRecipes.filter(
          (recipe) => String(recipe?.status || '').toUpperCase() === 'PENDING',
        ).length;

        setUserEmail(typeof profile?.email === 'string' ? profile.email : '');
        setPendingRecipesCount(pendingCount);
        setMemberRecipesCount(normalizedRecipes.length - pendingCount);
      } catch {
        if (!isActive) {
          return;
        }

        setUserEmail('');
        setPendingRecipesCount(0);
        setMemberRecipesCount(0);
      }
    };

    loadSidebarData();

    const handleRecipesUpdated = () => {
      loadSidebarData();
    };

    window.addEventListener('member-recipes-updated', handleRecipesUpdated);

    return () => {
      isActive = false;
      window.removeEventListener('member-recipes-updated', handleRecipesUpdated);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const accountItems = useMemo(() => [
    {
      icon: '/icon/Recipes.svg',
      label: 'Mes recettes',
      sub: `${memberRecipesCount} recette${memberRecipesCount > 1 ? 's' : ''}`,
      to: '/membre/mes-recettes',
      end: true,
      subTone: 'recipe',
    },
    {
      icon: '/icon/check_ring_round.svg',
      label: 'Recettes en cours de validation',
      sub: `${pendingRecipesCount} recette${pendingRecipesCount > 1 ? 's' : ''}`,
      to: '/membre/mes-recettes/recettes-en-validation',
      end: true,
    },
    {
      icon: '/icon/Message_fill.svg',
      label: 'Notifications',
      sub: 'Voir mes alertes',
      to: '/membre/notifications',
      end: true,
    },
    {
      icon: '/icon/User.svg',
      label: 'Mes informations',
      sub: userEmail,
      to: '/membre/profil',
      end: true,
    },
    {
      icon: '/icon/Contact.svg',
      label: 'Contact',
      sub: 'help@support.cine-delices.com',
      to: '/contact',
      end: true,
    },
  ], [memberRecipesCount, pendingRecipesCount, userEmail]);

  return (
    <aside className={styles.accountPanel}>
      <div className={styles.accountLinks}>
        {accountItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `${styles.accountItem} ${isActive ? styles.accountItemActive : ''}`.trim()}
          >
            <span className={styles.accountIcon}>
              <img src={item.icon} alt="" aria-hidden="true" />
            </span>
            <span className={styles.accountContent}>
              <strong>{item.label}</strong>
              <small className={item.subTone === 'recipe' ? styles.accountSubTag : undefined}>
                {item.sub}
              </small>
            </span>
            <span className={styles.accountArrow} aria-hidden="true">
              <img src="/icon/arrow.svg" alt="" />
            </span>
          </NavLink>
        ))}
      </div>

      <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
        <span className={styles.logoutIcon}>
          <img src="/icon/Logout.svg" alt="" aria-hidden="true" />
        </span>
        <span>Se déconnecter</span>
        <span className={styles.accountArrow} aria-hidden="true">
          <img src="/icon/arrow.svg" alt="" />
        </span>
      </button>
    </aside>
  );
}
