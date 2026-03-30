import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/AdminModal';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import {
  deleteAdminIngredient,
  getValidatedAdminIngredients,
  updateAdminIngredient,
} from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

export default function AdminIngredients() {
  const [ingredients, setIngredients] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const payload = await getValidatedAdminIngredients();
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
    if (!normalizedQuery) return ingredients;
    return ingredients.filter((ingredient) =>
      (ingredient.name || '').toLowerCase().includes(normalizedQuery),
    );
  }, [ingredients, query]);

  async function handleDeleteIngredient() {
    if (!selectedIngredient) return;

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
    if (!selectedIngredient || !editedName.trim()) return;

    try {
      const updated = await updateAdminIngredient(selectedIngredient.id, { name: editedName });
      setIngredients((previous) =>
        previous.map((ingredient) => (ingredient.id === updated.id ? updated : ingredient)),
      );
      setShowEditModal(false);
      setSelectedIngredient(null);
    } catch (updateError) {
      setError(updateError.message || 'Modification impossible.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>Gérer les ingrédients</h2>
      </div>

      <p style={{ marginBottom: '0.9rem', color: 'rgba(246, 241, 232, 0.86)' }}>
        <strong style={{ color: '#c9a45c' }}>{ingredients.length}</strong> ingrédient
        {ingredients.length > 1 ? 's' : ''} validé{ingredients.length > 1 ? 's' : ''}
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
              <strong style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.35rem', fontWeight: 700 }}>
                {ingredient.name}
              </strong>
              {ingredient.recipesCount > 0 && (
                <span className={styles.submittedByRowTag}>
                  Utilisé dans {ingredient.recipesCount} recette{ingredient.recipesCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <span className={styles.inlineTools}>
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundBlue}`.trim()}
                title="Modifier"
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
                title="Supprimer"
                onClick={() => {
                  setSelectedIngredient(ingredient);
                  setShowDeleteModal(true);
                }}
              >
                <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
              </button>
            </span>
          </div>
        ))}

        {!isLoading && !filteredIngredients.length ? (
          <StatusBlock
            variant="empty"
            title={query.trim() ? 'Aucun ingrédient trouvé' : 'Aucun ingrédient validé'}
            message={
              query.trim()
                ? 'Essaie une autre recherche pour retrouver un ingrédient validé.'
                : 'Les ingrédients approuvés apparaîtront ici.'
            }
            className={styles.pageState}
          />
        ) : null}
      </div>

      {showDeleteModal && (
        <AdminModal
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedIngredient(null);
          }}
          onConfirm={handleDeleteIngredient}
        >
          Êtes-vous sûr de vouloir supprimer l'ingrédient{' '}
          <strong>{selectedIngredient?.name}</strong> ?
          {selectedIngredient?.recipesCount > 0 && (
            <p style={{ marginTop: '0.5rem', color: '#f4a555', fontSize: '0.9rem' }}>
              Attention : cet ingrédient est utilisé dans {selectedIngredient.recipesCount} recette
              {selectedIngredient.recipesCount > 1 ? 's' : ''}.
            </p>
          )}
        </AdminModal>
      )}

      {showEditModal && (
        <AdminModal
          onCancel={() => {
            setShowEditModal(false);
            setSelectedIngredient(null);
          }}
          onConfirm={handleEditIngredient}
        >
          <input
            className={styles.modalInput}
            value={editedName}
            onChange={(event) => setEditedName(event.target.value)}
            placeholder="Nom de l'ingrédient"
          />
        </AdminModal>
      )}
    </div>
  );
}
