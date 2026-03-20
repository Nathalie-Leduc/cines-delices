import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminModal from '../../components/AdminModal';
import { mockRecipes } from '../../data/admin.mock.js';
import styles from './AdminPages.module.scss';

const FILM_SEARCH_API = import.meta.env.VITE_TMDB_SEARCH_API
  || import.meta.env.VITE_FILM_SEARCH_API
  || 'http://localhost:3000/api/tmdb/medias/search';
const INGREDIENT_SEARCH_API = import.meta.env.VITE_INGREDIENT_SEARCH_API
  || 'http://localhost:3000/api/ingredients/search';
const INGREDIENT_CREATE_API = import.meta.env.VITE_INGREDIENT_CREATE_API
  || 'http://localhost:3000/api/ingredients';
const UNITES_OPTIONS = ['g', 'kg', 'ml', 'L', 'cl', 'pièce(s)', 'cuillère(s) à soupe', 'cuillère(s) à café', 'pincée(s)'];

function toSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function badgeClass(category) {
  const key = category.toLowerCase();
  if (key === 'entrée') return styles.badgeEntree;
  if (key === 'plat') return styles.badgePlat;
  if (key === 'dessert') return styles.badgeDessert;
  return styles.badgeBoisson;
}

function countClass(label) {
  const key = label.toLowerCase();
  if (key === 'entrée') return styles.countEntree;
  if (key === 'plat') return styles.countPlat;
  if (key === 'dessert') return styles.countDessert;
  if (key === 'boisson') return styles.countBoisson;
  return '';
}

