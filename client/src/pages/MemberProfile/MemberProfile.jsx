import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteMe, getMe, updateMe, updateMyPassword } from '../../services/api.js';
import { getMyRecipes as getMyRecipesApi } from '../../services/recipesService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './MemberProfile.module.scss';

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

function normalizeDisplayName(name) {
  const trimmed = String(name || '').trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function syncStoredUserProfile(nextUser) {
  const rawStoredUser = localStorage.getItem('auth_user');

  if (!rawStoredUser) {
    return;
  }

  try {
    const storedUser = JSON.parse(rawStoredUser);
    localStorage.setItem('auth_user', JSON.stringify({ ...storedUser, ...nextUser }));
  } catch {
    localStorage.removeItem('auth_user');
  }
}

export default function Profil() {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
    const normalizedName = normalizeDisplayName(name);

    if (!normalizedName) {
      return;
    }

    localStorage.setItem('displayName', normalizedName);
    window.dispatchEvent(new Event('user-display-name-updated'));
  }

  async function fetchProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const user = await getMe();
    const nextFirstName = normalizeDisplayName(user?.pseudo || user?.prenom || '');

    setUserData((prev) => ({
      ...prev,
      nom: user?.nom || '',
      prenom: nextFirstName,
      email: user?.email || prev.email,
      dateInscription: user?.createdAt || prev.dateInscription,
    }));

    syncStoredUserProfile({
      nom: user?.nom || '',
      pseudo: user?.pseudo || '',
      email: user?.email || '',
    });

    if (nextFirstName) {
      syncDisplayName(nextFirstName);
    }
  }

  async function fetchRecipes() {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const payload = await getMyRecipesApi();
    const recipes = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

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
      subTone: 'recipe',
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

  function openEditModal(fieldName, label, type = 'text') {
    setProfileFeedback({ type: '', message: '' });

    if (fieldName === 'motDePasse') {
      setEditModalData({
        mode: 'password',
        label,
        fields: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        },
      });
      setShowEditModal(true);
      return;
    }

    setEditModalData({
      mode: 'profile',
      fieldName,
      label,
      type,
      value: userData[fieldName] || '',
    });
    setShowEditModal(true);
  }

  function handleEditModalChange(value, key = 'value') {
    setEditModalData((prev) => {
      if (!prev) {
        return prev;
      }

      if (prev.mode === 'password') {
        return {
          ...prev,
          fields: {
            ...prev.fields,
            [key]: value,
          },
        };
      }

      return { ...prev, value };
    });
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditModalData(null);
  }

  async function handleEditModalConfirm() {
    if (!editModalData) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setProfileFeedback({ type: 'error', message: 'Vous devez être connecté pour modifier votre profil.' });
      return;
    }

    setIsSavingProfile(true);

    try {
      if (editModalData.mode === 'password') {
        const currentPassword = String(editModalData.fields.currentPassword || '').trim();
        const newPassword = String(editModalData.fields.newPassword || '').trim();
        const confirmPassword = String(editModalData.fields.confirmPassword || '').trim();

        if (!currentPassword || !newPassword || !confirmPassword) {
          setProfileFeedback({
            type: 'error',
            message: 'Tous les champs du mot de passe sont obligatoires.',
          });
          return;
        }

        const payload = await updateMyPassword({
          currentPassword,
          newPassword,
          confirmPassword,
        });

        setProfileFeedback({
          type: 'success',
          message: payload?.message || 'Mot de passe mis à jour.',
        });
        closeEditModal();
        return;
      }

      const trimmedValue = String(editModalData.value || '').trim();

      if (!trimmedValue) {
        setProfileFeedback({ type: 'error', message: 'La valeur ne peut pas être vide.' });
        return;
      }

      let body = null;

      if (editModalData.fieldName === 'nom') {
        body = { nom: trimmedValue };
      } else if (editModalData.fieldName === 'prenom') {
        body = { pseudo: trimmedValue };
      } else if (editModalData.fieldName === 'email') {
        body = { email: trimmedValue };
      }

      if (!body) {
        setProfileFeedback({
          type: 'error',
          message: 'Champ de profil non pris en charge.',
        });
        return;
      }

      const payload = await updateMe(body);
      const updatedUser = payload?.user ?? payload?.data ?? payload;
      const nextFirstName = normalizeDisplayName(updatedUser?.pseudo || userData.prenom);
      const nextLastName = String(updatedUser?.nom || '').trim();
      const nextEmail = updatedUser?.email || userData.email;

      setUserData((prev) => ({
        ...prev,
        nom: nextLastName,
        prenom: nextFirstName || prev.prenom,
        email: nextEmail,
      }));

      syncStoredUserProfile({
        nom: nextLastName,
        pseudo: updatedUser?.pseudo || '',
        email: nextEmail,
      });

      if (nextFirstName) {
        syncDisplayName(nextFirstName);
      }

      setProfileFeedback({
        type: 'success',
        message: payload?.message || 'Profil mis à jour.',
      });
      closeEditModal();
    } catch (error) {
      setProfileFeedback({
        type: 'error',
        message: error?.message || 'Impossible de joindre le serveur pour mettre à jour le profil.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  async function handleDelete() {
    try {
      await deleteMe();
    } catch (error) {
      setProfileFeedback({
        type: 'error',
        message: error?.message || 'Impossible de supprimer le compte pour le moment.',
      });
      setShowModal(false);
      return;
    }

    setShowModal(false);
    logout();
    navigate('/');
  }

  function handleValidateProfile() {
    syncDisplayName(userData.prenom);
    setProfileFeedback({
      type: 'success',
      message: 'Les informations affichées sont synchronisées avec votre profil.',
    });
  }

  const isPasswordModal = editModalData?.mode === 'password';

  return (
    <div className={styles.profil}>
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

      {showEditModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.modalText}>
              Modifier {editModalData?.label?.toLowerCase()}
            </p>

            {isPasswordModal ? (
              <>
                <div className={styles.modalField}>
                  <label className={styles.label} htmlFor="currentPassword">
                    Mot de passe actuel
                  </label>
                  <input
                    id="currentPassword"
                    className={styles.modalInput}
                    type="password"
                    value={editModalData?.fields?.currentPassword || ''}
                    onChange={(event) => handleEditModalChange(event.target.value, 'currentPassword')}
                    autoFocus
                  />
                </div>

                <div className={styles.modalField}>
                  <label className={styles.label} htmlFor="newPassword">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="newPassword"
                    className={styles.modalInput}
                    type="password"
                    value={editModalData?.fields?.newPassword || ''}
                    onChange={(event) => handleEditModalChange(event.target.value, 'newPassword')}
                  />
                </div>

                <div className={styles.modalField}>
                  <label className={styles.label} htmlFor="confirmPassword">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    className={styles.modalInput}
                    type="password"
                    value={editModalData?.fields?.confirmPassword || ''}
                    onChange={(event) => handleEditModalChange(event.target.value, 'confirmPassword')}
                  />
                </div>

                <p className={styles.modalHint}>
                  8 caractères minimum, avec 1 majuscule, 1 chiffre et 1 caractère spécial.
                </p>
              </>
            ) : (
              <div className={styles.modalField}>
                <label className={styles.label} htmlFor="profileField">
                  {editModalData?.label}
                </label>
                <input
                  id="profileField"
                  className={styles.modalInput}
                  type={editModalData?.type || 'text'}
                  value={editModalData?.value || ''}
                  onChange={(event) => handleEditModalChange(event.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                aria-label="Annuler la modification du profil"
                onClick={closeEditModal}
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
                  <small className={item.subTone === 'recipe' ? styles.accountSubTag : undefined}>{item.sub}</small>
                </span>
                <span className={styles.accountArrow}>›</span>
              </button>
            ))}
          </div>

          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
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
              aria-label="Modifier le prénom"
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
              aria-label="Modifier le mot de passe"
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
