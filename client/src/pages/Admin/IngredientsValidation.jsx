import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/AdminModal';
import {
  approveAdminIngredient,
  deleteAdminIngredient,
  getAdminIngredients,
  updateAdminIngredient,
} from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

function getSubmittedByLabel(item) {
  if (item?.submittedByLabel) {
    return item.submittedByLabel;
  }

  const firstName = String(item?.submittedBy?.firstName || '').trim();
  const lastName = String(item?.submittedBy?.lastName || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName || 'Membre inconnu';
}

export default function IngredientsValidation() {
  const [ingredients, setIngredients] = useState([]);
  const [query, setQuery] = useState('');
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const payload = await getAdminIngredients();
        setIngredients(Array.isArray(payload) ? payload : []);
      } catch (loadError) {
        setError(loadError.message || 'Impossible de charger les ingrédients.');
      }
    };

    loadIngredients();
  }, []);

  const filteredIngredients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return ingredients;
    }

    return ingredients.filter((ingredient) => (ingredient.name || '').toLowerCase().includes(normalizedQuery));
  }, [ingredients, query]);

  async function handleApproveIngredient() {
    if (!selectedIngredient) {
      return;
    }

    try {
      await approveAdminIngredient(selectedIngredient.id);
      setIngredients((previous) => previous.filter((ingredient) => ingredient.id !== selectedIngredient.id));
      setShowValidateModal(false);
      setSelectedIngredient(null);
    } catch (approveError) {
      setError(approveError.message || 'Validation impossible.');
    }
  }

  async function handleDeleteIngredient() {
    if (!selectedIngredient) {
      return;
    }

    try {
      await deleteAdminIngredient(selectedIngredient.id);
      setIngredients((previous) => previous.filter((ingredient) => ingredient.id !== selectedIngredient.id));
      setShowDeleteModal(false);
      setSelectedIngredient(null);
    } catch (deleteError) {
      setError(deleteError.message || 'Suppression impossible.');
    }
  }

  async function handleEditIngredient() {
    if (!selectedIngredient || !editedName.trim()) {
      return;
    }

    try {
      const updated = await updateAdminIngredient(selectedIngredient.id, { name: editedName });
      setIngredients((previous) => previous.map((ingredient) => (ingredient.id === updated.id ? updated : ingredient)));
      setShowEditModal(false);
      setSelectedIngredient(null);
    } catch (updateError) {
      setError(updateError.message || 'Modification impossible.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>Validation des ingrédients</h2>
      </div>

      <p style={{ marginBottom: '0.9rem', color: 'rgba(246, 241, 232, 0.86)' }}>
        Vous avez <strong style={{ color: '#c9a45c' }}>{ingredients.length}</strong> ingrédients à valider
      </p>

      <div className={styles.usersSearchRow}>
        <input
          className={styles.usersSearchInput}
          type="text"
          placeholder="Rechercher un ingrédient"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <img src="/icon/Search.svg" alt="" aria-hidden="true" />
      </div>

      {error ? <p>{error}</p> : null}

      <div className={styles.sectionTitle}>
        <h3>Liste des ingrédients ({filteredIngredients.length})</h3>
      </div>

      <div className={styles.list}>
        {filteredIngredients.map((ingredient, index) => (
          <div key={`${ingredient.id}-${index}`} className={styles.categoryRow}>
            <div className={styles.ingredientIdentity}>
              <strong style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.35rem', fontWeight: 700 }}>{ingredient.name}</strong>
              <span className={styles.submittedByRowTag}>Soumis par {getSubmittedByLabel(ingredient)}</span>
            </div>

            <span className={styles.inlineTools}>
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundBlue}`.trim()}
                onClick={() => {
                  setSelectedIngredient(ingredient);
                  setEditedName(ingredient.name);
                  setShowEditModal(true);
                }}
              >
                <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundRed}`.trim()}
                onClick={() => {
                  setSelectedIngredient(ingredient);
                  setShowDeleteModal(true);
                }}
              >
                <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundGreen}`.trim()}
                onClick={() => {
                  setSelectedIngredient(ingredient);
                  setShowValidateModal(true);
                }}
              >
                <img src="/icon/close_menu.svg" alt="" aria-hidden="true" style={{ transform: 'rotate(45deg)' }} />
              </button>
            </span>
          </div>
        ))}

        {!filteredIngredients.length ? (
          <p style={{ color: 'rgba(246, 241, 232, 0.82)', margin: 0 }}>Aucun ingrédient trouvé.</p>
        ) : null}
      </div>

      {showValidateModal && (
        <AdminModal onCancel={() => setShowValidateModal(false)} onConfirm={handleApproveIngredient}>
          Êtes-vous sûr de vouloir valider cet ingrédient ?
        </AdminModal>
      )}

      {showDeleteModal && (
        <AdminModal onCancel={() => setShowDeleteModal(false)} onConfirm={handleDeleteIngredient}>
          Êtes-vous sûr de vouloir supprimer cet ingrédient ?
        </AdminModal>
      )}

      {showEditModal && (
        <AdminModal onCancel={() => setShowEditModal(false)} onConfirm={handleEditIngredient}>
          <input
            className={styles.modalInput}
            value={editedName}
            onChange={(event) => setEditedName(event.target.value)}
            placeholder="Nom de l’ingrédient"
          />
        </AdminModal>
      )}
    </div>
  );
}
