import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MemberProfile.module.scss';

const mockUser = {
  nom: 'DOE',
  prenom: 'JOHN',
  email: 'john.doe@email.com',
  motDePasse: 'monmotdepasse',
  recettes: {
    entrees: 15,
    plats: 7,
    desserts: 25,
    boissons: 2,
  },
  dateInscription: '2026-03-10',
};

export default function Profil() {
  const navigate = useNavigate();
  const accountItems = [
    {
      icon: '/icon/Recipes.svg',
      label: 'Mes recettes',
      sub: '15 recettes',
      path: '/membre/mes-recettes',
    },
    {
      icon: '/icon/User.svg',
      label: 'Mes informations',
      sub: mockUser.email,
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
  const [userData, setUserData] = useState(mockUser);
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState(null);

  function openEditModal(fieldName, label, type = 'text') {
    setEditModalData({
      fieldName,
      label,
      type,
      value: userData[fieldName] || '',
    });
    setShowEditModal(true);
  }

  function handleEditModalChange(value) {
    setEditModalData(prev => ({ ...prev, value }));
  }

  function handleEditModalConfirm() {
    if (!editModalData) {
      return;
    }

    setUserData(prev => ({
      ...prev,
      [editModalData.fieldName]: editModalData.value,
    }));

    setShowEditModal(false);
    setEditModalData(null);
  }

  function handleDelete() {
    localStorage.removeItem('token');
    navigate('/');
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
        >
          Valider
        </button>
      </div>
    </div>
  </div>
)}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mon compte</h1>
      </div>
      <p className={styles.welcomeText}>
        Bonjour <strong>John</strong>, bienvenue chez Cine Delices !
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

          <div className={styles.fields}>
        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Nom</label>
            <button
              type="button"
              className={styles.editBtn}
              aria-label="Modifier le nom"
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
              className={styles.deleteBtn}
              aria-label="Supprimer mon compte"
              onClick={() => setShowModal(true)}
            >
              Supprimer mon compte
            </button>
          </div>

          <button
            className={styles.saveBtn}
            aria-label="Sauvegarder les modifications du profil"
            onClick={() => setShowEditModal(true)}
          >
            Sauvegarder les modifications
          </button>
        </section>
      </div>

    </div>
  );
}