import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminModal from '../../components/AdminModal';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import { LIMIT_OPTIONS } from '../../components/RecipeCatalogView/recipeCatalog.shared.js';
import {
  deleteAdminIngredient,
  getValidatedAdminIngredients,
  updateAdminIngredient,
} from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

export default function AdminIngredients() {
  const [ingredients, setIngredients] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [currentLimit, setCurrentLimit] = useState(LIMIT_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
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
    const normalizedQuery = searchInput.trim().toLowerCase();
    if (!normalizedQuery) return ingredients;
    return ingredients.filter((ingredient) =>
      (ingredient.name || '').toLowerCase().includes(normalizedQuery),
    );
  }, [ingredients, searchInput]);
  const totalValidatedIngredients = filteredIngredients.length;
  const totalPages = Math.max(1, Math.ceil(totalValidatedIngredients / currentLimit));
  const paginatedIngredients = useMemo(() => {
    const startIndex = (currentPage - 1) * currentLimit;
    return filteredIngredients.slice(startIndex, startIndex + currentLimit);
  }, [filteredIngredients, currentLimit, currentPage]);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function canDeleteIngredient(ingredient) {
    return (ingredient?.recipesCount || 0) === 0;
  }

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

      <form
        className={styles.recipeSearchRow}
        onSubmit={(event) => {
          event.preventDefault();
          setCurrentPage(1);
        }}
      >
        <div className={styles.recipeSearchField}>
          <input
            className={styles.recipeSearchInput}
            type="search"
            placeholder="Rechercher un ingrédient"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Rechercher un ingrédient validé"
          />
        </div>

        <button type="submit" className={styles.recipeSearchButton}>
          Rechercher
        </button>
      </form>

      <div className={styles.recipeSummaryRow}>
        <p className={styles.recipeSummaryText}>
          <strong className={styles.summaryStrong}>{totalValidatedIngredients}</strong>{' '}
          ingrédient{totalValidatedIngredients > 1 ? 's' : ''} validé
          {totalValidatedIngredients > 1 ? 's' : ''}.
        </p>

        <div className={styles.recipeSummaryMeta}>
          <label className={styles.limitControl}>
            <span>Par page</span>
            <select
              value={currentLimit}
              onChange={(event) => {
                setCurrentLimit(Number(event.target.value));
                setCurrentPage(1);
              }}
              className={styles.limitSelect}
            >
              {LIMIT_OPTIONS.map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.mobileLimitControl} aria-label="Nombre d’ingrédients validés par page">
            <div className={styles.mobileLimitPills}>
              {LIMIT_OPTIONS.map((limit) => {
                const isActive = currentLimit === limit;

                return (
                  <button
                    key={limit}
                    type="button"
                    className={`${styles.mobileLimitPill} ${isActive ? styles.mobileLimitPillActive : ''}`.trim()}
                    onClick={() => {
                      setCurrentLimit(limit);
                      setCurrentPage(1);
                    }}
                    aria-pressed={isActive}
                  >
                    {limit}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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
        <h3>Liste des ingrédients</h3>
      </div>

      <div className={styles.list}>
        {paginatedIngredients.map((ingredient, index) => (
          <div key={`${ingredient.id}-${index}`} className={styles.categoryRow}>
            <div className={styles.ingredientIdentity}>
              <strong className={styles.ingredientName}>{ingredient.name}</strong>
              {ingredient.recipesCount > 0 && (
                <Link
                  to={`/admin/ingredients/${ingredient.id}/recettes`}
                  className={`${styles.submittedByRowTag} ${styles.clickableTag}`}
                  aria-label={`Voir les ${ingredient.recipesCount} recettes liées à l'ingrédient ${ingredient.name}`}
                >
                  Utilisé dans {ingredient.recipesCount} recette{ingredient.recipesCount > 1 ? 's' : ''}
                </Link>
              )}
            </div>

            <span className={styles.inlineTools}>
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundIconBtnEdit}`.trim()}
                title="Modifier"
                aria-label={`Modifier l'ingrédient ${ingredient.name}`}
                onClick={() => {
                  setSelectedIngredient(ingredient);
                  setEditedName(ingredient.name);
                  setShowEditModal(true);
                }}
              >
                <img src="/icon/Edit_duotone_line.svg" alt="" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundIconBtnDelete}`.trim()}
                disabled={!canDeleteIngredient(ingredient)}
                aria-label={`Supprimer l'ingrédient ${ingredient.name}`}
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
                <img src="/icon/Trash.svg" alt="" aria-hidden="true" />
              </button>
            </span>
          </div>
        ))}

        {!isLoading && !filteredIngredients.length ? (
          <StatusBlock
            variant="empty"
            title={searchInput.trim() ? 'Aucun ingrédient trouvé' : 'Aucun ingrédient validé'}
            message={
              searchInput.trim()
                ? 'Essaie une autre recherche pour retrouver un ingrédient validé.'
                : 'Les ingrédients approuvés apparaîtront ici.'
            }
            className={styles.pageState}
          />
        ) : null}
      </div>

      {!isLoading && !error && totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Pagination des ingrédients validés">
          <button
            type="button"
            className={styles.paginationButton}
            onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
            disabled={!hasPreviousPage}
          >
            Précédent
          </button>

          <span className={styles.paginationStatus}>
            Page {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            className={styles.paginationButton}
            onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={!hasNextPage}
          >
            Suivant
          </button>
        </nav>
      ) : null}

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