function AdminRecettes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Entrée');
  const [modalState, setModalState] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDraft, setEditDraft] = useState({
    id: null,
    title: '',
    category: 'Entrée',
    movieId: null,
    movie: '',
    media: 'F',
    nbPersonnes: '',
    ingredients: [{ ingredientId: null, nom: '', quantite: '', unite: '' }],
    tempsPreparation: '',
    tempsCuisson: '',
    etapes: [''],
    image: '',
  });
  const [filmResults, setFilmResults] = useState([]);
  const [filmSearchLoading, setFilmSearchLoading] = useState(false);
  const [filmSearchError, setFilmSearchError] = useState('');
  const [editIngredientSearchResults, setEditIngredientSearchResults] = useState({});
  const [editIngredientSearchLoading, setEditIngredientSearchLoading] = useState({});
  const [editIngredientSearchError, setEditIngredientSearchError] = useState({});
  const [creatingIngredient, setCreatingIngredient] = useState({});
  const [editImageError, setEditImageError] = useState('');
  const filmSearchTimeoutRef = useRef(null);
  const ingredientSearchTimeouts = useRef({});

  useEffect(() => {
    // Using mock data for testing
    setRecipes(mockRecipes);
    setIsLoading(false);
  }, []);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((item) => {
      const matchesFilter = activeFilter === 'Tous' || item.category === activeFilter;
      const matchesQuery = item.title.toLowerCase().includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [recipes, query, activeFilter]);

  const filters = useMemo(() => {
    const counts = recipes.reduce((accumulator, item) => {
      const key = item.category || 'Autre';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return [
      { label: 'Tous', count: recipes.length },
      { label: 'Entrée', count: counts['Entrée'] || 0 },
      { label: 'Plat', count: counts.Plat || 0 },
      { label: 'Dessert', count: counts.Dessert || 0 },
      { label: 'Boisson', count: counts.Boisson || 0 },
    ];
  }, [recipes]);

  async function handleDeleteRecipe() {
    if (!modalState?.recipeId) {
      return;
    }

    try {
      // Mock deletion for testing
      setRecipes((previous) => previous.filter((recipe) => recipe.id !== modalState.recipeId));
      setModalState(null);
    } catch (deleteError) {
      setError(deleteError.message || 'Suppression impossible.');
    }
  }

  function openEditModal(recipe) {
    setEditDraft({
      id: recipe.id,
      title: recipe.title || '',
      category: recipe.category || 'Entrée',
      movieId: recipe.movieId || null,
      movie: recipe.movie || '',
      media: recipe.media || 'F',
      nbPersonnes: recipe.nbPersonnes || '',
      ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
        ? recipe.ingredients.map(item => ({
            ingredientId: item?.ingredientId || null,
            nom: typeof item === 'string' ? item : (item?.nom || ''),
            quantite: typeof item === 'string' ? '' : (item?.quantite || ''),
            unite: typeof item === 'string' ? '' : (item?.unite || ''),
          }))
        : [{ ingredientId: null, nom: '', quantite: '', unite: '' }],
      tempsPreparation: recipe.tempsPreparation || '',
      tempsCuisson: recipe.tempsCuisson || '',
      etapes: Array.isArray(recipe.etapes) && recipe.etapes.length > 0 ? recipe.etapes : [''],
      image: recipe.image || '',
    });
    setFilmResults([]);
    setFilmSearchError('');
    setEditImageError('');
    setEditIngredientSearchResults({});
    setEditIngredientSearchLoading({});
    setEditIngredientSearchError({});
    setCreatingIngredient({});
    setShowEditModal(true);
  }

  function handleDraftChange(field, value) {
    setEditDraft(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'movie' ? { movieId: null } : {}),
    }));
    if (error) setError('');
  }

  async function searchFilms(q) {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setFilmResults([]);
      setFilmSearchLoading(false);
      setFilmSearchError('');
      return;
    }
    setFilmSearchLoading(true);
    setFilmSearchError('');
    try {
      const response = await fetch(`${FILM_SEARCH_API}?searchTerm=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        let payload = null;
        try { payload = await response.json(); } catch { payload = null; }
        throw new Error(payload?.message || `HTTP ${response.status}`);
      }
      const payload = await response.json();
      const rawList = Array.isArray(payload) ? payload : payload.data || [];
      const normalized = rawList.map(item => ({
        id: item.id,
        title: item.title || item.titre || item.name || item.nom || '',
        type: item.type || item.mediaType || item.media_type || '',
      })).filter(item => item.title);
      setFilmResults(normalized.slice(0, 8));
    } catch (err) {
      setFilmResults([]);
      setFilmSearchError(err?.message || "Impossible de rechercher les films/séries pour l'instant.");
    } finally {
      setFilmSearchLoading(false);
    }
  }

  function handleFilmInput(value) {
    handleDraftChange('movie', value);
    clearTimeout(filmSearchTimeoutRef.current);
    filmSearchTimeoutRef.current = setTimeout(() => searchFilms(value), 300);
  }

  function selectFilm(film) {
    const normalizedType = String(film?.type || '').toLowerCase();
    setEditDraft(prev => ({
      ...prev,
      movieId: film.id || null,
      movie: film.title,
      media: normalizedType === 'movie'
        ? 'F'
        : (normalizedType === 'tv' || normalizedType === 'series' || normalizedType === 'serie' || normalizedType === 'série')
          ? 'S'
          : prev.media,
    }));
    setFilmResults([]);
  }

  function clearIngredientSearchState(index) {
    setEditIngredientSearchResults(prev => ({ ...prev, [index]: [] }));
    setEditIngredientSearchLoading(prev => ({ ...prev, [index]: false }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));
  }

  async function searchIngredients(index, q) {
    const trimmed = q.trim();
    if (trimmed.length < 2) { clearIngredientSearchState(index); return; }
    setEditIngredientSearchLoading(prev => ({ ...prev, [index]: true }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));
    try {
      const response = await fetch(`${INGREDIENT_SEARCH_API}?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const rawList = Array.isArray(payload) ? payload : payload.data || [];
      const normalized = rawList
        .map(item => ({ id: item.id, name: item.name || item.nom || '' }))
        .filter(item => item.name);
      const normalizedQuery = trimmed.toLowerCase();
      const exactMatch = normalized.find(item => item.name.trim().toLowerCase() === normalizedQuery);
      if (exactMatch) { selectIngredient(index, exactMatch); return; }
      setEditIngredientSearchResults(prev => ({ ...prev, [index]: normalized }));
    } catch {
      setEditIngredientSearchResults(prev => ({ ...prev, [index]: [] }));
      setEditIngredientSearchError(prev => ({
        ...prev,
        [index]: "Impossible de rechercher les ingrédients pour l'instant.",
      }));
    } finally {
      setEditIngredientSearchLoading(prev => ({ ...prev, [index]: false }));
    }
  }

  function handleIngredientChange(index, field, value) {
    const updated = [...editDraft.ingredients];
    updated[index][field] = value;
    if (field === 'nom') updated[index].ingredientId = null;
    setEditDraft(prev => ({ ...prev, ingredients: updated }));
  }

  function handleIngredientNameInput(index, value) {
    handleIngredientChange(index, 'nom', value);
    clearTimeout(ingredientSearchTimeouts.current[index]);
    ingredientSearchTimeouts.current[index] = setTimeout(() => searchIngredients(index, value), 300);
  }

  function selectIngredient(index, ingredient) {
    const updated = [...editDraft.ingredients];
    updated[index].ingredientId = ingredient.id || null;
    updated[index].nom = ingredient.name;
    setEditDraft(prev => ({ ...prev, ingredients: updated }));
    clearIngredientSearchState(index);
  }

  async function createIngredient(index) {
    const name = editDraft.ingredients[index]?.nom?.trim();
    if (!name) return;
    setCreatingIngredient(prev => ({ ...prev, [index]: true }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));
    try {
      const response = await fetch(INGREDIENT_CREATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const created = await response.json();
      selectIngredient(index, { id: created.id, name: created.name || created.nom || name });
    } catch {
      setEditIngredientSearchError(prev => ({
        ...prev,
        [index]: "Impossible de créer l'ingrédient pour l'instant.",
      }));
    } finally {
      setCreatingIngredient(prev => ({ ...prev, [index]: false }));
    }
  }

  function addIngredient() {
    setEditDraft(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: null, nom: '', quantite: '', unite: '' }],
    }));
  }

  function removeIngredient(index) {
    setEditDraft(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
    clearIngredientSearchState(index);
  }

  function handleEtapeChange(index, value) {
    const updated = [...editDraft.etapes];
    updated[index] = value;
    setEditDraft(prev => ({ ...prev, etapes: updated }));
  }

  function addEtape() {
    setEditDraft(prev => ({ ...prev, etapes: [...prev.etapes, ''] }));
  }

  function removeEtape(index) {
    setEditDraft(prev => ({ ...prev, etapes: prev.etapes.filter((_, i) => i !== index) }));
  }

  function isPngFile(file) {
    return Boolean(file) && (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png'));
  }

  function handleImageChange(file) {
    if (!file) return;
    if (!isPngFile(file)) {
      setEditImageError('Veuillez utiliser une image .png.');
      return;
    }
    setEditImageError('');
    setEditDraft(prev => ({ ...prev, image: URL.createObjectURL(file) }));
  }

  function openEditConfirmModal() {
    if (!editDraft.title.trim()) {
      setError('Le nom de la recette est obligatoire.');
      return;
    }
    setShowEditConfirmModal(true);
  }

  function handleSaveConfirmed() {
    const computedTime = [editDraft.tempsPreparation, editDraft.tempsCuisson]
      .filter(Boolean)
      .join(' + ')
      .trim();
    setRecipes(prev => prev.map(recipe =>
      recipe.id === editDraft.id
        ? {
            ...recipe,
            title: editDraft.title,
            category: editDraft.category,
            movieId: editDraft.movieId,
            movie: editDraft.movie,
            media: editDraft.media,
            nbPersonnes: editDraft.nbPersonnes,
            ingredients: editDraft.ingredients,
            tempsPreparation: editDraft.tempsPreparation,
            tempsCuisson: editDraft.tempsCuisson,
            duration: computedTime || recipe.duration,
            etapes: editDraft.etapes,
            image: editDraft.image || recipe.image,
          }
        : recipe,
    ));
    setShowEditModal(false);
    setShowEditConfirmModal(false);
    setError('');
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerLine}>
        <h2>Gérer les recettes</h2>
      </div>

      <section className={styles.recipesPanelFrame}>
        <div className={styles.recipeSearchRow}>
          <input
            className={styles.recipeSearchInput}
            type="text"
            placeholder="Entrer son nom"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <img src="/icon/Search.svg" alt="" aria-hidden="true" />
        </div>

        <div className={styles.recipeFiltersRow}>
          {filters.map((filter) => (
            <div key={filter.label} className={styles.filterGroup}>
              <span className={`${styles.count} ${countClass(filter.label)}`}>{filter.count}</span>
              <button
                type="button"
                className={`${styles.recipePill} ${activeFilter === filter.label ? styles.recipePillActive : ''}`.trim()}
                onClick={() => setActiveFilter(filter.label)}
              >
                {filter.label}
              </button>
            </div>
          ))}
        </div>

        <div className={styles.sectionTitle}>
          <h3>{activeFilter === 'Tous' ? 'Recettes' : `${activeFilter}s`}</h3>
        </div>

        {isLoading ? <p>Chargement des recettes…</p> : null}
        {error ? <p>{error}</p> : null}

        <div className={styles.recipesGridExact}>
          {filteredRecipes.map((recipe) => (
            <article key={recipe.id} className={styles.recipeCardExact}>
              <div className={styles.cardImageExact}>
                <img src={recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200'} alt="Illustration de la recette" />

                <div className={styles.cardActionsExact}>
                  <button
                    type="button"
                    aria-label="Voir la recette"
                    onClick={() => {
                      const slug = recipe.slug || toSlug(recipe.title);
                      if (!slug) {
                        return;
                      }

                      navigate(`/recipes/${slug}`);
                    }}
                  >
                    <img src="/icon/Eye.svg" alt="" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Modifier la recette"
                    onClick={() => openEditModal(recipe)}
                  >
                    <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Supprimer la recette"
                    onClick={() => setModalState({ type: 'delete', recipeId: recipe.id, recipeTitle: recipe.title })}
                  >
                    <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
                  </button>
                </div>

                <span className={`${styles.categoryBadgeExact} ${badgeClass(recipe.category)}`.trim()}>
                  {recipe.category}
                </span>
              </div>

              <div className={styles.cardBodyExact}>
                <h4 className={styles.cardTitleExact}>{recipe.title}</h4>
                <div className={styles.cardMetaExact}>
                  <div className={styles.cardMetaLine}>
                    <span className={styles.metaInlineExact}>
                      <img src="/icon/Movie.svg" alt="" aria-hidden="true" />
                      <span>{recipe.movie || 'Film non renseigne'}</span>
                    </span>
                  </div>
                  <div className={styles.cardMetaLineBetween}>
                    <span className={styles.metaInlineExact}>
                      <img src="/icon/Time.svg" alt="" aria-hidden="true" />
                      {recipe.duration || 'Duree non renseignee'}
                    </span>
                    <span className={styles.mediaTagExact}>{recipe.media || 'F'}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {modalState?.type === 'delete' && (
        <AdminModal
          confirmLabel="valider"
          onCancel={() => setModalState(null)}
          onConfirm={handleDeleteRecipe}
        >
          Êtes-vous sûr de vouloir supprimer cette recette ?
        </AdminModal>
      )}

      {showEditModal && (
        <div className={styles.adminEditOverlay}>
          <div className={styles.adminEditModal}>
            <h2 className={styles.adminEditTitle}>Modifier la recette</h2>

            <div className={styles.adminEditFields}>
              <label className={styles.adminEditLabel}>
                Titre
                <input
                  className={styles.adminEditInput}
                  type="text"
                  value={editDraft.title}
                  onChange={e => handleDraftChange('title', e.target.value)}
                />
              </label>

              <label className={styles.adminEditLabel}>
                Catégorie
                <select
                  className={styles.adminEditInput}
                  value={editDraft.category}
                  onChange={e => handleDraftChange('category', e.target.value)}
                >
                  <option value="Entrée">Entrée</option>
                  <option value="Plat">Plat</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Boisson">Boisson</option>
                </select>
              </label>

              <label className={styles.adminEditLabel}>
                Film ou série
                <input
                  className={styles.adminEditInput}
                  type="text"
                  value={editDraft.movie}
                  onChange={e => handleFilmInput(e.target.value)}
                />
              </label>

              {(filmSearchLoading || filmSearchError || filmResults.length > 0) && (
                <div className={styles.adminFilmSearchBox}>
                  {filmSearchLoading && (
                    <p className={styles.adminFilmSearchText}>Recherche en cours...</p>
                  )}
                  {filmSearchError && (
                    <p className={styles.adminFilmSearchError}>{filmSearchError}</p>
                  )}
                  {filmResults.length > 0 && (
                    <ul className={styles.adminFilmSuggestionList}>
                      {filmResults.map(result => (
                        <li key={result.id || result.title}>
                          <button
                            type="button"
                            className={styles.adminFilmSuggestionBtn}
                            onClick={() => selectFilm(result)}
                          >
                            {result.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <label className={styles.adminEditLabel}>
                Type
                <select
                  className={styles.adminEditInput}
                  value={editDraft.media}
                  onChange={e => handleDraftChange('media', e.target.value)}
                >
                  <option value="F">Film</option>
                  <option value="S">Série</option>
                </select>
              </label>

              <label className={styles.adminEditLabel}>
                Nombre de personnes
                <input
                  className={styles.adminEditInput}
                  type="number"
                  value={editDraft.nbPersonnes}
                  onChange={e => handleDraftChange('nbPersonnes', e.target.value)}
                />
              </label>

              <div className={styles.adminEditLabelBlock}>
                <span className={styles.adminEditLabelTitle}>Ingrédients</span>
                {editDraft.ingredients.map((ing, index) => (
                  <div key={index} className={styles.adminEditIngredientRow}>
                    <input
                      className={styles.adminEditInput}
                      type="text"
                      placeholder="Rechercher un ingrédient..."
                      value={ing.nom}
                      onChange={e => handleIngredientNameInput(index, e.target.value)}
                    />
                    {(editIngredientSearchLoading[index]
                      || (editIngredientSearchResults[index] && editIngredientSearchResults[index].length > 0)
                      || editIngredientSearchError[index]
                      || (!ing.ingredientId && ing.nom.trim().length >= 2
                        && !editIngredientSearchLoading[index]
                        && (!editIngredientSearchResults[index] || editIngredientSearchResults[index].length === 0))) && (
                      <div className={styles.adminFilmSearchBox}>
                        {editIngredientSearchLoading[index] && (
                          <p className={styles.adminFilmSearchText}>Recherche en cours...</p>
                        )}
                        {editIngredientSearchError[index] && (
                          <p className={styles.adminFilmSearchError}>{editIngredientSearchError[index]}</p>
                        )}
                        {editIngredientSearchResults[index] && editIngredientSearchResults[index].length > 0 && (
                          <ul className={styles.adminFilmSuggestionList}>
                            {editIngredientSearchResults[index].map(result => (
                              <li key={result.id || result.name}>
                                <button
                                  type="button"
                                  className={styles.adminFilmSuggestionBtn}
                                  onClick={() => selectIngredient(index, result)}
                                >
                                  {result.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {!editIngredientSearchLoading[index]
                          && !editIngredientSearchError[index]
                          && !ing.ingredientId
                          && ing.nom.trim().length >= 2
                          && (!editIngredientSearchResults[index] || editIngredientSearchResults[index].length === 0) && (
                            <button
                              type="button"
                              className={styles.adminCreateIngredientBtn}
                              onClick={() => createIngredient(index)}
                              disabled={creatingIngredient[index]}
                            >
                              {creatingIngredient[index]
                                ? 'Création...'
                                : `Créer l'ingrédient "${ing.nom.trim()}"`}
                            </button>
                          )}
                      </div>
                    )}
                    <div className={styles.adminEditIngredientBottom}>
                      <input
                        className={`${styles.adminEditInput} ${styles.adminEditQuantiteInput}`}
                        type="number"
                        placeholder="Qté"
                        value={ing.quantite}
                        onChange={e => handleIngredientChange(index, 'quantite', e.target.value)}
                      />
                      <select
                        className={styles.adminEditInput}
                        value={ing.unite}
                        onChange={e => handleIngredientChange(index, 'unite', e.target.value)}
                      >
                        <option value="">Unité</option>
                        {UNITES_OPTIONS.map(unite => (
                          <option key={unite} value={unite}>{unite}</option>
                        ))}
                      </select>
                      {editDraft.ingredients.length > 1 && (
                        <button
                          type="button"
                          className={styles.adminRemoveSmallBtn}
                          onClick={() => removeIngredient(index)}
                        >
                          −
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.adminAddSmallBtn}
                  onClick={addIngredient}
                >
                  + Ajouter un ingrédient
                </button>
              </div>

              <label className={styles.adminEditLabel}>
                Temps de préparation
                <input
                  className={styles.adminEditInput}
                  type="text"
                  value={editDraft.tempsPreparation}
                  onChange={e => handleDraftChange('tempsPreparation', e.target.value)}
                />
              </label>

              <label className={styles.adminEditLabel}>
                Temps de cuisson
                <input
                  className={styles.adminEditInput}
                  type="text"
                  value={editDraft.tempsCuisson}
                  onChange={e => handleDraftChange('tempsCuisson', e.target.value)}
                />
              </label>

              <div className={styles.adminEditLabelBlock}>
                <span className={styles.adminEditLabelTitle}>Étapes de préparation</span>
                {editDraft.etapes.map((etape, index) => (
                  <div key={index} className={styles.adminEditEtapeRow}>
                    <span className={styles.adminEditEtapeNumber}>{index + 1}</span>
                    <textarea
                      className={styles.adminEditTextarea}
                      placeholder={`Étape ${index + 1}...`}
                      value={etape}
                      onChange={e => handleEtapeChange(index, e.target.value)}
                      rows={2}
                    />
                    {editDraft.etapes.length > 1 && (
                      <button
                        type="button"
                        className={styles.adminRemoveSmallBtn}
                        onClick={() => removeEtape(index)}
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.adminAddSmallBtn}
                  onClick={addEtape}
                >
                  + Ajouter une étape
                </button>
              </div>

              <label className={styles.adminEditLabel}>
                Image (.png)
                <input
                  className={styles.adminEditInput}
                  type="file"
                  accept=".png,image/png"
                  onChange={e => handleImageChange(e.target.files?.[0])}
                />
              </label>

              <label className={styles.adminEditLabel}>
                Ou URL image
                <input
                  className={styles.adminEditInput}
                  type="url"
                  value={editDraft.image}
                  onChange={e => handleDraftChange('image', e.target.value)}
                />
              </label>

              {editImageError && <p className={styles.adminEditErrorText}>{editImageError}</p>}
              {error && <p className={styles.adminEditErrorText}>{error}</p>}
            </div>

            <div className={styles.adminModalButtons}>
              <button
                type="button"
                className={styles.adminCancelBtn}
                onClick={() => { setShowEditModal(false); setError(''); }}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.adminConfirmBtn}
                onClick={openEditConfirmModal}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditConfirmModal && (
        <div className={`${styles.adminEditOverlay} ${styles.adminConfirmOverlay}`}>
          <div className={styles.adminConfirmModal}>
            <p className={styles.adminModalText}>
              Voulez-vous confirmer les modifications de cette recette ?
            </p>
            <div className={styles.adminModalButtons}>
              <button
                type="button"
                className={styles.adminCancelBtn}
                onClick={() => setShowEditConfirmModal(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.adminConfirmBtn}
                onClick={handleSaveConfirmed}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRecettes;