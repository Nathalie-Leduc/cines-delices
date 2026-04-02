import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminModal from '../../components/AdminModal';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import { LIMIT_OPTIONS } from '../../components/RecipeCatalogView/recipeCatalog.shared.js';
import {
  deleteAdminIngredient,
  getValidatedAdminIngredients,
  mergeAdminIngredients,
  updateAdminIngredient,
} from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

// ─────────────────────────────────────────────────────────────
// normalizeIngredientName — même fonction que partout ailleurs
// Permet de pré-remplir la recherche de la cible de merge avec
// le nom normalisé au singulier ("citrons" → cherche "citron")
// ─────────────────────────────────────────────────────────────
function normalizeIngredientName(name) {
  const str = String(name || '').trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const exceptions = new Set([
    'riz', 'noix', 'ananas', 'brocolis', 'radis', 'mais', 'pois',
    'fois', 'buis', 'tapas', 'papas', 'colis',
  ]);

  if (exceptions.has(str)) return str;
  if (str.endsWith('s') && str.length > 3) return str.slice(0, -1);
  return str;
}

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

  // ──────────────────────────────────────────────────────────
  // NOUVEAUX ÉTATS — merge d'ingrédients
  //
  // showMergeModal     : affiche la modale de sélection de cible
  // mergeTargetSearch  : valeur saisie dans le champ recherche
  // mergeTargetResults : liste des ingrédients validés matchant
  // mergeTarget        : l'ingrédient cible sélectionné
  // isMerging          : loader pendant l'appel API
  //
  // Analogie : l'admin ouvre un sélecteur "vers quel bocal
  // voulez-vous déverser les étiquettes ?", tape "citron",
  // choisit dans la liste et confirme la fusion.
  // ──────────────────────────────────────────────────────────
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetSearch, setMergeTargetSearch] = useState('');
  const [mergeTargetResults, setMergeTargetResults] = useState([]);
  const [mergeTarget, setMergeTarget] = useState(null);
  const [isMerging, setIsMerging] = useState(false);

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

  // ──────────────────────────────────────────────────────────
  // openMergeModal — ouvre la modale de fusion pour un ingrédient
  //
  // On pré-remplit la recherche avec le nom normalisé au singulier
  // pour que "citrons" propose automatiquement "citron" comme cible.
  // ──────────────────────────────────────────────────────────
  async function openMergeModal(ingredient) {
    setSelectedIngredient(ingredient);
    setMergeTarget(null);
    setError('');

    // Pré-remplir avec le nom normalisé ("citrons" → "citron")
    const normalizedName = normalizeIngredientName(ingredient.name);
    setMergeTargetSearch(normalizedName);

    // Lancer la recherche initiale avec ce nom normalisé
    await searchMergeTargets(normalizedName, ingredient.id);
    setShowMergeModal(true);
  }

  // ──────────────────────────────────────────────────────────
  // searchMergeTargets — cherche les ingrédients validés
  // correspondant à la saisie, en excluant l'ingrédient source.
  // ──────────────────────────────────────────────────────────
  async function searchMergeTargets(query, excludeId) {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setMergeTargetResults([]);
      return;
    }

    try {
      const results = await getValidatedAdminIngredients(trimmed);
      const list = Array.isArray(results) ? results : [];
      // Exclure l'ingrédient source lui-même de la liste
      setMergeTargetResults(list.filter((i) => i.id !== excludeId));
    } catch {
      setMergeTargetResults([]);
    }
  }

  // ──────────────────────────────────────────────────────────
  // handleMerge — appelle mergeAdminIngredients puis met à jour
  // la liste locale : supprime source, met à jour target.
  // ──────────────────────────────────────────────────────────
  async function handleMerge() {
    if (!selectedIngredient || !mergeTarget) return;

    setIsMerging(true);
    setError('');

    try {
      const updatedTarget = await mergeAdminIngredients(
        selectedIngredient.id, // source : l'ingrédient à absorber ("citrons")
        mergeTarget.id,        // target : l'ingrédient qui survit ("citron")
      );

      setIngredients((previous) =>
        previous
          // Supprimer la source de la liste
          .filter((i) => i.id !== selectedIngredient.id)
          // Mettre à jour la target avec le nouveau recipesCount
          .map((i) => (i.id === updatedTarget.id ? updatedTarget : i)),
      );

      setShowMergeModal(false);
      setSelectedIngredient(null);
      setMergeTarget(null);
      setMergeTargetSearch('');
      setMergeTargetResults([]);
    } catch (mergeError) {
      setError(mergeError.message || 'Fusion impossible.');
    } finally {
      setIsMerging(false);
    }
  }

  function closeMergeModal() {
    setShowMergeModal(false);
    setSelectedIngredient(null);
    setMergeTarget(null);
    setMergeTargetSearch('');
    setMergeTargetResults([]);
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
          <span className={styles.recipeSearchFieldIcon} aria-hidden="true" />
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

          <div className={styles.mobileLimitControl} aria-label="Nombre d'ingrédients validés par page">
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

              {/* ── NOUVEAU : bouton Fusionner ────────────────────────
                  Toujours visible — même pour les ingrédients utilisés
                  dans des recettes (c'est justement pour ça qu'on en
                  a besoin : supprimer est impossible, merge l'est).
                  Icône: merge ou link — à adapter selon tes assets */}
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundIconBtnMerge}`.trim()}
                title="Fusionner avec un autre ingrédient"
                aria-label={`Fusionner l'ingrédient ${ingredient.name} avec un autre`}
                onClick={() => openMergeModal(ingredient)}
              >
                <img src="/icon/merge.svg" alt="" aria-hidden="true" />
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

      {/* MODALES EXISTANTES — inchangées */}
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

      {/* ── NOUVELLE MODALE — fusion d'ingrédients ───────────────────
          Workflow :
          1. L'admin clique "Fusionner" sur "citrons"
          2. La modale s'ouvre avec "citron" pré-recherché
          3. L'admin voit la liste et clique sur "citron"
          4. Un résumé apparaît : "citrons (1 recette) → citron (12 recettes)"
          5. L'admin confirme → merge + suppression de "citrons"
      ────────────────────────────────────────────────────────────── */}
      {showMergeModal && selectedIngredient && (
        <AdminModal
          title="Fusionner l'ingrédient"
          confirmLabel={isMerging ? 'Fusion...' : 'Confirmer la fusion'}
          confirmVariant="danger"
          onCancel={closeMergeModal}
          onConfirm={handleMerge}
        >
          <p>
            Fusionner <strong>"{selectedIngredient.name}"</strong>
            {selectedIngredient.recipesCount > 0
              ? ` (${selectedIngredient.recipesCount} recette${selectedIngredient.recipesCount > 1 ? 's' : ''})`
              : ' (0 recette)'}
            {' '}vers :
          </p>

          {/* Champ de recherche de la cible */}
          <input
            className={styles.modalInput}
            style={{ marginTop: '0.75rem' }}
            type="search"
            placeholder="Rechercher l'ingrédient cible..."
            value={mergeTargetSearch}
            onChange={async (event) => {
              setMergeTargetSearch(event.target.value);
              setMergeTarget(null);
              await searchMergeTargets(event.target.value, selectedIngredient.id);
            }}
          />

          {/* Liste des résultats */}
          {mergeTargetResults.length > 0 && !mergeTarget && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0' }}>
              {mergeTargetResults.slice(0, 8).map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    className={styles.ingredientSuggestionBtn ?? ''}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.4rem 0.6rem',
                      background: 'none',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      color: 'inherit',
                    }}
                    onClick={() => {
                      setMergeTarget(result);
                      setMergeTargetResults([]);
                    }}
                  >
                    {result.name}
                    {result.recipesCount > 0 && (
                      <span style={{ opacity: 0.6, marginLeft: '0.5rem', fontSize: '0.85em' }}>
                        ({result.recipesCount} recette{result.recipesCount > 1 ? 's' : ''})
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Résumé une fois la cible sélectionnée */}
          {mergeTarget && (
            <p style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <strong>"{selectedIngredient.name}"</strong>
              {selectedIngredient.recipesCount > 0 ? ` (${selectedIngredient.recipesCount} recette${selectedIngredient.recipesCount > 1 ? 's' : ''})` : ''}
              {' '}→{' '}
              <strong>"{mergeTarget.name}"</strong>
              {mergeTarget.recipesCount > 0 ? ` (${mergeTarget.recipesCount} recette${mergeTarget.recipesCount > 1 ? 's' : ''})` : ''}
              <br />
              <span style={{ opacity: 0.7, fontSize: '0.85em' }}>
                "{selectedIngredient.name}" sera supprimé définitivement.
              </span>
            </p>
          )}

          {!mergeTarget && mergeTargetSearch.trim().length >= 2 && mergeTargetResults.length === 0 && (
            <p style={{ marginTop: '0.5rem', opacity: 0.6, fontSize: '0.9em' }}>
              Aucun ingrédient trouvé pour "{mergeTargetSearch}".
            </p>
          )}
        </AdminModal>
      )}
    </div>
  );
}
