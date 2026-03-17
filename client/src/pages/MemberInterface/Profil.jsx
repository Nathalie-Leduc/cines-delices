import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Profil.module.scss';

const mockUser = {
  nom: 'DOE',
  prenom: 'JOHN',
  email: 'john.doe@email.com',
  motDePasse: '••••••••••••••••••',
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
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
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
        Êtes-vous sûr de vouloir modifier votre compte ?
      </p>
      <div className={styles.modalButtons}>
        <button
          className={styles.cancelBtn}
          onClick={() => setShowEditModal(false)}
        >
          Annuler
        </button>
        <button
          className={styles.confirmBtn}
          onClick={() => {
            setShowEditModal(false);
          }}
        >
          Valider
        </button>
      </div>
    </div>
  </div>
)}
      <h1 className={styles.title}>Mes informations</h1>

      <div className={styles.fields}>
        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Nom</label>
            <button className={styles.editBtn}>✏️</button>
          </div>
          <span className={styles.value}>{mockUser.nom}</span>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Prénom</label>
            <button className={styles.editBtn}>✏️</button>
          </div>
          <span className={styles.value}>{mockUser.prenom}</span>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>E-mail</label>
            <button className={styles.editBtn}>✏️</button>
          </div>
          <span className={styles.value}>{mockUser.email}</span>
        </div>

        <div className={styles.field}>
          <div className={styles.passwordHeader}>
            <label className={styles.label}>Mot de passe</label>
            <button className={styles.editBtn}>✏️</button>
          </div>
          <div className={styles.passwordRow}>
            <span className={styles.value}>
              {showPassword ? 'monmotdepasse' : '••••••••••••••••••'}
            </span>
            <button
              className={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.recettesBlock}>
        <h2 className={styles.recettesTitle}>Recettes</h2>
        <div className={styles.tags}>
          <span className={`${styles.tag} ${styles.entree}`}>Entrée</span>
          <span className={`${styles.tag} ${styles.plat}`}>Plat</span>
          <span className={`${styles.tag} ${styles.dessert}`}>Dessert</span>
          <span className={`${styles.tag} ${styles.boisson}`}>Boisson</span>
        </div>
        <div className={styles.counts}>
          <span className={styles.count}>{mockUser.recettes.entrees}</span>
          <span className={styles.count}>{mockUser.recettes.plats.toString().padStart(2, '0')}</span>
          <span className={styles.count}>{mockUser.recettes.desserts}</span>
          <span className={styles.count}>{mockUser.recettes.boissons.toString().padStart(2, '0')}</span>
        </div>
      </div>

    <button
  className={styles.saveBtn}
  onClick={() => setShowEditModal(true)}
>
  Sauvegarder les modifications
</button>

      <button
        className={styles.deleteBtn}
        onClick={() => setShowModal(true)}
      >
        Supprimer mon compte
      </button>

    </div>
  );
}