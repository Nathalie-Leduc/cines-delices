import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../../components/AdminModal';
import RecipeCard from '../../components/RecipeCard';
import { approveAdminRecipe, getPendingRecipes, rejectAdminRecipe } from '../../services/adminService.js';
import styles from './AdminPages.module.scss';

function getDurationMinutes(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return duration;
  }
  const parsed = parseInt(String(duration || '').replace(/[^\d]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function AdminDashboard() {
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [rejectReason, setRejectReason] = useState(`Votre recette n’a pas été validée.\n\nElle ne respecte pas nos règles de publication\n(contenu incohérent ou incomplet).\n\nMerci de modifier votre recette avant de la soumettre à nouveau.`);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPendingRecipes = async () => {
      try {
        const payload = await getPendingRecipes();
        setPendingRecipes(Array.isArray(payload) ? payload : []);
      } catch (loadError) {
        setError(loadError.message || 'Impossible de charger les recettes à valider.');
      }
    };

    loadPendingRecipes();
  }, []);

  const counters = useMemo(() => {
    return pendingRecipes.reduce((accumulator, recipe) => {
      const key = recipe.category || 'Autre';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
  }, [pendingRecipes]);

  const filteredPendingRecipes = useMemo(() => {
    if (activeFilter === 'Tous') {
      return pendingRecipes;
    }

    return pendingRecipes.filter((recipe) => recipe.category === activeFilter);
  }, [pendingRecipes, activeFilter]);

  const filters = useMemo(() => ([
    { label: 'Tous', count: pendingRecipes.length, countClass: '' },
    { label: 'Entrée', count: counters['Entrée'] || 0, countClass: styles.countEntree },
    { label: 'Plat', count: counters.Plat || 0, countClass: styles.countPlat },
    { label: 'Dessert', count: counters.Dessert || 0, countClass: styles.countDessert },
    { label: 'Boisson', count: counters.Boisson || 0, countClass: styles.countBoisson },
  ]), [pendingRecipes.length, counters]);

  async function handleApprove() {
    if (!selectedRecipe) {
      return;
    }

    try {
      await approveAdminRecipe(selectedRecipe.id);
      setPendingRecipes((previous) => previous.filter((recipe) => recipe.id !== selectedRecipe.id));
      setSelectedRecipe(null);
      setShowValidateModal(false);
    } catch (approveError) {
      setError(approveError.message || 'Validation impossible.');
    }
  }

  async function handleReject() {
    if (!selectedRecipe) {
      return;
    }

    try {
      await rejectAdminRecipe(selectedRecipe.id, rejectReason);
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
          <p style={{ marginBottom: '0.9rem', color: 'rgba(246, 241, 232, 0.86)' }}>
            Vous avez <strong style={{ color: '#c9a45c' }}>{pendingRecipes.length}</strong> recettes à valider
          </p>

          <div className={styles.filterCountRow}>
            {filters.map((filter) => (
              <div key={filter.label} className={`${styles.filterGroup} ${styles.filterGroupVertical}`.trim()}>
                <span className={`${styles.count} ${filter.countClass}`.trim()}>{filter.count}</span>
                <button
                  type="button"
                  className={`${styles.pill} ${activeFilter === filter.label ? styles.pillActive : ''}`.trim()}
                  onClick={() => setActiveFilter(filter.label)}
                >
                  {filter.label}
                </button>
              </div>
            ))}
          </div>

          {error ? <p>{error}</p> : null}

          <div className={styles.sectionTitle}>
            <h3>{activeFilter === 'Tous' ? 'Toutes les recettes' : `${activeFilter}s`}</h3>
          </div>

          <div className={styles.recipesGridExact}>
            {filteredPendingRecipes.map((recipe) => {
              const slug = recipe.slug || String(recipe.id);
              const recipeForCatalogCard = {
                id: recipe.id,
                slug,
                image: recipe.image || '/img/placeholder.jpg',
                title: recipe.title,
                category: recipe.category,
                mediaTitle: recipe.movie || 'Film non renseigné',
                mediaType: recipe.media === 'S' ? 'serie' : 'film',
                duration: getDurationMinutes(recipe.duration),
              };

              return (
                <div key={recipe.id} className={styles.adminRecipeCardWrap}>
                  <RecipeCard recipe={recipeForCatalogCard} />
                  <button
                    type="button"
                    className={styles.cardNavOverlay}
                    aria-label={`Voir la recette ${recipe.title}`}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                  <div className={styles.cardActionsExact}>
                    <button
                      type="button"
                      aria-label="Voir la recette"
                      onClick={(event) => { event.preventDefault(); event.stopPropagation(); setSelectedRecipe(recipe); }}
                    >
                      <img src="/icon/Eye.svg" alt="" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedRecipe && (
        <>
          <article className={styles.heroRecipe}>
            <div className={styles.heroImage}>
              <img src={selectedRecipe.image} alt="Illustration de la recette en attente" />
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
                    <img src={selectedRecipe.image} alt="Média associé" />
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

          <div className={styles.actionButtons} style={{ marginTop: '0.9rem' }}>
            <button type="button" className={`${styles.btnMuted} ${styles.fullWidthBtn}`.trim()} onClick={() => setShowRefuseModal(true)}>
              Refuser
            </button>
            <button type="button" className={`${styles.btnDanger} ${styles.fullWidthBtn}`.trim()} onClick={() => setShowValidateModal(true)}>
              Valider
            </button>
          </div>
        </>
      )}

      {showValidateModal && (
        <AdminModal onCancel={() => setShowValidateModal(false)} onConfirm={handleApprove}>
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
    </div>
  );
}

export default AdminDashboard;