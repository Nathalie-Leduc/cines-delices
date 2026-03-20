import { useEffect, useState } from 'react';
import AdminModal from '../../components/AdminModal';
import { mockCategories } from '../../data/admin.mock.js';
import styles from './AdminPages.module.scss';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#CC9A5C');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Using mock data for testing
    setCategories(mockCategories);
  }, []);

  function handleCreateCategory() {
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
      // Mock creation for testing
      const newId = Math.max(...categories.map((c) => c.id), 0) + 1;
      const category = { id: newId, name, color: '#C9A45C' };
      setCategories((previous) => [category, ...previous]);
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
      // Mock update for testing
      const updatedCategory = { ...editingCategory, name: nextName, color: selectedColor };
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

    try {
      // Mock deletion for testing
      setCategories((previous) => previous.filter((category) => category.id !== editingCategory.id));
      setShowDeleteModal(false);
      setEditingCategory(null);
      setEditingCategoryName('');
      setError('');
    } catch (deleteError) {
      setError(deleteError.message || 'Suppression impossible.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>Gérer les catégories</h2>
      </div>

      {!editingCategory && (
        <>
          <form
            className={styles.categoriesSearchRow}
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateCategory();
            }}
          >
            <input
              type="text"
              className={styles.categoriesSearchInput}
              placeholder="Entrer son nom"
              value={newCategoryName}
              onChange={(event) => {
                setNewCategoryName(event.target.value);
                if (error) {
                  setError('');
                }
              }}
            />
            <button type="submit" className={styles.roundIconBtn} aria-label="Ajouter">
              <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>+</span>
            </button>
          </form>

          {error ? <p>{error}</p> : null}

          <div className={styles.sectionTitle}>
            <h3>Listes des catégories</h3>
          </div>

          <div className={styles.list}>
            {categories.map((category) => (
              <div key={category.id} className={styles.categoryRow}>
                <span className={styles.categoryDot} style={{ background: category.color }}>
                  {category.name}
                </span>
                <span className={styles.inlineTools}>
                  <button
                    type="button"
                    className={styles.roundIconBtn}
                    onClick={() => {
                      setEditingCategory(category);
                      setEditingCategoryName(category.name);
                      setSelectedColor(category.color);
                      setError('');
                    }}
                  >
                    <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.roundIconBtn}
                    onClick={() => {
                      setEditingCategory(category);
                      setEditingCategoryName(category.name);
                      setShowDeleteModal(true);
                      setError('');
                    }}
                  >
                    <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
                  </button>
                </span>
              </div>
            ))}
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

          <button type="button" className={`${styles.btnDanger} ${styles.fullWidthBtn}`.trim()} onClick={() => setShowEditModal(true)}>
            Valider
          </button>
        </div>
      )}

      {showDeleteModal && (
        <AdminModal onCancel={() => setShowDeleteModal(false)} onConfirm={handleDeleteCategory}>
          Êtes-vous sûr de vouloir supprimer cette catégorie ?
        </AdminModal>
      )}

      {showEditModal && (
        <AdminModal onCancel={() => setShowEditModal(false)} onConfirm={handleUpdateCategory}>
          Êtes-vous sûr de vouloir enregistrer le nom et la couleur de cette catégorie ?
        </AdminModal>
      )}
    </div>
  );
}

export default AdminCategories;