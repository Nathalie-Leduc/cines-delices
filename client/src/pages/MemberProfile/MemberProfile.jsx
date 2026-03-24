import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MemberProfile.module.scss';

const PROFILE_API = import.meta.env.VITE_PROFILE_API || 'http://localhost:3000/api/auth/me';
const USER_RECIPES_API = import.meta.env.VITE_RECIPES_API || 'http://localhost:3000/api/users/me/recipes';

const initialUser = {
  nom: '',
  prenom: '',
  email: '',
  motDePasse: '********',
  recettes: {
    entrees: 0,
    plats: 0,
    desserts: 0,
    boissons: 0,
  },
  dateInscription: '',
};

export default function Profil() {
  const navigate = useNavigate();

  // Liens du panneau de navigation latéral (sidebar)
  // Données du profil affichées dans les champs
  const [userData, setUserData] = useState(initialUser);
  // Contrôle la visibilité du mot de passe
  const [showPassword, setShowPassword] = useState(false);
  // Contrôle l'affichage de la modale de suppression de compte
  const [showModal, setShowModal] = useState(false);
  // Contrôle l'affichage de la modale de modification d'un champ
  const [showEditModal, setShowEditModal] = useState(false);
  // Contient le champ en cours de modification (nom, type, valeur)
  const [editModalData, setEditModalData] = useState(null);
  const [profileFeedback, setProfileFeedback] = useState({ type: '', message: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  function syncDisplayName(name) {
    const trimmed = String(name || '').trim();

    if (!trimmed) {
      return;
    }

    const normalizedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    localStorage.setItem('displayName', normalizedName);
    window.dispatchEvent(new Event('user-display-name-updated'));
  }

  async function fetchProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const response = await fetch(PROFILE_API, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du profil');
    }

    const payload = await response.json();
    const user = payload?.data ?? payload;
    const rawName = (typeof user?.prenom === 'string' && user.prenom.trim())
      ? user.prenom
      : (typeof user?.pseudo === 'string' && user.pseudo.trim())
        ? user.pseudo
        : '';

    const normalizedName = rawName
      ? rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()
      : '';

    setUserData((prev) => ({
      ...prev,
      nom: user?.nom || '',
      prenom: normalizedName,
      email: user?.email || prev.email,
      dateInscription: user?.createdAt || prev.dateInscription,
    }));

    if (normalizedName) {
      syncDisplayName(normalizedName);
    }
  }

  async function fetchRecipes() {
    // Récupère le JWT stocké après connexion
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const response = await fetch(USER_RECIPES_API, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recipes');
    }

    const payload = await response.json();
    const recipes = Array.isArray(payload?.data) ? payload.data : [];

    const counts = {
      entrees: 0,
      plats: 0,
      desserts: 0,
      boissons: 0,
    };

    recipes.forEach((recipe) => {
      if (recipe.category && recipe.category.nom) {
        const nomLower = recipe.category.nom.toLowerCase();
        if (nomLower === 'entrée') counts.entrees++;
        else if (nomLower === 'plat') counts.plats++;
        else if (nomLower === 'dessert') counts.desserts++;
        else if (nomLower === 'boisson') counts.boissons++;
      }
    });

    setUserData((prev) => ({
      ...prev,
      recettes: counts,
    }));
  }

  // Au montage du composant : récupère les recettes de l'utilisateur connecté
  // et met à jour les compteurs par catégorie
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        await fetchProfile();
        await fetchRecipes();
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfileData();
  }, []);

  const totalRecipes = Object.values(userData.recettes).reduce(
    (sum, value) => sum + Number(value || 0),
    0,
  );

  const accountItems = [
    {
      icon: '/icon/Recipes.svg',
      label: 'Mes recettes',
      sub: `${totalRecipes} recette${totalRecipes > 1 ? 's' : ''}`,
      path: '/membre/mes-recettes',
    },
    {
      icon: '/icon/Message_fill.svg',
      label: 'Notifications',
      sub: 'Voir mes alertes',
      path: '/membre',
    },
    {
      icon: '/icon/User.svg',
      label: 'Mes informations',
      sub: userData.email,
      path: '/membre/profil',
      active: true,
    },
    {
      icon: '/icon/Contact.svg',
      label: 'Contact',
      sub: 'help@support.cine-delices.com',
      path: '/contact',
    },
  ];

  // Ouvre la modale de modification en pré-remplissant les infos du champ cliqué
  function openEditModal(fieldName, label, type = 'text') {
    setProfileFeedback({ type: '', message: '' });
    setEditModalData({
      fieldName,
      label,
      type,
      value: userData[fieldName] || '',
    });
    setShowEditModal(true);
  }

  // Met à jour la valeur saisie dans l'input de la modale de modification
  function handleEditModalChange(value) {
    setEditModalData(prev => ({ ...prev, value }));
  }

  // Applique la modification dans userData et ferme la modale
  async function handleEditModalConfirm() {
    if (!editModalData) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setProfileFeedback({ type: 'error', message: 'Vous devez être connecté pour modifier votre profil.' });
      return;
    }

    const trimmedValue = String(editModalData.value || '').trim();

    if (!trimmedValue) {
      setProfileFeedback({ type: 'error', message: 'La valeur ne peut pas être vide.' });
      return;
    }

    let body = null;

    if (editModalData.fieldName === 'prenom') {
      body = { pseudo: trimmedValue };
    } else if (editModalData.fieldName === 'email') {
      body = { email: trimmedValue };
    } else {
      setProfileFeedback({
        type: 'error',
        message: 'Seuls le prénom affiché et l\'e-mail sont modifiables pour le moment.',
      });
      return;
    }

    setIsSavingProfile(true);

    try {
      const response = await fetch(PROFILE_API, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json();

      if (!response.ok) {
        const errorMessage = payload?.message
          || payload?.error
          || 'Impossible de mettre à jour le profil.';
        setProfileFeedback({ type: 'error', message: errorMessage });
        return;
      }

      const updatedUser = payload?.data ?? payload;
      const nextPseudo = String(updatedUser?.pseudo || userData.prenom || '').trim();
      const nextDisplayName = nextPseudo
        ? nextPseudo.charAt(0).toUpperCase() + nextPseudo.slice(1).toLowerCase()
        : '';

      setUserData((prev) => ({
        ...prev,
        prenom: nextDisplayName || prev.prenom,
        email: updatedUser?.email || prev.email,
      }));

      if (nextDisplayName) {
        syncDisplayName(nextDisplayName);
      }

      setProfileFeedback({
        type: 'success',
        message: payload?.message || 'Profil mis à jour.',
      });
      setShowEditModal(false);
      setEditModalData(null);
    } catch {
      setProfileFeedback({
        type: 'error',
        message: 'Impossible de joindre le serveur pour mettre à jour le profil.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Supprime le token JWT et redirige vers l'accueil (déconnexion / suppression)
  function handleDelete() {
    localStorage.removeItem('token');
    navigate('/');
  }

  // Valide les données du profil local et synchronise le nom affiché globalement.
  function handleValidateProfile() {
    syncDisplayName(userData.prenom);
    setProfileFeedback({
      type: 'success',
      message: 'Les informations affichées sont synchronisées avec votre profil.',
    });
  }

 return (
    <div className={styles.profil}>

      {/* ===== MODALE Suppression ===== */}
      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.modalText}>
              Êtes-vous sûr de vouloir supprimer votre compte ?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                aria-label="Annuler la suppression du compte"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
                aria-label="Confirmer la suppression du compte"
                onClick={handleDelete}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

{/* ===== MODALE MODIFICATION ===== */}
{showEditModal && (
  <div className={styles.overlay}>
    <div className={styles.modal}>
      <p className={styles.modalText}>
        Modifier {editModalData?.label?.toLowerCase()}
      </p>

      <div className={styles.modalField}>
        <label className={styles.label}>
          {editModalData?.label}
        </label>
        <input
          className={styles.modalInput}
          type={editModalData?.type || 'text'}
          value={editModalData?.value || ''}
          onChange={e => handleEditModalChange(e.target.value)}
          autoFocus
        />
      </div>

      <div className={styles.modalButtons}>
        <button
          className={styles.cancelBtn}
          aria-label="Annuler la modification du profil"
          onClick={() => {
            setShowEditModal(false);
            setEditModalData(null);
          }}
        >
          Annuler
        </button>
        <button
          className={styles.confirmBtn}
          aria-label="Confirmer la modification du profil"
          onClick={handleEditModalConfirm}
          disabled={isSavingProfile}
        >
          {isSavingProfile ? 'Enregistrement...' : 'Valider'}
        </button>
      </div>
    </div>
  </div>
)}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mon compte</h1>
      </div>
      <p className={styles.welcomeText}>
        Bonjour <strong>{userData.prenom}</strong>, bienvenue chez Cine Delices !
      </p>

      <div className={styles.desktopLayout}>
        <aside className={styles.accountPanel}>
          <div className={styles.accountLinks}>
            {accountItems.map(item => (
              <button
                key={item.path}
                type="button"
                className={`${styles.accountItem} ${item.active ? styles.accountItemActive : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className={styles.accountIcon}>
                  <img src={item.icon} alt="" aria-hidden="true" />
                </span>
                <span className={styles.accountContent}>
                  <strong>{item.label}</strong>
                  <small>{item.sub}</small>
                </span>
                <span className={styles.accountArrow}>›</span>
              </button>
            ))}
          </div>

          <button type="button" className={styles.logoutBtn} onClick={handleDelete}>
            <span className={styles.logoutIcon}>
              <img src="/icon/Logout.svg" alt="" aria-hidden="true" />
            </span>
            <span>Se déconnecter</span>
            <span>›</span>
          </button>
        </aside>

        <section className={styles.profilePanel}>
          <h1 className={styles.title}>Mes informations</h1>

          {profileFeedback.message && (
            <p className={profileFeedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess}>
              {profileFeedback.message}
            </p>
          )}

          <div className={styles.fields}>
        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Nom</label>
            <button
              type="button"
              className={styles.editBtn}
              aria-label="Modification du nom indisponible"
              onClick={() => openEditModal('nom', 'Nom')}
            >
              <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
            </button>
          </div>
          <input
            className={styles.input}
            name="nom"
            value={userData.nom}
            readOnly
            aria-label="Nom"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Prénom</label>
            <button
              type="button"
              className={styles.editBtn}
              aria-label="Modifier le prenom"
              onClick={() => openEditModal('prenom', 'Prénom')}
            >
              <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
            </button>
          </div>
          <input
            className={styles.input}
            name="prenom"
            value={userData.prenom}
            readOnly
            aria-label="Prenom"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>E-mail</label>
            <button
              type="button"
              className={styles.editBtn}
              aria-label="Modifier l'email"
              onClick={() => openEditModal('email', 'E-mail', 'email')}
            >
              <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
            </button>
          </div>
          <input
            className={styles.input}
            name="email"
            value={userData.email}
            readOnly
            aria-label="Email"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.passwordHeader}>
            <label className={styles.label}>Mot de passe</label>
            <button
              type="button"
              className={styles.editBtn}
              aria-label="Modification du mot de passe indisponible"
              onClick={() => openEditModal('motDePasse', 'Mot de passe', 'password')}
            >
              <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
            </button>
          </div>
          <div className={styles.passwordRow}>
            <input
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              name="motDePasse"
              value={userData.motDePasse}
              readOnly
              aria-label="Mot de passe"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              onClick={() => setShowPassword(!showPassword)}
            >
              <img
                src="/icon/Eye.svg"
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

          <div className={styles.bottomRow}>
            <div className={styles.recettesBlock}>
              <h2 className={styles.recettesTitle}>Recettes</h2>
              <div className={styles.tags}>
                <span className={`${styles.tag} ${styles.entree}`}>Entrée</span>
                <span className={`${styles.tag} ${styles.plat}`}>Plat</span>
                <span className={`${styles.tag} ${styles.dessert}`}>Dessert</span>
                <span className={`${styles.tag} ${styles.boisson}`}>Boisson</span>
              </div>
              <div className={styles.counts}>
                <span className={styles.count}>{userData.recettes.entrees}</span>
                <span className={styles.count}>{userData.recettes.plats.toString().padStart(2, '0')}</span>
                <span className={styles.count}>{userData.recettes.desserts}</span>
                <span className={styles.count}>{userData.recettes.boissons.toString().padStart(2, '0')}</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.saveBtn}
              aria-label="Valider les modifications du profil"
              onClick={handleValidateProfile}
            >
              Valider les modifications
            </button>

            <button
              className={styles.deleteBtn}
              aria-label="Supprimer mon compte"
              onClick={() => setShowModal(true)}
            >
              Supprimer mon compte
            </button>
          </div>
        </section>
      </div>

    </div>
  );
}