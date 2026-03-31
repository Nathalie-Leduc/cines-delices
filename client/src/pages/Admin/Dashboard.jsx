import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminModal from '../../components/AdminModal';
import Alert from '../../components/Alert/Alert.jsx';
import RecipeCard from '../../components/RecipeCard';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import {
  LIMIT_OPTIONS,
  normalizeCategoryLabel,
} from '../../components/RecipeCatalogView/recipeCatalog.shared.js';
import {
  approveAdminIngredient,
  approveAdminRecipe,
  deleteAdminIngredient,
  getAdminIngredients,
  getPendingRecipes,
  rejectAdminRecipe,
} from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function normalizeImageUrl(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return '';
  }

  if (rawValue.startsWith('/')) {
    return `${API_BASE_URL}${rawValue}`;
  }

  try {
    const parsed = new URL(rawValue);
    const apiOrigin = new URL(API_BASE_URL).origin;
    const isLocalhostSource = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (isLocalhostSource && parsed.origin !== apiOrigin) {
      return `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return rawValue;
  } catch {
    return rawValue;
  }
}

function getRecipeImage(recipe) {
  const image = recipe?.image || recipe?.imageURL || recipe?.imageUrl || '';
  return normalizeImageUrl(image);
}

function getMediaPoster(recipe) {
  const poster = recipe?.mediaPoster || recipe?.poster || recipe?.media?.posterUrl || '';
  return normalizeImageUrl(poster);
}

function handleImageError(event) {
  const target = event.currentTarget;
  const fallbackSrc = target.dataset.fallbackSrc || '/img/hero-home.png';

  if (target.src !== fallbackSrc) {
    target.src = fallbackSrc;
    return;
  }

  target.onerror = null;
}

function getDurationMinutes(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return duration;
  }
  const parsed = parseInt(String(duration || '').replace(/[^\d]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
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

function parseBlockingIngredientNames(message) {
  const rawMessage = String(message || '');
  const match = rawMessage.match(/approuv[ée]s?\s*:\s*(.+)$/i);

  if (!match?.[1]) {
    return [];
  }

  return match[1]
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
}

function countClass(label) {
  const key = String(label || '').toLowerCase();
  if (key === 'entrée') return styles.countEntree;
  if (key === 'plat') return styles.countPlat;
  if (key === 'dessert') return styles.countDessert;
  if (key === 'boisson') return styles.countBoisson;
  return '';
}

function filterToneClass(key) {
  if (key === 'tous') return styles.recipePillTous;
  if (key === 'entree') return styles.recipePillEntree;
  if (key === 'plat') return styles.recipePillPlat;
  if (key === 'dessert') return styles.recipePillDessert;
  if (key === 'boisson') return styles.recipePillBoisson;
  return '';
}

function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(LIMIT_OPTIONS[LIMIT_OPTIONS.length - 1]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [showIngredientModerationModal, setShowIngredientModerationModal] = useState(false);
  const [blockingIngredients, setBlockingIngredients] = useState([]);
  const [loadingBlockingIngredients, setLoadingBlockingIngredients] = useState(false);
  const [ingredientActionKey, setIngredientActionKey] = useState('');
  const [rejectReason, setRejectReason] = useState(`Votre recette n’a pas été validée.\n\nElle ne respecte pas nos règles de publication\n(contenu incohérent ou incomplet).\n\nMerci de modifier votre recette avant de la soumettre à nouveau.`);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPendingRecipes = async () => {
      try {
        const payload = await getPendingRecipes();
        setPendingRecipes(Array.isArray(payload) ? payload : []);
      } catch (loadError) {
        setError(loadError.message || 'Impossible de charger les recettes à valider.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingRecipes();
  }, []);

  useEffect(() => {
    const targetRecipeId = location.state?.openRecipeId;
    if (!targetRecipeId || pendingRecipes.length === 0) {
      return;
    }

    const recipe = pendingRecipes.find((item) => item.id === targetRecipeId);
    if (recipe) {
      setSelectedRecipe(recipe);
      navigate('/admin/validation-recettes', { replace: true, state: {} });
    }
  }, [location.state, pendingRecipes, navigate]);

  const counters = useMemo(() => {
    return pendingRecipes.reduce((accumulator, recipe) => {
      const key = normalizeCategoryLabel(recipe.category);
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
  }, [pendingRecipes]);

  const filteredPendingRecipes = useMemo(() => {
    const normalizedQuery = searchInput.trim().toLowerCase();

    if (activeFilter === 'Tous') {
      return pendingRecipes.filter((recipe) => String(recipe.title || '').toLowerCase().includes(normalizedQuery));
    }

    return pendingRecipes.filter((recipe) => (
      normalizeCategoryLabel(recipe.category) === activeFilter
      && String(recipe.title || '').toLowerCase().includes(normalizedQuery)
    ));
  }, [pendingRecipes, activeFilter, searchInput]);

  const filters = useMemo(() => {
    const baseFilters = [
      { label: 'Tous', value: 'Tous', key: 'tous' },
      { label: 'Entrée', value: 'Entrée', key: 'entree' },
      { label: 'Plat', value: 'Plat', key: 'plat' },
      { label: 'Dessert', value: 'Dessert', key: 'dessert' },
      { label: 'Boisson', value: 'Boisson', key: 'boisson' },
    ];

    const baseValues = new Set(baseFilters.map((filter) => filter.value));
    const extraFilters = Object.keys(counters)
      .filter((label) => !baseValues.has(label))
      .sort((left, right) => left.localeCompare(right, 'fr', { sensitivity: 'base' }))
      .map((label) => ({
        label,
        value: label,
        key: String(label || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase(),
      }));

    return [...baseFilters, ...extraFilters].map((filter) => ({
      ...filter,
      count: filter.value === 'Tous' ? pendingRecipes.length : (counters[filter.value] || 0),
    }));
  }, [pendingRecipes.length, counters]);

  useEffect(() => {
    if (activeFilter === 'Tous') {
      return;
    }

    const filterExists = filters.some((filter) => filter.value === activeFilter);
    if (!filterExists) {
      setActiveFilter('Tous');
      setCurrentPage(1);
    }
  }, [activeFilter, filters]);

  const totalPendingRecipes = filteredPendingRecipes.length;
  const totalPages = Math.max(1, Math.ceil(totalPendingRecipes / currentLimit));
  const paginatedPendingRecipes = useMemo(() => {
    const startIndex = (currentPage - 1) * currentLimit;
    return filteredPendingRecipes.slice(startIndex, startIndex + currentLimit);
  }, [filteredPendingRecipes, currentLimit, currentPage]);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const summarySuffix = ` recette${totalPendingRecipes > 1 ? 's' : ''} à valider${activeFilter !== 'Tous' ? ` en ${activeFilter}` : ''}${searchInput.trim() ? ` pour "${searchInput.trim()}"` : ''}.`;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const selectedRecipeHeroImage = selectedRecipe ? getRecipeImage(selectedRecipe) : '';
  const selectedRecipeMediaPoster = selectedRecipe ? getMediaPoster(selectedRecipe) : '';
  const selectedRecipeHeroFallback = selectedRecipeMediaPoster && selectedRecipeMediaPoster !== selectedRecipeHeroImage
    ? selectedRecipeMediaPoster
    : '/img/hero-home.png';
  const selectedRecipeMediaFallback = selectedRecipeHeroImage && selectedRecipeHeroImage !== selectedRecipeMediaPoster
    ? selectedRecipeHeroImage
    : '/img/parrain-poster.png';

  async function handleApprove() {
    if (!selectedRecipe) {
      return;
    }

    try {
      setError('');
      await approveAdminRecipe(selectedRecipe.id);
      window.dispatchEvent(new CustomEvent('admin-notification-consumed', {
        detail: { recipeId: selectedRecipe.id },
      }));
      setPendingRecipes((previous) => previous.filter((recipe) => recipe.id !== selectedRecipe.id));
      setSelectedRecipe(null);
      setShowValidateModal(false);
      setShowIngredientModerationModal(false);
      setBlockingIngredients([]);
    } catch (approveError) {
      const message = approveError.message || 'Validation impossible.';
      setError(message);

      // Si la recette est bloquée par des ingrédients non approuvés,
      // on ferme la modale pour n'afficher que le message d'erreur.
      if (/ingr[ée]dient[s]?/i.test(message) && /approuv/i.test(message)) {
        setShowValidateModal(false);
        setShowIngredientModerationModal(true);
        setLoadingBlockingIngredients(true);

        try {
          const pendingIngredientsPayload = await getAdminIngredients();
          const pendingIngredients = Array.isArray(pendingIngredientsPayload) ? pendingIngredientsPayload : [];
          const recipeIngredientIds = new Set((selectedRecipe.ingredients || []).map((item) => String(item.id || '')));
          const recipeIngredientNames = new Set(
            (selectedRecipe.ingredients || [])
              .map((item) => String(item.name || '').trim().toLowerCase())
              .filter(Boolean),
          );
          const blockingNamesFromMessage = new Set(parseBlockingIngredientNames(message));

          const blocking = pendingIngredients.filter((ingredient) => {
            const ingredientId = String(ingredient.id || '');
            const ingredientName = String(ingredient.name || '').trim().toLowerCase();

            return recipeIngredientIds.has(ingredientId)
              || recipeIngredientNames.has(ingredientName)
              || blockingNamesFromMessage.has(ingredientName);
          });

          setBlockingIngredients(blocking);
        } catch (loadIngredientsError) {
          setBlockingIngredients([]);
          setError(loadIngredientsError.message || 'Impossible de charger les ingrédients à modérer.');
        } finally {
          setLoadingBlockingIngredients(false);
        }
      }
    }
  }

  async function handleModerateIngredient(ingredient, action) {
    if (!ingredient?.id) {
      return;
    }

    const actionKey = `${action}:${ingredient.id}`;
    setIngredientActionKey(actionKey);

    try {
      setError('');

      if (action === 'approve') {
        await approveAdminIngredient(ingredient.id);
        setBlockingIngredients((previous) => previous.filter((item) => item.id !== ingredient.id));
        return;
      }

      await deleteAdminIngredient(ingredient.id);

      if (selectedRecipe?.id) {
        window.dispatchEvent(new CustomEvent('admin-notification-consumed', {
          detail: { recipeId: selectedRecipe.id },
        }));
      }

      setPendingRecipes((previous) => previous.filter((recipe) => recipe.id !== selectedRecipe?.id));
      setSelectedRecipe(null);
      setShowIngredientModerationModal(false);
      setBlockingIngredients([]);
    } catch (ingredientActionError) {
      setError(ingredientActionError.message || 'Action impossible sur cet ingrédient.');
    } finally {
      setIngredientActionKey('');
    }
  }

  async function handleReject() {
    if (!selectedRecipe) {
      return;
    }

    try {
      setError('');
      await rejectAdminRecipe(selectedRecipe.id, rejectReason);
      window.dispatchEvent(new CustomEvent('admin-notification-consumed', {
        detail: { recipeId: selectedRecipe.id },
      }));
      setPendingRecipes((previous) => previous.filter((recipe) => recipe.id !== selectedRecipe.id));
      setSelectedRecipe(null);
      setShowRefuseModal(false);
    } catch (rejectError) {
      setError(rejectError.message || 'Refus impossible.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>Validation des recettes</h2>
      </div>

      {!selectedRecipe && (
        <>
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
                placeholder="Rechercher une recette"
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Rechercher une recette à valider"
              />
            </div>

            <button type="submit" className={styles.recipeSearchButton}>
              Rechercher
            </button>
          </form>

          <div className={styles.recipeFiltersRow} aria-label="Filtrer les recettes par catégorie">
            {filters.map((filter) => (
              <div key={filter.label} className={styles.filterGroup}>
                <span className={`${styles.count} ${countClass(filter.label)}`.trim()}>{filter.count}</span>
                <button
                  type="button"
                  className={`${styles.recipePill} ${filterToneClass(filter.key)} ${activeFilter === filter.value ? styles.recipePillActive : ''}`.trim()}
                  onClick={() => {
                    setActiveFilter(filter.value);
                    setCurrentPage(1);
                  }}
                  aria-pressed={activeFilter === filter.value}
                >
                  {filter.label}
                </button>
              </div>
            ))}
          </div>

          <div className={styles.recipeSummaryRow}>
            <p className={styles.recipeSummaryText}>
              Vous avez <strong className={styles.summaryStrong}>{totalPendingRecipes}</strong>{summarySuffix}
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

              <div className={styles.mobileLimitControl} aria-label="Nombre de recettes par page">
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
            <h3>{activeFilter === 'Tous' ? 'Toutes les recettes' : `${activeFilter}s`}</h3>
          </div>

          {isLoading ? (
            <StatusBlock
              variant="loading"
              title="Chargement des recettes à valider"
              className={styles.pageState}
            />
          ) : null}

          {!isLoading && !error && totalPendingRecipes === 0 ? (
            <StatusBlock
              variant="empty"
              title="Aucune recette en attente"
              message={searchInput.trim()
                ? "Aucune recette ne correspond à cette recherche. Essaie un autre titre."
                : activeFilter === 'Tous'
                  ? "Les nouvelles recettes soumises apparaîtront ici pour validation."
                  : `Aucune recette ${activeFilter.toLowerCase()} n’attend de validation pour le moment.`}
              className={styles.pageState}
            />
          ) : null}

          <div className={styles.recipesGridExact}>
            {paginatedPendingRecipes.map((recipe) => {
              const slug = recipe.slug || String(recipe.id);
              const primaryImage = getRecipeImage(recipe);
              const fallbackImage = getMediaPoster(recipe) || '/img/hero-home.png';
              const recipeForCatalogCard = {
                id: recipe.id,
                slug,
                image: primaryImage || fallbackImage || '/img/placeholder.jpg',
                fallbackImage,
                title: recipe.title,
                category: normalizeCategoryLabel(recipe.category),
                mediaTitle: recipe.movie || 'Film non renseigné',
                mediaType: recipe.media === 'S' ? 'serie' : 'film',
                duration: getDurationMinutes(recipe.duration),
              };

              return (
                <div key={recipe.id} className={styles.adminRecipeCardWrap}>
                  <RecipeCard recipe={recipeForCatalogCard} />
                  <span className={styles.submittedByCardTag}>Soumis par {getSubmittedByLabel(recipe)}</span>
                  <button
                    type="button"
                    className={styles.cardNavOverlay}
                    aria-label={`Voir la recette ${recipe.title}`}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                  <div className={styles.cardActionsExact}>
                  </div>
                </div>
              );
            })}
          </div>

          {!isLoading && !error && totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Pagination des recettes à valider">
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

      {selectedRecipe && (
        <>
          <article className={styles.heroRecipe}>
            <div className={styles.heroImage}>
              <img
                src={selectedRecipeHeroImage || selectedRecipeHeroFallback}
                alt="Illustration de la recette en attente"
                data-fallback-src={selectedRecipeHeroFallback}
                onError={handleImageError}
              />
              <div className={styles.heroText}>
                <h3>{selectedRecipe.title}</h3>
                <p>L’esprit du film {selectedRecipe.movie}</p>
              </div>
            </div>

            <div className={styles.heroMeta}>
              <span>{selectedRecipe.preparationTime} min</span>
              <span>{selectedRecipe.cookingTime} min</span>
              <span>{selectedRecipe.duration}</span>
              <span>{selectedRecipe.people} personnes</span>
            </div>

            <div className={styles.heroSubmittedByWrap}>
              <span className={styles.submittedByHeroTag}>Soumise par {getSubmittedByLabel(selectedRecipe)}</span>
            </div>

            <div className={styles.heroBody}>
              <div>
                <h4 className={styles.blockTitle}>Ingrédients</h4>
                <div className={styles.ingredientsList}>
                  {selectedRecipe.ingredients.map((ingredient) => (
                    <div key={ingredient.id} className={styles.ingredientsItem}>
                      {ingredient.quantity ? `${ingredient.quantity} ` : ''}
                      {ingredient.unit ? `${ingredient.unit} ` : ''}
                      {ingredient.name}
                    </div>
                  ))}
                </div>

                <h4 className={styles.blockTitle} style={{ marginTop: '0.8rem' }}>Etapes</h4>
                <div className={styles.stepsList}>
                  {selectedRecipe.instructions.split('\n').filter(Boolean).map((step, index) => (
                    <div key={`${step}-${index}`} className={styles.stepsItem}>
                      <span className={styles.dot} />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className={styles.sideMedia}>
                  <div className={styles.sideMediaRow}>
                    <img
                      src={selectedRecipeMediaPoster || selectedRecipeMediaFallback}
                      alt="Média associé"
                      data-fallback-src={selectedRecipeMediaFallback}
                      onError={handleImageError}
                    />
                    <p>{selectedRecipe.movie}<br />Synopsis<br />Recette en attente de validation.</p>
                  </div>
                </div>

                <h4 className={styles.blockTitle} style={{ marginTop: '0.75rem' }}>Recettes similaires</h4>
                <div className={styles.sideMedia}>
                  <div className={styles.sideMediaRow}>
                    <img src="/img/Spaghetti.png" alt="Recette similaire" />
                    <p>Spaghetti Ratatouille<br />25 min</p>
                  </div>
                  <div className={styles.sideMediaRow}>
                    <img src="/img/lospolloshermanos.png" alt="Recette similaire" />
                    <p>Los Pollos Hermanos<br />35 min</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div className={`${styles.actionButtons} ${styles.heroActionButtons}`.trim()}>
            <button type="button" className={`${styles.btnMuted} ${styles.fullWidthBtn}`.trim()} onClick={() => setShowRefuseModal(true)}>
              Refuser
            </button>
            <button type="button" className={`${styles.btnSuccess} ${styles.fullWidthBtn}`.trim()} onClick={() => setShowValidateModal(true)}>
              Valider
            </button>
          </div>

          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className={styles.pageState}
          />
        </>
      )}

      {showValidateModal && (
        <AdminModal
          title="Valider la recette"
          confirmLabel="Valider"
          confirmVariant="success"
          onCancel={() => setShowValidateModal(false)}
          onConfirm={handleApprove}
        >
          Êtes-vous sûr de vouloir valider cette recette ?
        </AdminModal>
      )}

      {showRefuseModal && (
        <AdminModal
          title="Motif du refus :"
          confirmLabel="Envoyer"
          onCancel={() => setShowRefuseModal(false)}
          onConfirm={handleReject}
        >
          <textarea
            className={styles.modalTextarea}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
          />
        </AdminModal>
      )}

      {showIngredientModerationModal && (
        <AdminModal
          title="Ingrédients à modérer"
          confirmLabel="Fermer"
          onCancel={() => setShowIngredientModerationModal(false)}
          onConfirm={() => setShowIngredientModerationModal(false)}
        >
          <p className={styles.ingredientModerationIntro}>
            Cette recette ne peut pas être validée tant que ces ingrédients ne sont pas traités.
          </p>

          {loadingBlockingIngredients ? (
            <StatusBlock
              variant="loading"
              title="Chargement des ingrédients"
              className={styles.pageState}
            />
          ) : null}

          {!loadingBlockingIngredients && blockingIngredients.length > 0 ? (
            <div className={styles.ingredientModerationList}>
              {blockingIngredients.map((ingredient) => {
                const approveKey = `approve:${ingredient.id}`;
                const rejectKey = `reject:${ingredient.id}`;
                const isApproving = ingredientActionKey === approveKey;
                const isRejecting = ingredientActionKey === rejectKey;

                return (
                  <div key={ingredient.id} className={styles.ingredientModerationItem}>
                    <span className={styles.ingredientModerationName}>{ingredient.name}</span>
                    <span className={styles.ingredientModerationActions}>
                      <button
                        type="button"
                        className={styles.ingredientApproveBtn}
                        disabled={Boolean(ingredientActionKey)}
                        onClick={() => handleModerateIngredient(ingredient, 'approve')}
                      >
                        {isApproving ? 'Validation…' : 'Valider'}
                      </button>
                      <button
                        type="button"
                        className={styles.ingredientRejectBtn}
                        disabled={Boolean(ingredientActionKey)}
                        onClick={() => handleModerateIngredient(ingredient, 'reject')}
                      >
                        {isRejecting ? 'Refus…' : 'Refuser'}
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}

          {!loadingBlockingIngredients && blockingIngredients.length === 0 ? (
            <div className={styles.ingredientModerationReadyBox}>
              <p>Tous les ingrédients nécessaires sont validés.</p>
              <button
                type="button"
                className={styles.ingredientRetryApproveBtn}
                onClick={handleApprove}
              >
                Valider la recette maintenant
              </button>
            </div>
          ) : null}
        </AdminModal>
      )}
    </div>
  );
}

export default AdminDashboard;
