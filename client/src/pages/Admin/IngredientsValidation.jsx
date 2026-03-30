import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/AdminModal';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
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
  const [isLoading, setIsLoading] = useState(true);
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
      } finally {
        setIsLoading(false);
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

  function canDeleteIngredient(ingredient) {
    return (ingredient?.recipesCount || 0) === 0;
  }

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

      <p className={styles.summaryText}>
        Vous avez <strong className={styles.summaryStrong}>{ingredients.length}</strong> ingrédients à valider
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

      <Alert
        type="error"
        message={error}
        onClose={() => setError('')}
        className={styles.pageState}
      />

      {isLoading ? (
        <StatusBlock
          variant="loading"
          title="Chargement des ingrédients"
          className={styles.pageState}
        />
      ) : null}

      <div className={styles.sectionTitle}>
        <h3>Liste des ingrédients ({filteredIngredients.length})</h3>
      </div>

      <div className={styles.list}>
        {filteredIngredients.map((ingredient, index) => (
          <div key={`${ingredient.id}-${index}`} className={styles.categoryRow}>
            <div className={styles.ingredientIdentity}>
              <strong className={styles.ingredientName}>{ingredient.name}</strong>
              <span className={styles.submittedByRowTag}>Soumis par {getSubmittedByLabel(ingredient)}</span>
            </div>

            <span className={styles.inlineTools}>
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundBlue}`.trim()}
                aria-label={`Modifier l'ingrédient ${ingredient.name}`}
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
                disabled={!canDeleteIngredient(ingredient)}
                title={
                  canDeleteIngredient(ingredient)
                    ? 'Supprimer'
                    : "Suppression impossible tant que l'ingrédient est utilisé dans une recette"
                }
                onClick={() => {
                  if (!canDeleteIngredient(ingredient)) {
                    return;
                  }
                  setSelectedIngredient(ingredient);
                  setShowDeleteModal(true);
                }}
              >
                <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundGreen}`.trim()}
                aria-label={`Valider l'ingrédient ${ingredient.name}`}
                onClick={() => {
                  setSelectedIngredient(ingredient);
                  setShowValidateModal(true);
                }}
              >
                <img src="/icon/check_ring_round.svg" alt="" aria-hidden="true" />
              </button>
            </span>
          </div>
        ))}

        {!isLoading && !filteredIngredients.length ? (
          <StatusBlock
            variant="empty"
            title={query.trim() ? 'Aucun ingrédient trouvé' : 'Aucun ingrédient à valider'}
            message={query.trim()
              ? 'Essaie une autre recherche pour retrouver un ingrédient en attente.'
              : 'Les ingrédients proposés par les membres apparaîtront ici pour validation.'}
            className={styles.pageState}
          />
        ) : null}
      </div>

      {showValidateModal && (
        <AdminModal
          title="Valider l’ingrédient"
          confirmLabel="Valider"
          confirmVariant="success"
          onCancel={() => setShowValidateModal(false)}
          onConfirm={handleApproveIngredient}
        >
          Êtes-vous sûr de vouloir valider cet ingrédient ?
        </AdminModal>
      )}

      {showDeleteModal && (
        <AdminModal
          title="Supprimer l’ingrédient"
          confirmLabel="Supprimer"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteIngredient}
        >
          Êtes-vous sûr de vouloir supprimer cet ingrédient ?
        </AdminModal>
      )}

      {showEditModal && (
        <AdminModal
          title="Modifier l’ingrédient"
          confirmLabel="Enregistrer"
          confirmVariant="success"
          onCancel={() => setShowEditModal(false)}
          onConfirm={handleEditIngredient}
        >
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
