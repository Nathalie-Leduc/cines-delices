import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminModal from '../../components/AdminModal';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import { LIMIT_OPTIONS } from '../../components/RecipeCatalogView/recipeCatalog.shared.js';
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

const DEFAULT_CATEGORY_COLOR = '#CC9A5C';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [currentLimit, setCurrentLimit] = useState(LIMIT_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormName, setCategoryFormName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalError, setDeleteModalError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    getAdminCategories()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setCategories(list);
      })
      .catch((requestError) => {
        setError(requestError.message || 'Impossible de charger les catégories.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = searchInput.trim().toLowerCase();

    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) => (
      String(category.name || '').toLowerCase().includes(normalizedQuery)
    ));
  }, [categories, searchInput]);
  const totalCategories = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalCategories / currentLimit));
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * currentLimit;
    return filteredCategories.slice(startIndex, startIndex + currentLimit);
  }, [filteredCategories, currentLimit, currentPage]);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function canDeleteCategory(category) {
    return (category?.recipesCount || 0) === 0;
  }

  function resetCategoryEditor() {
    setIsCreatingCategory(false);
    setEditingCategory(null);
    setCategoryFormName('');
    setSelectedColor(DEFAULT_CATEGORY_COLOR);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setDeleteModalError('');
  }

  function openCreateCategoryPanel() {
    setIsCreatingCategory(true);
    setEditingCategory(null);
    setCategoryFormName('');
    setSelectedColor(DEFAULT_CATEGORY_COLOR);
    setDeleteModalError('');
    setError('');
  }

  useEffect(() => {
    function handleCategoriesReset() {
      resetCategoryEditor();
      setSearchInput('');
      setError('');
    }

    window.addEventListener('admin-categories-reset', handleCategoriesReset);

    return () => {
      window.removeEventListener('admin-categories-reset', handleCategoriesReset);
    };
  }, []);

  async function handleCreateCategory() {
    const name = categoryFormName.trim();

    if (!name) {
      setError('Veuillez saisir un nom de catégorie.');
      return;
    }

    const alreadyExists = categories.some(
      (category) => category.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (alreadyExists) {
      setError('Cette catégorie existe déjà.');
      return;
    }

    try {
      const created = await createAdminCategory({ name, color: selectedColor });
      setCategories((previous) => [created, ...previous]);
      resetCategoryEditor();
      setError('');
    } catch (createError) {
      setError(createError.message || 'Création impossible.');
    }
  }

  async function handleUpdateCategory() {
    if (!editingCategory) {
      return;
    }

    const nextName = categoryFormName.trim();

    if (!nextName) {
      setError('Le nom de la catégorie est obligatoire.');
      return;
    }

    const alreadyExists = categories.some(
      (category) => category.id !== editingCategory.id
        && category.name.trim().toLowerCase() === nextName.toLowerCase(),
    );

    if (alreadyExists) {
      setError('Cette catégorie existe déjà.');
      return;
    }

    try {
      const updatedCategory = await updateAdminCategory(editingCategory.id, {
        name: nextName,
        color: selectedColor,
      });
      setCategories((previous) => previous.map((category) => (
        category.id === updatedCategory.id ? updatedCategory : category
      )));
      resetCategoryEditor();
      setError('');
    } catch (updateError) {
      setError(updateError.message || 'Modification impossible.');
    }
  }

  async function handleDeleteCategory() {
    if (!editingCategory) {
      return;
    }

    const recipesCount = editingCategory.recipesCount || 0;

    if (recipesCount > 0) {
      setDeleteModalError(
        `Impossible de supprimer cette catégorie : ${recipesCount} recette${recipesCount > 1 ? 's utilisent encore' : ' utilise encore'} cette catégorie.`,
      );
      return;
    }

    try {
      await deleteAdminCategory(editingCategory.id);
      setCategories((previous) => previous.filter((category) => category.id !== editingCategory.id));
      resetCategoryEditor();
      setError('');
    } catch (deleteError) {
      setDeleteModalError(deleteError.message || 'Suppression impossible.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>Gérer les catégories</h2>
      </div>

      {isLoading ? (
        <StatusBlock
          variant="loading"
          title="Chargement des catégories"
          className={styles.pageState}
        />
      ) : null}

      {!editingCategory && !isCreatingCategory && (
        <>
          <form
            className={styles.categoriesSearchRow}
            onSubmit={(event) => {
              event.preventDefault();
              setCurrentPage(1);
            }}
          >
            <div className={styles.categoriesSearchField}>
              <input
                type="search"
                className={styles.categoriesSearchInput}
                placeholder="Rechercher une catégorie"
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setCurrentPage(1);
                  if (error) {
                    setError('');
                  }
                }}
                aria-label="Rechercher une catégorie"
              />
            </div>

            <div className={styles.categoriesSearchActions}>
              <button type="submit" className={styles.categoriesSearchButton}>
                Rechercher
              </button>
            </div>
          </form>

          <button
            type="button"
            className={styles.categoryCreatePromptButton}
            onClick={openCreateCategoryPanel}
          >
            <span className={styles.categoryCreatePromptIcon} aria-hidden="true">+</span>
            <span className={styles.categoryCreatePromptText}>Ajouter une catégorie</span>
          </button>

          <div className={styles.recipeSummaryRow}>
            <p className={styles.recipeSummaryText}>
              <strong className={styles.summaryStrong}>{totalCategories}</strong>{' '}
              catégorie{totalCategories > 1 ? 's' : ''} trouvée{totalCategories > 1 ? 's' : ''}.
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

              <div className={styles.mobileLimitControl} aria-label="Nombre de catégories par page">
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

          <div className={styles.sectionTitle}>
            <h3>Listes des catégories</h3>
          </div>

          <div className={styles.list}>
            {paginatedCategories.map((category) => {
              const recipesCount = category.recipesCount || 0;
              const deleteDisabled = !canDeleteCategory(category);

              return (
                <div key={category.id} className={styles.categoryRow}>
                  <div className={styles.ingredientIdentity}>
                    <span className={styles.categoryDot} style={{ background: category.color }}>
                      {category.name}
                    </span>
                    {recipesCount > 0 ? (
                      <Link
                        to={`/admin/categories/${category.id}/recettes`}
                        className={`${styles.submittedByRowTag} ${styles.clickableTag}`}
                        aria-label={`Voir les ${recipesCount} recettes liées à la catégorie ${category.name}`}
                      >
                        Utilisée dans {recipesCount} recette{recipesCount > 1 ? 's' : ''}
                      </Link>
                    ) : (
                      <small className={styles.categoryMeta}>
                        0 recette
                      </small>
                    )}
                  </div>
                  <span className={styles.inlineTools}>
                    <button
                      type="button"
                      className={`${styles.roundIconBtn} ${styles.roundIconBtnEdit}`.trim()}
                      aria-label={`Modifier la catégorie ${category.name}`}
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryFormName(category.name);
                        setSelectedColor(category.color);
                        setIsCreatingCategory(false);
                        setDeleteModalError('');
                        setError('');
                      }}
                    >
                      <img src="/icon/Edit_duotone_line.svg" alt="" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.roundIconBtn} ${styles.roundIconBtnDelete}`.trim()}
                      aria-label={`Supprimer la catégorie ${category.name}`}
                      disabled={deleteDisabled}
                      title={
                        deleteDisabled
                          ? `Suppression impossible : ${recipesCount} recette${recipesCount > 1 ? 's utilisent' : ' utilise'} cette catégorie`
                          : `Supprimer la catégorie ${category.name}`
                      }
                      onClick={() => {
                        if (deleteDisabled) {
                          return;
                        }

                        setEditingCategory(category);
                        setCategoryFormName(category.name);
                        setSelectedColor(category.color);
                        setIsCreatingCategory(false);
                        setDeleteModalError('');
                        setShowDeleteModal(true);
                        setError('');
                      }}
                    >
                      <img src="/icon/Trash.svg" alt="" aria-hidden="true" />
                    </button>
                  </span>
                </div>
              );
            })}

            {!isLoading && !error && filteredCategories.length === 0 ? (
              <StatusBlock
                variant="empty"
                title={searchInput.trim() ? 'Aucune catégorie trouvée' : 'Aucune catégorie enregistrée'}
                message={searchInput.trim()
                  ? 'Essaie une autre recherche pour retrouver une catégorie.'
                  : 'Ajoute une première catégorie pour commencer à organiser les recettes.'}
                className={styles.pageState}
              />
            ) : null}
          </div>

          {!isLoading && !error && totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Pagination des catégories">
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
        </>
      )}

      {(editingCategory || isCreatingCategory) && !showDeleteModal && (
        <div className={styles.colorEditor}>
          <div className={styles.headerLine}>
            <h2>{isCreatingCategory ? 'Ajouter une catégorie' : 'Modifier une catégorie'}</h2>
          </div>
          <p className={styles.categoryEditorLead}>
            {isCreatingCategory
              ? 'Choisissez un nom et une couleur pour créer une nouvelle catégorie.'
              : 'Modifiez le nom et la couleur de la catégorie sélectionnée.'}
          </p>

          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className={styles.pageState}
          />

          <label className={styles.categoryNameLabel}>
            Nom de la catégorie
            <input
              type="text"
              className={styles.categoryNameField}
              value={categoryFormName}
              onChange={(event) => {
                setCategoryFormName(event.target.value);
                if (error) {
                  setError('');
                }
              }}
              placeholder={isCreatingCategory ? 'Ex. Brunch' : undefined}
            />
          </label>

          <p className={styles.colorLabel}>Choisir une couleur de fond</p>

          <div className={styles.colorWheelWrap}>
            <input
              type="color"
              value={selectedColor}
              onChange={(event) => setSelectedColor(event.target.value.toUpperCase())}
            />
          </div>

          <input
            className={styles.hexField}
            value={selectedColor.replace('#', '')}
            onChange={(event) => {
              setSelectedColor(`#${event.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)}`);
            }}
          />

          <div className={styles.categoryEditorActions}>
            <button
              type="button"
              className={`${styles.btnSuccess} ${styles.fullWidthBtn}`.trim()}
              onClick={isCreatingCategory ? handleCreateCategory : () => setShowEditModal(true)}
            >
              {isCreatingCategory ? 'Ajouter la catégorie' : 'Enregistrer'}
            </button>

            <button
              type="button"
              className={`${styles.btnMuted} ${styles.fullWidthBtn}`.trim()}
              onClick={() => {
                resetCategoryEditor();
                setError('');
              }}
            >
              Retour à la liste
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <AdminModal
          title="Supprimer la catégorie"
          confirmLabel="Supprimer"
          onCancel={() => {
            resetCategoryEditor();
          }}
          onConfirm={handleDeleteCategory}
        >
          <div className={styles.modalDeleteText}>
            Êtes-vous sûr de vouloir supprimer cette catégorie ?
          </div>
          {deleteModalError ? <div className={styles.modalDeleteError}>{deleteModalError}</div> : null}
        </AdminModal>
      )}

      {showEditModal && (
        <AdminModal
          title="Mettre à jour la catégorie"
          confirmLabel="Enregistrer"
          confirmVariant="success"
          onCancel={() => setShowEditModal(false)}
          onConfirm={handleUpdateCategory}
        >
          Êtes-vous sûr de vouloir enregistrer le nom et la couleur de cette catégorie ?
        </AdminModal>
      )}
    </div>
  );
}

export default AdminCategories;
