import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../../components/Alert/Alert.jsx';
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
    recettesEnValidation: 0,
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

  // Données du profil affichées dans les champs
  const [userData, setUserData] = useState(initialUser);
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
      recettesEnValidation: 0,
    };

    recipes.forEach((recipe) => {
      const status = String(recipe?.status || '').toUpperCase();

      if (status === 'PENDING') {
        counts.recettesEnValidation += 1;
      }

      if (status !== 'PENDING' && recipe.category && recipe.category.nom) {
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

  const isPasswordModal = editModalData?.mode === 'password';

  return (
    <>
      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Supprimer le compte</h2>
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
            <h2 className={styles.modalTitle}>
              Modifier {editModalData?.label?.toLowerCase()}
            </h2>

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
        <section className={styles.profilePanel}>
          <h2 className={styles.title}>Mes informations</h2>

          <Alert
            type={profileFeedback.type || 'info'}
            message={profileFeedback.message}
            onClose={() => setProfileFeedback({ type: '', message: '' })}
            className={styles.feedbackAlert}
          />

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
              <img src="/icon/Edit_duotone_line.svg" alt="" aria-hidden="true" />
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
              <img src="/icon/Edit_duotone_line.svg" alt="" aria-hidden="true" />
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
              <img src="/icon/Edit_duotone_line.svg" alt="" aria-hidden="true" />
              </button>
          </div>
          <input
            className={styles.input}
            type="password"
            name="motDePasse"
            value={userData.motDePasse}
            readOnly
            aria-label="Mot de passe"
          />
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
                <span className={styles.count}>{userData.recettes.plats}</span>
                <span className={styles.count}>{userData.recettes.desserts}</span>
                <span className={styles.count}>{userData.recettes.boissons}</span>
              </div>
            </div>

            <button
              className={styles.deleteBtn}
              aria-label="Supprimer mon compte"
              onClick={() => setShowModal(true)}
            >
              Supprimer mon compte
            </button>
          </div>
        </section>
    </>
  );
}
