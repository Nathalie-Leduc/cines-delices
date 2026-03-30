import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/AdminModal';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#CC9A5C');
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
      .catch((err) => setError(err.message || 'Impossible de charger les catégories.'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = newCategoryName.trim().toLowerCase();

    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) => (
      String(category.name || '').toLowerCase().includes(normalizedQuery)
    ));
  }, [categories, newCategoryName]);

  async function handleCreateCategory() {
    const name = newCategoryName.trim();

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
      setNewCategoryName('');
      setError('');
    } catch (createError) {
      setError(createError.message || 'Création impossible.');
    }
  }

  async function handleUpdateCategory() {
    if (!editingCategory) {
      return;
    }

    const nextName = editingCategoryName.trim();

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
      const updatedCategory = await updateAdminCategory(editingCategory.id, { name: nextName, color: selectedColor });
      setCategories((previous) => previous.map((category) => (category.id === updatedCategory.id ? updatedCategory : category)));
      setShowEditModal(false);
      setEditingCategory(null);
      setEditingCategoryName('');
      setError('');
    } catch (updateError) {
      setError(updateError.message || 'Modification impossible.');
    }
  }

  async function handleDeleteCategory() {
    if (!editingCategory) {
      return;
    }

    if ((editingCategory.recipesCount || 0) > 0) {
      setDeleteModalError('Impossible de supprimer cette catégorie car elle est encore utilisée par des recettes.');
      return;
    }

    try {
      await deleteAdminCategory(editingCategory.id);
      setCategories((previous) => previous.filter((category) => category.id !== editingCategory.id));
      setShowDeleteModal(false);
      setEditingCategory(null);
      setEditingCategoryName('');
      setDeleteModalError('');
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

      {!editingCategory && (
        <>
          <form
            className={styles.categoriesSearchRow}
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <div className={styles.categoriesSearchField}>
              <input
                type="search"
                className={styles.categoriesSearchInput}
                placeholder="Rechercher une catégorie"
                value={newCategoryName}
                onChange={(event) => {
                  setNewCategoryName(event.target.value);
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
              <button type="button" className={`${styles.roundIconBtn} ${styles.categoriesAddButton}`.trim()} aria-label="Ajouter" onClick={handleCreateCategory}>
                <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>+</span>
              </button>
            </div>
          </form>

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
            {filteredCategories.map((category) => (
              <div key={category.id} className={styles.categoryRow}>
                <div className={styles.categoryIdentity}>
                  <span className={styles.categoryDot} style={{ background: category.color }}>
                    {category.name}
                  </span>
                  <small className={styles.categoryMeta}>
                    {(category.recipesCount || 0)} recette{(category.recipesCount || 0) > 1 ? 's' : ''}
                  </small>
                </div>
                <span className={styles.inlineTools}>
                  <button
                    type="button"
                    className={styles.roundIconBtn}
                    aria-label={`Modifier la catégorie ${category.name}`}
                    onClick={() => {
                      setEditingCategory(category);
                      setEditingCategoryName(category.name);
                      setSelectedColor(category.color);
                      setDeleteModalError('');
                      setError('');
                    }}
                  >
                    <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.roundIconBtn}
                    aria-label={`Supprimer la catégorie ${category.name}`}
                    onClick={() => {
                      setEditingCategory(category);
                      setEditingCategoryName(category.name);
                      setDeleteModalError('');
                      setShowDeleteModal(true);
                      setError('');
                    }}
                  >
                    <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
                  </button>
                </span>
              </div>
            ))}

            {!isLoading && !error && filteredCategories.length === 0 ? (
              <StatusBlock
                variant="empty"
                title={newCategoryName.trim() ? 'Aucune catégorie trouvée' : 'Aucune catégorie enregistrée'}
                message={newCategoryName.trim()
                  ? 'Essaie une autre recherche pour retrouver une catégorie.'
                  : 'Ajoute une première catégorie pour commencer à organiser les recettes.'}
                className={styles.pageState}
              />
            ) : null}
          </div>
        </>
      )}

      {editingCategory && !showDeleteModal && (
        <div className={styles.colorEditor}>
          <div className={styles.headerLine}>
            <h2>Modifier une catégorie</h2>
          </div>

          <label className={styles.categoryNameLabel}>
            Nom de la catégorie
            <input
              type="text"
              className={styles.categoryNameField}
              value={editingCategoryName}
              onChange={(event) => {
                setEditingCategoryName(event.target.value);
                if (error) {
                  setError('');
                }
              }}
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
            onChange={(event) => setSelectedColor(`#${event.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)}`)}
          />

          <button type="button" className={`${styles.btnSuccess} ${styles.fullWidthBtn}`.trim()} onClick={() => setShowEditModal(true)}>
            Enregistrer
          </button>
        </div>
      )}

      {showDeleteModal && (
        <AdminModal
          title="Supprimer la catégorie"
          confirmLabel="Supprimer"
          onCancel={() => {
            setShowDeleteModal(false);
            setEditingCategory(null);
            setEditingCategoryName('');
            setDeleteModalError('');
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
