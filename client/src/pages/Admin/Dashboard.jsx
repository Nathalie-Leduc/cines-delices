import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminModal from '../../components/AdminModal';
import Alert from '../../components/Alert/Alert.jsx';
import RecipeCard from '../../components/RecipeCard';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import { buildApiUrl, getApiOrigin } from '../../services/api.js';
import {
  buildCategoryFilters,
  LIMIT_OPTIONS,
  normalizeCategoryLabel,
} from '../../components/RecipeCatalogView/recipeCatalog.shared.js';
import {
  approveAdminIngredient,
  approveAdminRecipe,
  deleteAdminIngredient,
  deleteAdminRecipe,
  getAdminCategories,
  getAdminIngredients,
  getPendingRecipes,
  getValidatedAdminIngredients,
  rejectAdminRecipe,
  updateAdminRecipe,
} from '../../services/adminService.js';
import {
  getMediaSuggestionMeta,
  MEDIA_SUGGESTION_POSTER_FALLBACK,
  normalizeTmdbSearchResult,
} from '../../utils/mediaSearch.js';
import { parseTimeToMinutes } from '../../utils/recipeUtils.js';
import styles from './AdminPages.module.scss';

// ---- Constantes pour la modale d'édition (identiques à Recettes.jsx) ----
const FILM_SEARCH_API = import.meta.env.VITE_TMDB_SEARCH_API
  || import.meta.env.VITE_FILM_SEARCH_API
  || buildApiUrl('/api/tmdb/medias/search');
const INGREDIENT_CREATE_API = import.meta.env.VITE_INGREDIENT_CREATE_API
  || buildApiUrl('/api/ingredients');
const UNITES_OPTIONS = ['g', 'kg', 'ml', 'L', 'cl', 'pièce(s)', 'cuillère(s) à soupe', 'cuillère(s) à café', 'pincée(s)'];

