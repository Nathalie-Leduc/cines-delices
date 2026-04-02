import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/AdminModal';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import {
  approveAdminIngredient,
  deleteAdminIngredient,
  getAdminIngredients,
  getValidatedAdminIngredients,
  updateAdminIngredient,
} from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

const LIMIT_OPTIONS = [6, 9, 12, 15];

// ─────────────────────────────────────────────────────────────
// normalizeIngredientName — force le singulier + minuscule
// Même fonction que dans CreateRecipe.jsx et recipe.controller.js
// pour garantir une comparaison cohérente partout.
// "Citrons" → "citron", "tomates" → "tomate", "riz" → "riz"
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

  if (str.endsWith('s') && str.length > 3) {
    return str.slice(0, -1);
  }

  return str;
}

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
  const [currentLimit, setCurrentLimit] = useState(LIMIT_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [error, setError] = useState('');

  // ──────────────────────────────────────────────────────────
  // NOUVEAUX ÉTATS — détection de doublon avant validation
  //
  // showDuplicateModal : affiche la modale d'avertissement
  // duplicateIngredient : l'ingrédient validé qui fait doublon
  //   ex: { id: "abc", name: "citron", recipesCount: 12 }
  //
  // Analogie : avant de tamponner "APPROUVÉ" sur le bon de
  // commande "citrons", le chef vérifie d'abord si "citron"
  // est déjà dans son carnet. Si oui, il prévient.
  // ──────────────────────────────────────────────────────────
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateIngredient, setDuplicateIngredient] = useState(null);

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
  const totalPendingIngredients = filteredIngredients.length;
  const totalPages = Math.max(1, Math.ceil(totalPendingIngredients / currentLimit));
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

  // ──────────────────────────────────────────────────────────
  // openValidateModal — vérifie le doublon AVANT d'ouvrir
  // la modale de validation.
  //
  // Étapes :
  //   1. Normaliser le nom soumis ("citrons" → "citron")
  //   2. Chercher parmi les ingrédients déjà validés si ce
  //      nom normalisé existe déjà
  //   3. Si doublon trouvé → ouvrir la modale d'avertissement
  //   4. Sinon → ouvrir la modale de validation normale
  //
  // On remplace l'ancien onClick direct sur le bouton ✓
  // par cet appel async pour intercepter avant la modale.
  // ──────────────────────────────────────────────────────────
  async function openValidateModal(ingredient) {
    setSelectedIngredient(ingredient);
    setError('');

    try {
      // Normaliser le nom soumis pour comparer équitablement
      const normalizedName = normalizeIngredientName(ingredient.name);

      // Chercher parmi les ingrédients déjà validés
      const validated = await getValidatedAdminIngredients(normalizedName);
      const validatedList = Array.isArray(validated) ? validated : [];

      // Chercher un ingrédient validé dont le nom normalisé correspond
      const duplicate = validatedList.find(
        (v) => normalizeIngredientName(v.name) === normalizedName
          && v.id !== ingredient.id,
      );

      if (duplicate) {
        // ⚠️ Doublon détecté → avertir l'admin
        setDuplicateIngredient(duplicate);
        setShowDuplicateModal(true);
      } else {
        // ✅ Pas de doublon → validation normale
        setShowValidateModal(true);
      }
    } catch {
      // En cas d'erreur réseau → laisser passer (validation normale)
      // On ne bloque pas l'admin sur une erreur de vérification
      setShowValidateModal(true);
    }
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

  // ──────────────────────────────────────────────────────────
  // handleDuplicateDismiss — l'admin choisit d'annuler
  // depuis la modale d'avertissement doublon.
  // ──────────────────────────────────────────────────────────
  function handleDuplicateDismiss() {
    setShowDuplicateModal(false);
    setDuplicateIngredient(null);
    setSelectedIngredient(null);
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>Validation des ingrédients</h2>
      </div>

      <form
        className={styles.recipeSearchRow}
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <div className={styles.recipeSearchField}>
          <span className={styles.recipeSearchFieldIcon} aria-hidden="true" />
          <input
            className={styles.recipeSearchInput}
            type="search"
            placeholder="Rechercher un ingrédient"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Rechercher un ingrédient à valider"
          />
        </div>
      </form>

      <div className={styles.recipeSummaryRow}>
        <p className={styles.recipeSummaryText}>
          Vous avez <strong className={styles.summaryStrong}>{totalPendingIngredients}</strong> ingrédient{totalPendingIngredients > 1 ? 's' : ''} à valider.
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

          <div className={styles.mobileLimitControl} aria-label="Nombre d'ingrédients par page">
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
              <span className={styles.submittedByRowTag}>Soumis par {getSubmittedByLabel(ingredient)}</span>
            </div>

            <span className={styles.inlineTools}>
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundIconBtnEdit}`.trim()}
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
                aria-label={`Supprimer l'ingrédient ${ingredient.name}`}
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
                <img src="/icon/Trash.svg" alt="" aria-hidden="true" />
              </button>

              {/* ── MODIF : onClick remplacé par openValidateModal(ingredient) ──
                  Avant : onClick ouvrait directement showValidateModal
                  Après : openValidateModal vérifie d'abord les doublons,
                          puis ouvre la bonne modale selon le résultat */}
              <button
                type="button"
                className={`${styles.roundIconBtn} ${styles.roundGreen}`.trim()}
                aria-label={`Valider l'ingrédient ${ingredient.name}`}
                onClick={() => openValidateModal(ingredient)}
              >
                <img src="/icon/check_ring_round.svg" alt="" aria-hidden="true" />
              </button>
            </span>
          </div>
        ))}

        {!isLoading && !error && totalPendingIngredients === 0 ? (
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

      {!isLoading && !error && totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Pagination des ingrédients à valider">
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

      {/* MODALE VALIDATION NORMALE — inchangée */}
      {showValidateModal && (
        <AdminModal
          title="Valider l'ingrédient"
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
          title="Supprimer l'ingrédient"
          confirmLabel="Supprimer"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteIngredient}
        >
          Êtes-vous sûr de vouloir supprimer cet ingrédient ?
        </AdminModal>
      )}

      {showEditModal && (
        <AdminModal
          title="Modifier l'ingrédient"
          confirmLabel="Enregistrer"
          confirmVariant="success"
          onCancel={() => setShowEditModal(false)}
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

      {/* ── NOUVELLE MODALE — avertissement doublon ──────────────────
          S'affiche quand openValidateModal() détecte qu'un ingrédient
          validé avec le même nom normalisé existe déjà en BDD.
          
          L'admin a deux choix :
          - "Annuler" → ne rien faire, gérer manuellement
          - "Valider quand même" → force la validation (cas où
            les deux ingrédients sont légitimement différents,
            ex: "pois" vs "pois chiche" — mais ici peu probable)

          NOTE : le merge complet (rattacher les recettes +
          supprimer le doublon) sera implémenté dans AdminIngredients.jsx
          (correctif 6). Pour l'instant on bloque la validation
          silencieuse et on informe l'admin.
      ────────────────────────────────────────────────────────────── */}
      {showDuplicateModal && duplicateIngredient && selectedIngredient && (
        <AdminModal
          title="⚠️ Doublon détecté"
          confirmLabel="Valider quand même"
          confirmVariant="danger"
          onCancel={handleDuplicateDismiss}
          onConfirm={async () => {
            setShowDuplicateModal(false);
            setDuplicateIngredient(null);
            await handleApproveIngredient();
          }}
        >
          <p>
            L'ingrédient <strong>"{selectedIngredient.name}"</strong> ressemble à{' '}
            <strong>"{duplicateIngredient.name}"</strong> qui existe déjà
            {duplicateIngredient.recipesCount > 0
              ? ` et est utilisé dans ${duplicateIngredient.recipesCount} recette${duplicateIngredient.recipesCount > 1 ? 's' : ''}`
              : ''}.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Pour fusionner les deux, rendez-vous dans{' '}
            <strong>Gérer les ingrédients</strong> après validation.
          </p>
        </AdminModal>
      )}
    </div>
  );
}