const API_ORIGIN = getApiOrigin();

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
    const apiOrigin = new URL(API_ORIGIN).origin;
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
  // Masquer l'image si elle échoue à charger, sans substituer par une image générique
  event.currentTarget.style.display = 'none';
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
  const [currentLimit, setCurrentLimit] = useState(LIMIT_OPTIONS[0]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [showIngredientModerationModal, setShowIngredientModerationModal] = useState(false);
  const [blockingIngredients, setBlockingIngredients] = useState([]);
  const [loadingBlockingIngredients, setLoadingBlockingIngredients] = useState(false);
  const [ingredientActionKey, setIngredientActionKey] = useState('');
  const [categories, setCategories] = useState([]);
  const [rejectReason, setRejectReason] = useState(`Votre recette n’a pas été validée.\n\nElle ne respecte pas nos règles de publication\n(contenu incohérent ou incomplet).\n\nMerci de modifier votre recette avant de la soumettre à nouveau.`);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteRecipeModal, setShowDeleteRecipeModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);
  const [deleteNotifMessage, setDeleteNotifMessage] = useState('');

  // ---- States pour la modale d'édition locale ----
  // FIX : openEditFromValidation naviguait vers /admin/recettes qui ne charge
  // que les recettes publiées — les PENDING n'y sont jamais trouvées.
  // Solution : ouvrir la modale directement ici, la recette est déjà dans pendingRecipes.
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [editDraft, setEditDraft] = useState({
    id: null, title: '', category: 'Entrée', categoryId: null,
    movieId: null, selectedTmdbMedia: null, movie: '', media: 'F',
    nbPersonnes: '', ingredients: [], tempsPreparation: '',
    tempsCuisson: '', etapes: [''], image: '', imageFile: null,
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
    const loadPendingRecipes = async () => {
      try {
        const [pendingPayload, categoriesPayload] = await Promise.all([
          getPendingRecipes(),
          getAdminCategories().catch(() => []),
        ]);
        setPendingRecipes(Array.isArray(pendingPayload) ? pendingPayload : []);
        setCategories(Array.isArray(categoriesPayload) ? categoriesPayload : categoriesPayload?.data ?? []);
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

  const filters = useMemo(() => (
    buildCategoryFilters(categories).map((filter) => ({
      ...filter,
      count: filter.value === 'Tous' ? pendingRecipes.length : (counters[filter.value] || 0),
    }))
  ), [pendingRecipes.length, counters, categories]);

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
  // Pas de fallback vers des images génériques : on affiche null si absent
  const selectedRecipeHeroFallback = null;
  const selectedRecipeMediaFallback = null;

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

      if (!selectedRecipe?.id) {
        throw new Error('Recette introuvable pour appliquer le refus.');
      }

      const rejectedIngredientName = String(ingredient.name || '').trim() || 'un ingrédient';
      const rejectionReason = `Votre recette n'a pas ete validee car l'ingredient \"${rejectedIngredientName}\" a ete refuse par la moderation. Merci de corriger les ingredients puis de soumettre a nouveau.`;

      await rejectAdminRecipe(selectedRecipe.id, rejectionReason);

      window.dispatchEvent(new CustomEvent('admin-notification-consumed', {
        detail: { recipeId: selectedRecipe.id },
      }));

      setPendingRecipes((previous) => previous.filter((recipe) => recipe.id !== selectedRecipe.id));
      setSelectedRecipe(null);
      setShowValidateModal(false);
      setShowRefuseModal(false);
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

  async function handleDeleteRecipe() {
    if (!recipeToDelete?.id) return;
    setIsDeletingRecipe(true);
    try {
      const message =
        deleteNotifMessage.trim() ||
        `Votre recette "${recipeToDelete.title}" a été supprimée par l'administrateur.`;

      await deleteAdminRecipe(recipeToDelete.id, message);

      // Si on était en vue détail, on revient à la liste
      if (selectedRecipe?.id === recipeToDelete.id) {
        setSelectedRecipe(null);
      }

      setPendingRecipes(prev => prev.filter(r => r.id !== recipeToDelete.id));
      setShowDeleteRecipeModal(false);
      setRecipeToDelete(null);
      setDeleteNotifMessage(''); // reset pour la prochaine ouverture
    } catch (err) {
      setError(err?.message || 'Impossible de supprimer la recette.');
    } finally {
      setIsDeletingRecipe(false);
    }
  }

  function openEditFromValidation(recipe) {
    if (!recipe?.id) return;

    // FIX : au lieu de naviguer vers /admin/recettes (où la recette PENDING
    // n'est pas chargée), on ouvre directement une modale d'édition ici.
    setEditDraft({
      id: recipe.id,
      title: recipe.title || '',
      category: recipe.category || 'Entrée',
      categoryId: recipe.categoryId || null,
      movieId: recipe.movieId || null,
      selectedTmdbMedia: null,
      movie: recipe.movie || '',
      media: recipe.media || 'F',
      nbPersonnes: recipe.nbPersonnes ?? recipe.people ?? '',
      ingredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients.map(item => ({
            ingredientId: item?.ingredientId ?? item?.id ?? null,
            nom: typeof item === 'string' ? item : (item?.name ?? item?.nom ?? ''),
            quantite: typeof item === 'string' ? '' : (item?.quantity ?? item?.quantite ?? ''),
            unite: typeof item === 'string' ? '' : (item?.unit ?? item?.unite ?? ''),
          }))
        : [],
      tempsPreparation: recipe.tempsPreparation ?? recipe.preparationTime ?? '',
      tempsCuisson: recipe.tempsCuisson ?? recipe.cookingTime ?? '',
      etapes: Array.isArray(recipe.etapes) && recipe.etapes.length > 0
        ? recipe.etapes
        : (recipe.instructions?.split('\n') || ['']),
      image: recipe.image || '',
      imageFile: null,
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

  // ---- Handlers du formulaire d'édition (repris de Recettes.jsx) ----

  function handleEditDraftChange(field, value) {
    setEditDraft(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'movie' ? { movieId: null, selectedTmdbMedia: null } : {}),
      ...(field === 'image' ? { imageFile: null } : {}),
    }));
    if (error) setError('');
  }

  async function searchFilms(q) {
    const trimmed = q.trim();
    if (trimmed.length < 2) { setFilmResults([]); setFilmSearchLoading(false); setFilmSearchError(''); return; }
    setFilmSearchLoading(true);
    setFilmSearchError('');
    try {
      const response = await fetch(`${FILM_SEARCH_API}?searchTerm=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const rawList = Array.isArray(payload) ? payload : payload.data || [];
      const normalized = rawList.map(normalizeTmdbSearchResult).filter(item => item.title);
      setFilmResults(normalized.slice(0, 8));
    } catch (err) {
      setFilmResults([]);
      setFilmSearchError(err?.message || "Impossible de rechercher les films/séries.");
    } finally {
      setFilmSearchLoading(false);
    }
  }

  function handleFilmInput(value) {
    handleEditDraftChange('movie', value);
    clearTimeout(filmSearchTimeoutRef.current);
    filmSearchTimeoutRef.current = setTimeout(() => searchFilms(value), 300);
  }

  function selectFilm(film) {
    const normalizedType = String(film?.type || '').toLowerCase();
    setEditDraft(prev => ({
      ...prev,
      selectedTmdbMedia: { id: film.id, title: film.title, type: film.type, poster: film.poster || null },
      movieId: null,
      movie: film.title,
      media: normalizedType === 'movie' ? 'F'
        : (normalizedType === 'tv' || normalizedType === 'series' || normalizedType === 'série') ? 'S'
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
      const payload = await getValidatedAdminIngredients(trimmed);
      const rawList = Array.isArray(payload) ? payload : payload.data || [];
      const normalized = rawList.map(item => ({ id: item.id, name: item.name || item.nom || '' })).filter(item => item.name);
      const exactMatch = normalized.find(item => item.name.trim().toLowerCase() === trimmed.toLowerCase());
      if (exactMatch) { selectIngredient(index, exactMatch); return; }
      setEditIngredientSearchResults(prev => ({ ...prev, [index]: normalized }));
    } catch {
      setEditIngredientSearchResults(prev => ({ ...prev, [index]: [] }));
      setEditIngredientSearchError(prev => ({ ...prev, [index]: "Impossible de rechercher les ingrédients." }));
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
      setEditIngredientSearchError(prev => ({ ...prev, [index]: "Impossible de créer l'ingrédient." }));
    } finally {
      setCreatingIngredient(prev => ({ ...prev, [index]: false }));
    }
  }

  function addIngredient() {
    setEditDraft(prev => ({ ...prev, ingredients: [...prev.ingredients, { ingredientId: null, nom: '', quantite: '', unite: '' }] }));
  }

  function removeIngredient(index) {
    setEditDraft(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));
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

  function handleImageChange(file) {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const allowed = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
      || lowerName.endsWith('.png') || lowerName.endsWith('.jpg')
      || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp');
    if (!allowed) { setEditImageError('Veuillez utiliser une image .png, .jpg, .jpeg ou .webp.'); return; }
    setEditImageError('');
    setEditDraft(prev => ({ ...prev, imageFile: file }));
  }

  function openEditConfirmModal() {
    if (!editDraft.title.trim()) { setError('Le nom de la recette est obligatoire.'); return; }
    setShowEditConfirmModal(true);
  }

  function handleSaveConfirmed() {
    setShowEditConfirmModal(false);
    setError('');
    const cleanIngredients = editDraft.ingredients.filter(ing => String(ing.nom || '').trim() !== '');
    const payload = {
      titre: editDraft.title,
      instructions: editDraft.etapes.filter(Boolean).join('\n'),
      nombrePersonnes: editDraft.nbPersonnes,
      tempsPreparation: parseTimeToMinutes(editDraft.tempsPreparation),
      tempsCuisson: parseTimeToMinutes(editDraft.tempsCuisson),
      categoryId: editDraft.categoryId,
      categoryName: editDraft.category,
      imageUrl: String(editDraft.image || '').trim() || undefined,
      ingredients: cleanIngredients,
      ...(editDraft.selectedTmdbMedia
        ? { tmdbId: editDraft.selectedTmdbMedia.id, mediaTitle: editDraft.movie, mediaType: editDraft.media }
        : editDraft.movieId ? { mediaId: editDraft.movieId } : {}),
    };

    let requestBody = payload;
    if (editDraft.imageFile instanceof File) {
      const formData = new FormData();
      formData.append('titre', payload.titre);
      formData.append('instructions', payload.instructions);
      formData.append('categoryId', String(payload.categoryId || ''));
      formData.append('categoryName', String(payload.categoryName || ''));
      formData.append('ingredients', JSON.stringify(cleanIngredients));
      formData.append('image', editDraft.imageFile);
      if (payload.nombrePersonnes) formData.append('nombrePersonnes', String(payload.nombrePersonnes));
      if (payload.tempsPreparation) formData.append('tempsPreparation', String(payload.tempsPreparation));
      if (payload.tempsCuisson) formData.append('tempsCuisson', String(payload.tempsCuisson));
      if (payload.tmdbId) formData.append('tmdbId', String(payload.tmdbId));
      if (payload.mediaTitle) formData.append('mediaTitle', String(payload.mediaTitle));
      if (payload.mediaType) formData.append('mediaType', String(payload.mediaType));
      if (payload.mediaId) formData.append('mediaId', String(payload.mediaId));
      requestBody = formData;
    }

    updateAdminRecipe(editDraft.id, requestBody)
      .then((updatedRecipe) => {
        // Mettre à jour la recette dans pendingRecipes pour refléter les modifs
        setPendingRecipes(prev => prev.map(r =>
          r.id === updatedRecipe.id
            ? { ...r, ...updatedRecipe, nbPersonnes: updatedRecipe.people, tempsPreparation: updatedRecipe.preparationTime, tempsCuisson: updatedRecipe.cookingTime, etapes: updatedRecipe.instructions?.split('\n') || [] }
            : r
        ));
        // Mettre aussi à jour selectedRecipe si on est sur la vue détail
        if (selectedRecipe?.id === updatedRecipe.id) {
          setSelectedRecipe(prev => ({ ...prev, ...updatedRecipe, nbPersonnes: updatedRecipe.people, tempsPreparation: updatedRecipe.preparationTime, tempsCuisson: updatedRecipe.cookingTime, etapes: updatedRecipe.instructions?.split('\n') || [] }));
        }
        setShowEditModal(false);
      })
      .catch((saveError) => {
        setError(saveError.message || 'Sauvegarde impossible.');
      });
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
                  <span className={styles.recipeSearchFieldIcon} aria-hidden="true" />
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
            <h3>{activeFilter === 'Tous' ? 'Liste des recettes' : `${activeFilter}s`}</h3>
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
              const fallbackImage = null;
              const recipeForCatalogCard = {
                id: recipe.id,
                slug,
                image: primaryImage || null,
                fallbackImage: null,
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
                  <div className={styles.cardActionsExact}>
                    <button
                      type="button"
                      className={`${styles.cardActionButton} ${styles.cardActionDelete}`.trim()}
                      aria-label="Supprimer la recette avant validation"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setRecipeToDelete(recipeecipe);
                        setDeleteNotifMessage(`Votre recette "${recipe.title}" a été supprimée par l'administrateur.`);
                        setShowDeleteRecipeModal(true);
                      }}
                    >
                      <img src="/icon/Trash.svg" alt="" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.cardActionButton} ${styles.cardActionEdit}`.trim()}
                      aria-label="Modifier la recette avant validation"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openEditFromValidation(recipe);
                      }}
                    >
                      <img src="/icon/Edit_duotone_line.svg" alt="" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className={styles.cardNavOverlay}
                    aria-label={`Voir la recette ${recipe.title}`}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
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
              {selectedRecipeHeroImage ? (
                <img
                  src={selectedRecipeHeroImage}
                  alt="Illustration de la recette en attente"
                  onError={handleImageError}
                />
              ) : (
                <div className={styles.heroImagePlaceholder} aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.placeholderIcon}>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </div>
              )}
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
                    {selectedRecipeMediaPoster ? (
                      <img
                        src={selectedRecipeMediaPoster}
                        alt="Média associé"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className={styles.mediaPosterPlaceholder} aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.placeholderIcon}>
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p><strong>{selectedRecipe.movie}</strong></p>
                      {selectedRecipe.year && <p>Année : {selectedRecipe.year}</p>}
                      {selectedRecipe.director && <p>Réalisateur : {selectedRecipe.director}</p>}
                      {selectedRecipe.synopsis
                        ? <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', opacity: 0.8 }}>{selectedRecipe.synopsis}</p>
                        : <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>Synopsis non disponible.</p>
                      }
                    </div>
                  </div>
                </div>

                {/* Recettes similaires supprimées — données hardcodées retirées */}
              </div>
            </div>
          </article>

          <div className={`${styles.actionButtons} ${styles.heroActionButtons}`.trim()}>
            <button
              type="button"
              className={`${styles.btnMuted} ${styles.fullWidthBtn}`.trim()}
              onClick={() => openEditFromValidation(selectedRecipe)}
            >
              Modifier
            </button>
            <button
              type="button"
              className={`${styles.btnDanger} ${styles.fullWidthBtn}`.trim()}
              onClick={() => setShowRefuseModal(true)}
            >
              Refuser
            </button>
            <button
              type="button"
              className={`${styles.btnSuccess} ${styles.fullWidthBtn}`.trim()}
              onClick={() => setShowValidateModal(true)}
            >
              Valider
            </button>
            <button
              type="button"
              className={`${styles.btnDanger} ${styles.fullWidthBtn}`.trim()}
              style={{ opacity: 0.75 }}
              onClick={() => {
                setRecipeToDelete(selectedRecipe);
                setDeleteNotifMessage(`Votre recette "${selectedRecipe.title}" a été supprimée par l'administrateur.`);
                setShowDeleteRecipeModal(true);
              }}
            >
              Supprimer
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
      {showDeleteRecipeModal && (
        <AdminModal
          title="Supprimer la recette"
          confirmLabel={isDeletingRecipe ? 'Suppression...' : 'Supprimer'}
          confirmVariant="danger"
          onCancel={() => {
            if (!isDeletingRecipe) {
              setShowDeleteRecipeModal(false);
              setRecipeToDelete(null);
              setDeleteNotifMessage('');
            }
          }}
          onConfirm={handleDeleteRecipe}
        >
          <p>
            Êtes-vous sûr de vouloir supprimer{' '}
            <strong>&quot;{recipeToDelete?.title}&quot;</strong> ?
          </p>
          <label style={{ display: 'block', marginTop: '1rem' }}>
            <span style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
              Message au membre (optionnel)
            </span>
            <textarea
              className={styles.modalTextarea}
              rows={3}
              value={deleteNotifMessage}
              onChange={(e) => setDeleteNotifMessage(e.target.value)}
              disabled={isDeletingRecipe}
            />
          </label>
        </AdminModal>
      )}

      {/* ---- Modale d'édition locale (FIX : évite la navigation vers /admin/recettes) ---- */}
      {showEditModal && (
        <div className={styles.adminEditOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.adminEditModal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.adminEditTitle}>Modifier la recette</h2>
            <div className={styles.adminEditFields}>

              <label className={styles.adminEditLabel}>
                Titre *
                <input className={styles.adminEditInput} type="text" value={editDraft.title}
                  onChange={e => handleEditDraftChange('title', e.target.value)} />
              </label>

              <label className={styles.adminEditLabel}>
                Catégorie
                <select className={styles.adminEditInput} value={editDraft.categoryId || ''}
                  onChange={e => {
                    const cat = categories.find(c => String(c.id) === e.target.value);
                    setEditDraft(prev => ({ ...prev, categoryId: cat?.id || null, category: cat?.name || cat?.nom || '' }));
                  }}>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name || cat.nom}</option>
                  ))}
                </select>
              </label>

              <label className={styles.adminEditLabel}>
                Film ou série (TMDB)
                <input className={styles.adminEditInput} type="text" value={editDraft.movie}
                  onChange={e => handleFilmInput(e.target.value)} />
              </label>
              {(filmSearchLoading || filmSearchError || filmResults.length > 0) && (
                <div className={styles.adminFilmSearchBox}>
                  {filmSearchLoading && <p className={styles.adminFilmSearchText}>Recherche en cours...</p>}
                  {filmSearchError && <p className={styles.adminEditErrorText}>{filmSearchError}</p>}
                  {filmResults.length > 0 && (
                    <ul className={styles.adminFilmSuggestionList}>
                      {filmResults.map(result => (
                        <li key={result.id || result.title}>
                          <button type="button" className={styles.adminFilmSuggestionBtn} onClick={() => selectFilm(result)}>
                            <img src={result.poster || MEDIA_SUGGESTION_POSTER_FALLBACK} alt="" aria-hidden className={styles.adminFilmSuggestionPoster} />
                            <span>{result.title} — {getMediaSuggestionMeta(result)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <label className={styles.adminEditLabel}>
                Type
                <select className={styles.adminEditInput} value={editDraft.media}
                  onChange={e => handleEditDraftChange('media', e.target.value)}>
                  <option value="F">Film</option>
                  <option value="S">Série</option>
                </select>
              </label>

              <label className={styles.adminEditLabel}>
                Nombre de personnes
                <input className={styles.adminEditInput} type="number" value={editDraft.nbPersonnes}
                  onChange={e => handleEditDraftChange('nbPersonnes', e.target.value)} />
              </label>

              <div className={styles.adminEditLabelBlock}>
                <span className={styles.adminEditLabelTitle}>Ingrédients</span>
                {editDraft.ingredients.map((ing, index) => (
                  <div key={index} className={styles.adminEditIngredientRow}>
                    <input className={styles.adminEditInput} type="text" placeholder="Rechercher un ingrédient..."
                      value={ing.nom} onChange={e => handleIngredientNameInput(index, e.target.value)} />
                    {(editIngredientSearchResults[index]?.length > 0) && (
                      <ul className={styles.adminFilmSuggestionList}>
                        {editIngredientSearchResults[index].map(result => (
                          <li key={result.id || result.name}>
                            <button type="button" className={styles.adminFilmSuggestionBtn}
                              onClick={() => selectIngredient(index, result)}>{result.name}</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!editIngredientSearchLoading[index] && !ing.ingredientId && ing.nom.trim().length >= 2
                      && (!editIngredientSearchResults[index] || editIngredientSearchResults[index].length === 0) && (
                        <button type="button" className={styles.adminCreateIngredientBtn}
                          onClick={() => createIngredient(index)} disabled={creatingIngredient[index]}>
                          {creatingIngredient[index] ? 'Création...' : `Créer l'ingrédient "${ing.nom.trim()}"`}
                        </button>
                      )}
                    <div className={styles.adminEditIngredientBottom}>
                      <input className={`${styles.adminEditInput} ${styles.adminEditQuantiteInput}`} type="number"
                        placeholder="Qté" value={ing.quantite}
                        onChange={e => handleIngredientChange(index, 'quantite', e.target.value)} />
                      <select className={styles.adminEditInput} value={ing.unite}
                        onChange={e => handleIngredientChange(index, 'unite', e.target.value)}>
                        <option value="">Unité</option>
                        {UNITES_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <button type="button" className={styles.adminRemoveSmallBtn}
                        aria-label={`Supprimer l'ingrédient ${index + 1}`}
                        onClick={() => removeIngredient(index)}>−</button>
                    </div>
                  </div>
                ))}
                <button type="button" className={styles.adminAddSmallBtn} onClick={addIngredient}>
                  + Ajouter un ingrédient
                </button>
              </div>

              <label className={styles.adminEditLabel}>
                Temps de préparation
                <input className={styles.adminEditInput} type="text" value={editDraft.tempsPreparation}
                  onChange={e => handleEditDraftChange('tempsPreparation', e.target.value)} />
              </label>

              <label className={styles.adminEditLabel}>
                Temps de cuisson
                <input className={styles.adminEditInput} type="text" value={editDraft.tempsCuisson}
                  onChange={e => handleEditDraftChange('tempsCuisson', e.target.value)} />
              </label>

              <div className={styles.adminEditLabelBlock}>
                <span className={styles.adminEditLabelTitle}>Étapes de préparation</span>
                {editDraft.etapes.map((etape, index) => (
                  <div key={index} className={styles.adminEditEtapeRow}>
                    <span className={styles.adminEditEtapeNumber}>{index + 1}</span>
                    <textarea className={styles.adminEditTextarea} placeholder={`Étape ${index + 1}...`}
                      value={etape} onChange={e => handleEtapeChange(index, e.target.value)} rows={2} />
                    {editDraft.etapes.length > 1 && (
                      <button type="button" className={styles.adminRemoveSmallBtn}
                        onClick={() => removeEtape(index)}>−</button>
                    )}
                  </div>
                ))}
                <button type="button" className={styles.adminAddSmallBtn} onClick={addEtape}>
                  + Ajouter une étape
                </button>
              </div>

              <label className={`${styles.adminEditLabel} ${styles.adminEditLabelMedia}`}>
                Image (.png, .jpg, .jpeg, .webp)
                <input className={styles.adminEditInput} type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={e => handleImageChange(e.target.files?.[0])} />
              </label>

              <label className={`${styles.adminEditLabel} ${styles.adminEditLabelMedia}`}>
                Ou URL image
                <input className={styles.adminEditInput} type="url" value={editDraft.image}
                  onChange={e => handleEditDraftChange('image', e.target.value)} />
              </label>

              {editImageError && <p className={styles.adminEditErrorText}>{editImageError}</p>}
              {error && <p className={styles.adminEditErrorText}>{error}</p>}
            </div>

            <div className={styles.adminModalButtons}>
              <button type="button" className={styles.adminCancelBtn}
                onClick={() => { setShowEditModal(false); setError(''); }}>
                Annuler
              </button>
              <button type="button" className={styles.adminConfirmBtn} onClick={openEditConfirmModal}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditConfirmModal && (
        <div className={`${styles.adminEditOverlay} ${styles.adminConfirmOverlay}`}>
          <div className={styles.adminConfirmModal}>
            <p className={styles.adminModalText}>Voulez-vous confirmer les modifications de cette recette ?</p>
            <div className={styles.adminModalButtons}>
              <button type="button" className={styles.adminCancelBtn}
                onClick={() => setShowEditConfirmModal(false)}>Annuler</button>
              <button type="button" className={styles.adminConfirmBtn}
                onClick={handleSaveConfirmed}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
