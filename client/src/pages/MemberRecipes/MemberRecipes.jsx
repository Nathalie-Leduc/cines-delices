import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './MemberRecipes.module.scss';
import { buildApiUrl } from '../../services/api.js';
import {
  deleteMyNotification,
  deleteMyRecipe,
  getMyNotifications,
  getMyRecipes,
  updateMyRecipe,
} from '../../services/recipesService';
import RecipeCard from '../../components/RecipeCard';
import Alert from '../../components/Alert/Alert.jsx';
import StatusBlock from '../../components/StatusBlock/StatusBlock.jsx';
import {
  getMediaSuggestionMeta,
  MEDIA_SUGGESTION_POSTER_FALLBACK,
  normalizeTmdbSearchResult,
} from '../../utils/mediaSearch.js';
import { buildCategoryFilters, LIMIT_OPTIONS } from '../../components/RecipeCatalogView/recipeCatalog.shared.js';
const FILM_SEARCH_API = import.meta.env.VITE_TMDB_SEARCH_API
  || import.meta.env.VITE_FILM_SEARCH_API
  || buildApiUrl('/api/tmdb/medias/search');
const INGREDIENT_SEARCH_API = import.meta.env.VITE_INGREDIENT_SEARCH_API
  || import.meta.env.VITE_INGREDIENT_SEARCH_API_URL
  || buildApiUrl('/api/ingredients/search');
const INGREDIENT_CREATE_API = import.meta.env.VITE_INGREDIENT_CREATE_API
  || (import.meta.env.VITE_INGREDIENT_SEARCH_API_URL
    ? import.meta.env.VITE_INGREDIENT_SEARCH_API_URL.replace(/\/search$/, '')
    : '')
  || buildApiUrl('/api/ingredients');
const CATEGORIES_API = buildApiUrl('/api/categories');
const CONTACT_PREVIEW_LIMIT = 110;
const unitesOptions = ['g', 'kg', 'ml', 'L', 'cl', 'pièce(s)', 'cuillère(s) à soupe', 'cuillère(s) à café', 'pincée(s)'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// ✅ CORRECTIF TEMPS — remplace parseOptionalPositiveInteger pour les temps.
// Comprend tous les formats courants et les convertit en minutes (entier).
// Exemples : "70" → 70, "30min" → 30, "1h" → 60, "1h10" → 70, "1:10" → 70
// Analogie : un assistant qui comprend toutes les façons de dire un temps
// et répond toujours en minutes pour la BDD.
function parseTimeToMinutes(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const str = String(value).trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
  // "1h10", "1h10min", "1h"
  const hMatch = str.match(/^(\d+(?:\.\d+)?)h(?:(\d+)(?:min)?)?$/);
  if (hMatch) {
    const total = Math.round(parseFloat(hMatch[1]) * 60 + parseInt(hMatch[2] || '0', 10));
    return total > 0 ? total : undefined;
  }
  // "1:10"
  const colonMatch = str.match(/^(\d+):(\d+)(?::\d+)?$/);
  if (colonMatch) {
    const total = parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
    return total > 0 ? total : undefined;
  }
  // "30min", "30m", "30"
  const minMatch = str.match(/^(\d+(?:\.\d+)?)(?:min|m)?$/);
  if (minMatch) {
    const parsed = Math.round(parseFloat(minMatch[1]));
    return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
  }
  return undefined;
}

// Reste utilisé pour nbPersonnes uniquement
function parseOptionalPositiveInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function formatApiError(error, fallbackMessage) {
  const details = Array.isArray(error?.data?.details)
    ? error.data.details.filter(Boolean).join(' ')
    : '';

  return details || error?.message || fallbackMessage;
}

function getNotificationVariantClassName(message) {
  const normalizedMessage = String(message || '').toLowerCase();

  const hasRejectedSignal =
    normalizedMessage.includes('a ete refusee')
    || normalizedMessage.includes('a été refusée')
    || normalizedMessage.includes('a ete refuse')
    || normalizedMessage.includes('a été refusé')
    || normalizedMessage.includes('refusee')
    || normalizedMessage.includes('refusée')
    || normalizedMessage.includes('refuse')
    || normalizedMessage.includes('refusé')
    || normalizedMessage.includes("n'a pas ete validee")
    || normalizedMessage.includes("n'a pas été validée")
    || normalizedMessage.includes('pas ete validee')
    || normalizedMessage.includes('pas été validée');

  if (hasRejectedSignal) {
    return 'rejected';
  }

  if (
    normalizedMessage.includes('a ete validee')
    || normalizedMessage.includes('a été validée')
    || normalizedMessage.includes('validee')
    || normalizedMessage.includes('validée')
    || normalizedMessage.includes('valide')
    || normalizedMessage.includes('validé')
  ) {
    return 'approved';
  }

  return '';
}

function extractRecipeTitleFromNotificationMessage(message) {
  const normalizedMessage = String(message || '');
  const quotedTitleMatch = normalizedMessage.match(/recette\s+"([^"]+)"/i);
  return quotedTitleMatch?.[1]?.trim() || '';
}

function isContactNotification(message) {
  const normalizedMessage = String(message || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return /formulaire\s+de\s+contact/.test(normalizedMessage);
}

function buildContactNotificationPreview(message) {
  const normalizedMessage = String(message || '').replace(/\s+/g, ' ').trim();

  if (normalizedMessage.length <= CONTACT_PREVIEW_LIMIT) {
    return normalizedMessage;
  }

  return `${normalizedMessage.slice(0, CONTACT_PREVIEW_LIMIT)}...`;
}

function normalizeCategoryLabel(value) {
  const source = String(value || '').trim().toLowerCase();

  if (!source) {
    return 'Autre';
  }

  if (source === 'entree' || source === 'entrée') {
    return 'Entrée';
  }

  if (source === 'plat') {
    return 'Plat';
  }

  if (source === 'dessert') {
    return 'Dessert';
  }

  if (source === 'boisson') {
    return 'Boisson';
  }

  return source.charAt(0).toUpperCase() + source.slice(1);
}

function normalizeRecipe(rawRecipe) {
  const minutesPreparation = Number(rawRecipe?.tempsPreparation);
  const minutesCuisson = Number(rawRecipe?.tempsCuisson);
  const totalMinutes = [minutesPreparation, minutesCuisson]
    .filter(Number.isFinite)
    .reduce((sum, value) => sum + value, 0);

  const categoryLabel = normalizeCategoryLabel(rawRecipe?.categorie || rawRecipe?.category?.nom || rawRecipe?.category);
  const mediaType = String(rawRecipe?.type || rawRecipe?.media?.type || '').toLowerCase();
  const normalizedIngredients = (rawRecipe?.ingredients || []).map(item => ({
    ingredientId: item?.ingredientId || item?.ingredient?.id || null,
    nom: item?.nom || item?.ingredient?.nom || item?.name || '',
    quantite: item?.quantite || item?.quantity || '',
    unite: item?.unite || item?.unit || '',
  }));

  return {
    ...rawRecipe,
    titre: rawRecipe?.titre || rawRecipe?.title || 'Recette sans titre',
    categorie: categoryLabel,
    filmId: rawRecipe?.filmId || rawRecipe?.mediaId || rawRecipe?.media?.id || null,
    film: rawRecipe?.film || rawRecipe?.media?.titre || 'Sans titre',
    // On ne garde que l'image uploadée par le membre.
    // media?.posterUrl et l'URL Unsplash sont retirés intentionnellement :
    // si pas d'image propre → null → RecipeCard affiche le placeholder SVG.
    image: rawRecipe?.image || rawRecipe?.imageURL || rawRecipe?.imageUrl || null,
    nbPersonnes: rawRecipe?.nbPersonnes || rawRecipe?.nombrePersonnes || '',
    ingredients: normalizedIngredients,
    etapes: Array.isArray(rawRecipe?.etapes)
      ? rawRecipe.etapes
      : (typeof rawRecipe?.instructions === 'string' && rawRecipe.instructions.trim())
        ? [rawRecipe.instructions]
        : [''],
    tempsPreparation: rawRecipe?.tempsPreparation || '',
    tempsCuisson: rawRecipe?.tempsCuisson || '',
    temps: rawRecipe?.temps || (totalMinutes > 0 ? `${totalMinutes} min` : ''),
    type: rawRecipe?.type || (mediaType === 'series' ? 'S' : 'F'),
  };
}

function mapMemberRecipeToCard(recipe) {
  const mediaType = String(recipe?.type || '').toUpperCase() === 'F' ? 'film' : 'serie';
  const durationValue = String(recipe?.temps || '').match(/\d+/);
  const duration = durationValue ? Number(durationValue[0]) : 0;

  // null si pas d'image uploadée → RecipeCard affiche son SVG appareil photo barré.
  // Aucun fallback (ni hero-home.webp, ni poster TMDB) : l'absence d'image
  // doit être visible pour inciter le membre à en ajouter une.
  const recipeImage = recipe?.image || null;

  return {
    id: recipe?.id,
    slug: recipe?.slug,
    title: recipe?.titre || 'Recette sans titre',
    category: recipe?.categorie || 'Autre',
    mediaTitle: recipe?.film || 'Sans média',
    mediaType,
    duration,
    image: recipeImage,
  };
}

function getRecipeModerationBadge(recipe) {
  const status = String(recipe?.status || '').toUpperCase();
  const rejectionReason = String(recipe?.rejectionReason || '').trim();

  if (status === 'PUBLISHED') {
    return {
      label: 'Validee',
      tone: 'published',
      title: 'Recette validee par l\'admin',
    };
  }

  if (status === 'PENDING') {
    return {
      label: 'En validation',
      tone: 'pending',
      title: 'Recette en cours de validation par l\'admin',
    };
  }

  if (status === 'DRAFT' && rejectionReason) {
    return {
      label: 'Refusee',
      tone: 'rejected',
      title: `Recette refusee par l\'admin${rejectionReason ? ` : ${rejectionReason}` : ''}`,
    };
  }

  return {
    label: 'Brouillon',
    tone: 'draft',
    title: 'Recette non soumise a validation',
  };
}

export default function MesRecettes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [recipes, setRecipes] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(LIMIT_OPTIONS[0]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [openedContactMessageNotification, setOpenedContactMessageNotification] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [filmResults, setFilmResults] = useState([]);
  const [filmSearchLoading, setFilmSearchLoading] = useState(false);
  const [filmSearchError, setFilmSearchError] = useState('');
  const [editImageError, setEditImageError] = useState('');
  const [editIngredientSearchResults, setEditIngredientSearchResults] = useState({});
  const [editIngredientSearchLoading, setEditIngredientSearchLoading] = useState({});
  const [editIngredientSearchError, setEditIngredientSearchError] = useState({});
  const [creatingEditIngredient, setCreatingEditIngredient] = useState({});
  const [openRejectionReasonId, setOpenRejectionReasonId] = useState(null);
  // Références pour debounce des recherches afin d'éviter trop d'appels API.
  const filmSearchTimeoutRef = useRef(null);
  const editIngredientSearchTimeouts = useRef({});
  const [recetteToDelete, setRecetteToDelete] = useState(null);

  const isPendingRecipesView = location.pathname === '/membre/mes-recettes/recettes-en-validation';
  const isNotificationsView = location.pathname === '/membre/notifications';

  // Récupérer les recettes au montage puis au retour sur l'onglet/la fenêtre.
  useEffect(() => {
    let isActive = true;

    const fetchRecipes = async ({ silent = false } = {}) => {
      try {
        if (!silent && isActive) {
          setIsLoading(true);
        }

        const token = localStorage.getItem('token');

        if (!token) {
          if (isActive) {
            setError('Token manquant. Veuillez vous reconnecter.');
            setIsLoading(false);
          }
          return;
        }

        const payload = await getMyRecipes();
        const data = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        const normalizedRecipes = data.map(normalizeRecipe);

        if (isActive) {
          setRecipes(normalizedRecipes);
          setError('');
          window.dispatchEvent(new Event('member-recipes-updated'));
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || 'Erreur lors de la récupération des recettes');
          setRecipes([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchRecipes();

    const handleWindowFocus = () => {
      fetchRecipes({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchRecipes({ silent: true });
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isActive = false;
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await fetch(CATEGORIES_API);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const categoryList = (Array.isArray(payload) ? payload : payload?.data || [])
          .map((category) => String(category?.name || category?.nom || '').trim())
          .filter(Boolean);

        if (isMounted) {
          setAvailableCategories(categoryList);
        }
      } catch {
        if (isMounted) {
          setAvailableCategories([]);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isNotificationsView) {
      return;
    }

    let isActive = true;

    const loadNotifications = async () => {
      setIsNotificationsLoading(true);
      setNotificationsError('');

      try {
        const payload = await getMyNotifications();

        if (!isActive) {
          return;
        }

        setNotifications(Array.isArray(payload?.notifications) ? payload.notifications : []);
        setNotificationsUnreadCount(Number(payload?.unreadCount || 0));
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setNotifications([]);
        setNotificationsUnreadCount(0);
        setNotificationsError(loadError.message || 'Impossible de charger vos notifications.');
      } finally {
        if (isActive) {
          setIsNotificationsLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      isActive = false;
    };
  }, [isNotificationsView]);

  const pendingRecipes = useMemo(
    () => recipes.filter((recipe) => String(recipe?.status || '').toUpperCase() === 'PENDING'),
    [recipes],
  );
  const memberRecipes = useMemo(
    () => recipes.filter((recipe) => String(recipe?.status || '').toUpperCase() !== 'PENDING'),
    [recipes],
  );
  const recipesForCurrentView = isPendingRecipesView ? pendingRecipes : memberRecipes;

  const recipesPageTitle = isPendingRecipesView
    ? 'Recettes en cours de validation'
    : 'Mes recettes';
  const panelTitle = isNotificationsView ? 'Notifications' : recipesPageTitle;

  function openNotificationTarget(notification) {
    const notificationRecipeId = String(notification?.recipeId || '').trim();
    const notificationRecipeSlug = String(notification?.recipeSlug || '').trim();
    const notificationRecipeTitle = extractRecipeTitleFromNotificationMessage(notification?.message);

    const matchedRecipe = recipes.find((recipe) => {
      if (!recipe) {
        return false;
      }

      const recipeId = String(recipe.id || '').trim();
      const recipeSlug = String(recipe.slug || '').trim();
      const recipeTitle = String(recipe.titre || '').trim().toLowerCase();

      return (
        (notificationRecipeId && recipeId === notificationRecipeId)
        || (notificationRecipeSlug && recipeSlug === notificationRecipeSlug)
        || (notificationRecipeTitle && recipeTitle === notificationRecipeTitle.toLowerCase())
      );
    });

    const targetId = String(matchedRecipe?.id || notificationRecipeId).trim();
    const targetSlugOrId = String(matchedRecipe?.slug || notificationRecipeSlug || targetId).trim();

    if (targetSlugOrId) {
      navigate(`/recipes/${targetSlugOrId}`, {
        state: {
          fromMemberRecipes: true,
          openEditRecipeId: targetId || undefined,
        },
      });
      return;
    }

    navigate('/membre/mes-recettes');
  }

  async function removeNotification(event, notification) {
    event.preventDefault();
    event.stopPropagation();

    if (!notification?.id) {
      return;
    }

    try {
      await deleteMyNotification(notification.id);
      setNotifications((previous) => previous.filter((item) => item.id !== notification.id));
      if (!notification.isRead) {
        setNotificationsUnreadCount((previous) => Math.max(0, previous - 1));
      }
    } catch (removeError) {
      setNotificationsError(removeError?.message || 'Suppression de notification impossible.');
    }
  }

  const [editForm, setEditForm] = useState({
    id: null,
    titre: '',
    categorie: 'Entrée',
    filmId: null,
    film: '',
    image: '',
    imageFile: null,
    tempsPreparation: '',
    tempsCuisson: '',
    nbPersonnes: '',
    ingredients: [{ ingredientId: null, nom: '', quantite: '', unite: '' }],
    etapes: [''],
    temps: '',
    type: 'F',
  });

  // Compteurs dynamiques par catégorie à partir des recettes chargées.
  const categories = buildCategoryFilters(availableCategories).map((category) => ({
    label: category.label,
    count: category.value === 'Tous'
      ? recipesForCurrentView.length
      : recipesForCurrentView.filter((recipe) => recipe.categorie === category.value).length,
    color: category.key,
  }));

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = searchInput.trim().toLowerCase();

    return recipesForCurrentView.filter((recipe) => {
      const matchesFilter = activeFilter === 'Tous' || recipe.categorie === activeFilter;
      const matchesQuery = !normalizedQuery
        || String(recipe?.titre || '').toLowerCase().includes(normalizedQuery)
        || String(recipe?.film || '').toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, recipesForCurrentView, searchInput]);

  const totalRecipes = filteredRecipes.length;
  const totalPages = Math.max(1, Math.ceil(totalRecipes / currentLimit));
  const paginatedRecipes = useMemo(() => {
    const startIndex = (currentPage - 1) * currentLimit;
    return filteredRecipes.slice(startIndex, startIndex + currentLimit);
  }, [currentLimit, currentPage, filteredRecipes]);
  const hasVisibleRecipes = totalRecipes > 0;
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Ouvre la confirmation de suppression pour une recette ciblée.
  function handleDeleteClick(recette) {
    setRecetteToDelete(recette);
    setShowDeleteModal(true);
  }

  // Suppression persistée côté API, puis synchronisation locale.
  async function handleDeleteConfirm() {
    if (!recetteToDelete?.id) {
      return;
    }

    try {
      setIsDeletingRecipe(true);
      await deleteMyRecipe(recetteToDelete.id);
      setRecipes(prev => prev.filter(recette => recette.id !== recetteToDelete.id));
      window.dispatchEvent(new Event('member-recipes-updated'));
      setShowDeleteModal(false);
      setRecetteToDelete(null);
      setError('');
    } catch (err) {
      setError(err?.message || 'Impossible de supprimer la recette pour le moment.');
    } finally {
      setIsDeletingRecipe(false);
    }
  }

  // Pré-remplit le formulaire d'édition avec les données de la carte sélectionnée.
  function handleEditClick(recette) {
    setEditForm({
      id: recette.id,
      titre: recette.titre,
      categorie: recette.categorie,
      filmId: recette.filmId || null,
      film: recette.film,
      image: recette.image,
      imageFile: null,
      tempsPreparation: recette.tempsPreparation || recette.temps || '',
      tempsCuisson: recette.tempsCuisson || '',
      nbPersonnes: recette.nbPersonnes || '',
      ingredients: (recette.ingredients || []).length > 0
        ? recette.ingredients.map(item => ({
            ingredientId: item?.ingredientId || null,
            nom: typeof item === 'string' ? item : (item?.nom || ''),
            quantite: typeof item === 'string' ? '' : (item?.quantite || ''),
            unite: typeof item === 'string' ? '' : (item?.unite || ''),
          }))
        : [{ ingredientId: null, nom: '', quantite: '', unite: '' }],
      etapes: recette.etapes && recette.etapes.length > 0 ? recette.etapes : [''],
      temps: recette.temps,
      type: recette.type,
    });
    setFilmResults([]);
    setFilmSearchError('');
    setEditImageError('');
    setEditIngredientSearchResults({});
    setEditIngredientSearchLoading({});
    setEditIngredientSearchError({});
    setCreatingEditIngredient({});
    setShowEditModal(true);
  }

  // Mise à jour générique d'un champ du formulaire d'édition.
  function handleEditChange(field, value) {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'film' ? { filmId: null } : {}),
      ...(field === 'image' ? { imageFile: null } : {}),
    }));
  }

  // Mise à jour d'un ingrédient dans une ligne du formulaire.
  function handleEditIngredientChange(index, field, value) {
    const updated = [...editForm.ingredients];
    updated[index][field] = value;

    if (field === 'nom') {
      updated[index].ingredientId = null;
    }

    setEditForm(prev => ({ ...prev, ingredients: updated }));
  }

  function addEditIngredient() {
    setEditForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: null, nom: '', quantite: '', unite: '' }],
    }));
  }

  function removeEditIngredient(index) {
    setEditForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));

    setEditIngredientSearchResults(prev => ({ ...prev, [index]: [] }));
    setEditIngredientSearchLoading(prev => ({ ...prev, [index]: false }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));
  }

  function handleEditEtapeChange(index, value) {
    const updated = [...editForm.etapes];
    updated[index] = value;
    setEditForm(prev => ({ ...prev, etapes: updated }));
  }

  function addEditEtape() {
    setEditForm(prev => ({ ...prev, etapes: [...prev.etapes, ''] }));
  }

  function removeEditEtape(index) {
    setEditForm(prev => ({
      ...prev,
      etapes: prev.etapes.filter((_, i) => i !== index),
    }));
  }

  // Réinitialise l'état UI de recherche d'ingrédient pour une ligne donnée.
  function clearEditIngredientSearchState(index) {
    setEditIngredientSearchResults(prev => ({ ...prev, [index]: [] }));
    setEditIngredientSearchLoading(prev => ({ ...prev, [index]: false }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));
  }

  // Recherche d'ingrédients côté API avec normalisation des formats renvoyés.
  async function searchEditIngredients(index, query) {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      clearEditIngredientSearchState(index);
      return;
    }

    setEditIngredientSearchLoading(prev => ({ ...prev, [index]: true }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));

    try {
      const response = await fetch(`${INGREDIENT_SEARCH_API}?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const rawList = Array.isArray(payload) ? payload : payload.data || [];
      const normalized = rawList.map(item => ({
        id: item.id,
        name: item.name || item.nom || '',
      })).filter(item => item.name);

      const normalizedQuery = trimmed.toLowerCase();
      const exactMatch = normalized.find(
        item => item.name.trim().toLowerCase() === normalizedQuery,
      );

      if (exactMatch) {
        selectEditIngredient(index, exactMatch);
        return;
      }

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

  // Debounce sur la saisie d'un ingrédient pour limiter la charge réseau.
  function handleEditIngredientNameInput(index, value) {
    handleEditIngredientChange(index, 'nom', value);

    clearTimeout(editIngredientSearchTimeouts.current[index]);
    editIngredientSearchTimeouts.current[index] = setTimeout(() => {
      searchEditIngredients(index, value);
    }, 300);
  }

  // Sélectionne un ingrédient suggéré et renseigne son identifiant.
  function selectEditIngredient(index, ingredient) {
    const updated = [...editForm.ingredients];
    updated[index].ingredientId = ingredient.id || null;
    updated[index].nom = ingredient.name;
    setEditForm(prev => ({ ...prev, ingredients: updated }));
    clearEditIngredientSearchState(index);
  }

  // Création à la volée d'un ingrédient si aucune suggestion n'existe.
  async function createEditIngredient(index) {
    const name = editForm.ingredients[index]?.nom?.trim();
    if (!name) {
      return;
    }

    setCreatingEditIngredient(prev => ({ ...prev, [index]: true }));
    setEditIngredientSearchError(prev => ({ ...prev, [index]: '' }));

    try {
      const response = await fetch(INGREDIENT_CREATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const created = await response.json();
      selectEditIngredient(index, {
        id: created.id,
        name: created.name || created.nom || name,
      });
    } catch {
      setEditIngredientSearchError(prev => ({
        ...prev,
        [index]: "Impossible de créer l'ingrédient pour l'instant.",
      }));
    } finally {
      setCreatingEditIngredient(prev => ({ ...prev, [index]: false }));
    }
  }

  // Validation minimale: images PNG, JPG, JPEG et WEBP acceptees dans l'editeur.
  function isAllowedImageFile(file) {
    if (!file) {
      return false;
    }

    const lowerName = file.name.toLowerCase();
    return ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
      || lowerName.endsWith('.png')
      || lowerName.endsWith('.jpg')
      || lowerName.endsWith('.jpeg')
      || lowerName.endsWith('.webp');
  }

  // Stocke un aperçu local de l'image sélectionnée pour feedback immédiat.
  function handleEditImageChange(file) {
    if (!file) {
      return;
    }

    if (!isAllowedImageFile(file)) {
      setEditImageError('Veuillez utiliser une image .png, .jpg, .jpeg ou .webp.');
      return;
    }

    setEditImageError('');
    setEditForm(prev => ({ ...prev, imageFile: file }));
  }

  // Recherche de films/séries avec normalisation des clés de réponse.
  async function searchFilms(query) {
    const trimmed = query.trim();
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

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        throw new Error(payload?.message || `HTTP ${response.status}`);
      }

      const payload = await response.json();
      const rawList = Array.isArray(payload) ? payload : payload.data || [];
      const normalized = rawList
        .map(normalizeTmdbSearchResult)
        .filter(item => item.title);

      setFilmResults(normalized.slice(0, 8));
    } catch (error) {
      setFilmResults([]);
      setFilmSearchError(error?.message || "Impossible de rechercher les films/séries pour l'instant.");
    } finally {
      setFilmSearchLoading(false);
    }
  }

  // Debounce sur la recherche de titre depuis le champ "film".
  function handleFilmInput(value) {
    handleEditChange('film', value);
    clearTimeout(filmSearchTimeoutRef.current);
    filmSearchTimeoutRef.current = setTimeout(() => {
      searchFilms(value);
    }, 300);
  }

  // Hydrate le film sélectionné dans le formulaire.
  function selectFilm(film) {
    const normalizedType = String(film?.type || '').toLowerCase();

    setEditForm(prev => ({
      ...prev,
      filmId: film.id || null,
      film: film.title,
      type: normalizedType === 'movie'
        ? 'F'
        : (normalizedType === 'tv' || normalizedType === 'series' || normalizedType === 'serie' || normalizedType === 'série')
          ? 'S'
          : prev.type,
    }));
    setFilmResults([]);
  }

  // Persiste les modifications via l'API puis resynchronise la recette locale.
  async function handleEditSave() {
    if (!editForm.id) {
      return;
    }

    const normalizedIngredients = editForm.ingredients
      .map(ingredient => ({
        nom: String(ingredient?.nom || '').trim(),
        quantity: ingredient?.quantite === '' ? null : ingredient?.quantite ?? null,
        unit: ingredient?.unite ? String(ingredient.unite).trim() : null,
      }))
      .filter(ingredient => ingredient.nom.length > 0);

    const normalizedEtapes = editForm.etapes
      .map(etape => String(etape || '').trim())
      .filter(Boolean);

    const payload = {
      titre: String(editForm.titre || '').trim(),
      categorie: editForm.categorie,
      instructions: normalizedEtapes.join('\n'),
      etapes: normalizedEtapes,
      nombrePersonnes: parseOptionalPositiveInteger(editForm.nbPersonnes),
      // ✅ CORRECTIF TEMPS — parseTimeToMinutes comprend "1h10", "1:10", "70", "30min"
      // et convertit tout en minutes entières pour la BDD.
      // Analogie : la BDD ne stocke que des minutes, comme un minuteur de cuisine.
      // "1h10" → 70, "65min" → 65, total → 70 + 65 = 135 → affiché "2h15min"
      tempsPreparation: parseTimeToMinutes(editForm.tempsPreparation),
      tempsCuisson: parseTimeToMinutes(editForm.tempsCuisson),
      imageUrl: String(editForm.image || '').trim() || undefined,
      ingredients: normalizedIngredients,
    };

    if (UUID_REGEX.test(String(editForm.filmId || ''))) {
      payload.mediaId = editForm.filmId;
    } else {
      const parsedFilmId = Number(editForm.filmId);

      if (Number.isInteger(parsedFilmId) && parsedFilmId > 0) {
        payload.filmId = parsedFilmId;
        payload.film = String(editForm.film || '').trim();
        payload.type = editForm.type;
      }
    }

    try {
      setIsSavingEdit(true);
      let requestBody = payload;

      if (editForm.imageFile instanceof File) {
        const formData = new FormData();
        formData.append('titre', payload.titre);
        formData.append('categorie', payload.categorie);
        formData.append('instructions', payload.instructions);
        formData.append('etapes', JSON.stringify(payload.etapes));
        formData.append('ingredients', JSON.stringify(payload.ingredients));
        formData.append('image', editForm.imageFile);

        if (payload.nombrePersonnes !== undefined) {
          formData.append('nombrePersonnes', String(payload.nombrePersonnes));
        }

        if (payload.tempsPreparation !== undefined) {
          formData.append('tempsPreparation', String(payload.tempsPreparation));
        }

        if (payload.tempsCuisson !== undefined) {
          formData.append('tempsCuisson', String(payload.tempsCuisson));
        }

        if (payload.mediaId) {
          formData.append('mediaId', String(payload.mediaId));
        }

        if (payload.filmId) {
          formData.append('filmId', String(payload.filmId));
        }

        if (payload.film) {
          formData.append('film', payload.film);
        }

        if (payload.type) {
          formData.append('type', payload.type);
        }

        requestBody = formData;
      }

      const response = await updateMyRecipe(editForm.id, requestBody);
      const updatedRecipe = normalizeRecipe(response?.recipe || response?.data || response);

      setRecipes(prev => prev.map(recette => (
        recette.id === updatedRecipe.id ? updatedRecipe : recette
      )));
      window.dispatchEvent(new Event('member-recipes-updated'));
      setShowEditModal(false);
      setShowEditConfirmModal(false);
      setError('');
    } catch (err) {
      setError(formatApiError(err, 'Impossible de modifier la recette pour le moment.'));
    } finally {
      setIsSavingEdit(false);
    }
  }

  function openEditConfirmModal() {
    setError('');
    setShowEditConfirmModal(true);
  }

  function toggleRejectionReason(recipeId) {
    setOpenRejectionReasonId(prev => (prev === recipeId ? null : recipeId));
  }

  function openCreateRecipeForm() {
    navigate('/membre/creer-recette');
  }

  async function handleSubmitRecipe(recipeId) {
  try {
    await updateMyRecipe(recipeId, { status: 'PENDING' });
    setRecipes(prev => prev.map(r =>
      r.id === recipeId ? { ...r, status: 'PENDING' } : r
    ));
    window.dispatchEvent(new Event('member-recipes-updated'));
  } catch (err) {
    setError(err?.message || 'Impossible de soumettre la recette.');
  }
}

  useEffect(() => {
    setActiveFilter('Tous');
    setSearchInput('');
    setCurrentPage(1);
  }, [location.pathname]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, currentLimit, searchInput]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const openEditRecipeId = location.state?.openEditRecipeId;

    if (isNotificationsView || !openEditRecipeId || recipes.length === 0) {
      return;
    }

    const recipeToEdit = recipes.find(
      (recipe) => String(recipe?.id) === String(openEditRecipeId),
    );

    if (!recipeToEdit) {
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    handleEditClick(recipeToEdit);
    navigate(location.pathname, { replace: true, state: null });
  }, [isNotificationsView, location.pathname, location.state, navigate, recipes]);


  return (
    <>

      {/* MODALE SUPPRESSION */}
      {showDeleteModal && (
        <div
          className={styles.overlay}
          onClick={() => {
            if (!isDeletingRecipe) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <p className={styles.modalText}>
              Êtes-vous sûr de vouloir supprimer cette recette ?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                aria-label="Annuler la suppression de la recette"
                disabled={isDeletingRecipe}
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
                aria-label="Confirmer la suppression de la recette"
                disabled={isDeletingRecipe}
                onClick={handleDeleteConfirm}
              >
                {isDeletingRecipe ? 'Suppression...' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div
          className={styles.overlay}
          onClick={() => {
            if (!isSavingEdit) {
              setShowEditModal(false);
            }
          }}
        >
          <div
            className={`${styles.modal} ${styles.editModal}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.editTitle}>Modifier la recette</h2>

            <div className={styles.editFields}>
              <label className={styles.editLabel}>
                Titre
                <input
                  className={styles.editInput}
                  type="text"
                  value={editForm.titre}
                  onChange={e => handleEditChange('titre', e.target.value)}
                />
              </label>

              <label className={styles.editLabel}>
                Catégorie
                <select
                  className={styles.editInput}
                  value={editForm.categorie}
                  onChange={e => handleEditChange('categorie', e.target.value)}
                >
                  {buildCategoryFilters(availableCategories)
                    .filter((category) => category.value !== 'Tous')
                    .map((category) => (
                      <option key={category.key} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className={styles.editLabel}>
                Film ou série
                <input
                  className={styles.editInput}
                  type="text"
                  value={editForm.film}
                  onChange={e => handleFilmInput(e.target.value)}
                />
              </label>

              {(filmSearchLoading || filmSearchError || filmResults.length > 0) && (
                <div className={styles.filmSearchBox}>
                  {filmSearchLoading && (
                    <p className={styles.filmSearchText}>Recherche en cours...</p>
                  )}

                  {filmSearchError && (
                    <p className={styles.filmSearchError}>{filmSearchError}</p>
                  )}

                  {filmResults.length > 0 && (
                    <ul className={styles.filmSuggestionList}>
                      {filmResults.map(result => (
                        <li key={result.id || result.title}>
                          <button
                            type="button"
                            className={styles.filmSuggestionBtn}
                            onClick={() => selectFilm(result)}
                          >
                            <img
                              src={result.poster || MEDIA_SUGGESTION_POSTER_FALLBACK}
                              alt=""
                              aria-hidden="true"
                              className={styles.filmSuggestionPoster}
                            />
                            <span className={styles.filmSuggestionCopy}>
                              <span className={styles.filmSuggestionTitle}>{result.title}</span>
                              <span className={styles.filmSuggestionMeta}>{getMediaSuggestionMeta(result)}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <label className={styles.editLabel}>
                Type
                <select
                  className={styles.editInput}
                  value={editForm.type}
                  onChange={e => handleEditChange('type', e.target.value)}
                >
                  <option value="F">Film</option>
                  <option value="S">Série</option>
                </select>
              </label>

              <label className={styles.editLabel}>
                Nombre de personnes
                <input
                  className={styles.editInput}
                  type="number"
                  value={editForm.nbPersonnes}
                  onChange={e => handleEditChange('nbPersonnes', e.target.value)}
                />
              </label>

              <div className={styles.editLabelBlock}>
                <span className={styles.editLabelTitle}>Ingrédients</span>
                {editForm.ingredients.map((ing, index) => (
                  <div key={index} className={styles.editIngredientRow}>
                    <input
                      className={styles.editInput}
                      type="text"
                      placeholder="Rechercher un ingrédient..."
                      value={ing.nom}
                      onChange={e => handleEditIngredientNameInput(index, e.target.value)}
                    />

                    {(editIngredientSearchLoading[index]
                      || (editIngredientSearchResults[index] && editIngredientSearchResults[index].length > 0)
                      || editIngredientSearchError[index]
                      || (!ing.ingredientId && ing.nom.trim().length >= 2 && !editIngredientSearchLoading[index]
                        && (!editIngredientSearchResults[index] || editIngredientSearchResults[index].length === 0))) && (
                      <div className={styles.filmSearchBox}>
                        {editIngredientSearchLoading[index] && (
                          <p className={styles.filmSearchText}>Recherche en cours...</p>
                        )}

                        {editIngredientSearchError[index] && (
                          <p className={styles.filmSearchError}>{editIngredientSearchError[index]}</p>
                        )}

                        {editIngredientSearchResults[index] && editIngredientSearchResults[index].length > 0 && (
                          <ul className={styles.filmSuggestionList}>
                            {editIngredientSearchResults[index].map(result => (
                              <li key={result.id || result.name}>
                                <button
                                  type="button"
                                  className={styles.filmSuggestionBtn}
                                  onClick={() => selectEditIngredient(index, result)}
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
                              className={styles.createIngredientBtn}
                              onClick={() => createEditIngredient(index)}
                              disabled={creatingEditIngredient[index]}
                            >
                              {creatingEditIngredient[index]
                                ? 'Creation...'
                                : `Creer l'ingredient "${ing.nom.trim()}"`}
                            </button>
                          )}
                      </div>
                    )}

                    <div className={styles.editIngredientBottom}>
                      <input
                        className={`${styles.editInput} ${styles.editQuantiteInput}`}
                        type="number"
                        placeholder="Qté"
                        value={ing.quantite}
                        onChange={e => handleEditIngredientChange(index, 'quantite', e.target.value)}
                      />

                      <select
                        className={styles.editInput}
                        value={ing.unite}
                        onChange={e => handleEditIngredientChange(index, 'unite', e.target.value)}
                      >
                        <option value="">Unité</option>
                        {unitesOptions.map(unite => (
                          <option key={unite} value={unite}>{unite}</option>
                        ))}
                      </select>

                      {editForm.ingredients.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeSmallBtn}
                          onClick={() => removeEditIngredient(index)}
                        >
                          −
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.addSmallBtn}
                  onClick={addEditIngredient}
                >
                  + Ajouter un ingrédient
                </button>
              </div>

              {/* ✅ CORRECTIF TEMPS — placeholders mis à jour pour indiquer les formats acceptés */}
              <label className={styles.editLabel}>
                Temps de préparation
                <input
                  className={styles.editInput}
                  type="text"
                  placeholder="ex: 20, 1h, 1h30"
                  value={editForm.tempsPreparation}
                  onChange={e => handleEditChange('tempsPreparation', e.target.value)}
                />
              </label>

              <label className={styles.editLabel}>
                Temps de cuisson
                <input
                  className={styles.editInput}
                  type="text"
                  placeholder="ex: 30, 1h, 1h10"
                  value={editForm.tempsCuisson}
                  onChange={e => handleEditChange('tempsCuisson', e.target.value)}
                />
              </label>

              <div className={styles.editLabelBlock}>
                <span className={styles.editLabelTitle}>Étapes de préparation</span>
                {editForm.etapes.map((etape, index) => (
                  <div key={index} className={styles.editEtapeRow}>
                    <span className={styles.editEtapeNumber}>{index + 1}</span>
                    <textarea
                      className={styles.editTextarea}
                      placeholder={`Étape ${index + 1}...`}
                      value={etape}
                      onChange={e => handleEditEtapeChange(index, e.target.value)}
                      rows={2}
                    />
                    {editForm.etapes.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeSmallBtn}
                        onClick={() => removeEditEtape(index)}
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.addSmallBtn}
                  onClick={addEditEtape}
                >
                  + Ajouter une étape
                </button>
              </div>

              <label className={styles.editLabel}>
                Image (.png, .jpg, .jpeg, .webp)
                <input
                  className={styles.editInput}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={e => handleEditImageChange(e.target.files?.[0])}
                />
              </label>

              <label className={styles.editLabel}>
                Ou URL image
                <input
                  className={styles.editInput}
                  type="url"
                  value={editForm.image}
                  onChange={e => handleEditChange('image', e.target.value)}
                />
              </label>

              {editImageError && <p className={styles.editErrorText}>{editImageError}</p>}
            </div>

            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                disabled={isSavingEdit}
                onClick={() => setShowEditModal(false)}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
                disabled={isSavingEdit}
                onClick={openEditConfirmModal}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditConfirmModal && (
        <div
          className={`${styles.overlay} ${styles.confirmOverlay}`}
          onClick={() => {
            if (!isSavingEdit) {
              setShowEditConfirmModal(false);
            }
          }}
        >
          <div
            className={`${styles.modal} ${styles.confirmModal}`}
            onClick={(event) => event.stopPropagation()}
          >
            <p className={styles.modalText}>
              Voulez-vous confirmer les modifications de cette recette ?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                disabled={isSavingEdit}
                onClick={() => setShowEditConfirmModal(false)}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
                disabled={isSavingEdit}
                onClick={handleEditSave}
              >
                {isSavingEdit ? 'Enregistrement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

        <section className={styles.recipesPanel}>
          <h2 className={styles.title}>{panelTitle}</h2>
          {!isNotificationsView ? (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
              className={styles.panelState}
            />
          ) : null}

          {isNotificationsView ? (
            <>
              <Alert
                type="error"
                message={notificationsError}
                onClose={() => setNotificationsError('')}
                className={styles.panelState}
              />
              {isNotificationsLoading ? (
                <StatusBlock
                  variant="loading"
                  title="Chargement des notifications"
                  className={styles.panelState}
                />
              ) : null}

              {!isNotificationsLoading && !notificationsError ? (
                <p className={styles.pageIntro}>
                  <strong className={styles.summaryStrong}>{notificationsUnreadCount}</strong> notification{notificationsUnreadCount > 1 ? 's' : ''} non lue{notificationsUnreadCount > 1 ? 's' : ''}.
                </p>
              ) : null}

              {!isNotificationsLoading && !notificationsError && notifications.length === 0 ? (
                <StatusBlock
                  variant="empty"
                  title="Pas de notifications actuellement"
                  message="Les nouvelles alertes liées à vos recettes apparaîtront ici."
                  className={styles.panelState}
                />
              ) : null}

              {!isNotificationsLoading && !notificationsError && notifications.length > 0 ? (
                <ul className={styles.notificationsList}>
                  {notifications.map((notification) => (
                    (() => {
                      const isContact = isContactNotification(notification?.message);
                      const notificationMessage = isContact
                        ? buildContactNotificationPreview(notification?.message)
                        : notification?.message;

                      return (
                        <li
                          key={notification.id}
                          className={`${styles.notificationRow} ${styles[`notificationRow_${getNotificationVariantClassName(notification.message)}`] || ''}`.trim()}
                        >
                          <button
                            type="button"
                            className={styles.notificationOpenButton}
                            onClick={() => {
                              if (isContact) {
                                setOpenedContactMessageNotification(notification);
                                return;
                              }
                              openNotificationTarget(notification);
                            }}
                            aria-label={isContact ? 'Voir le message complet' : 'Voir la notification'}
                            title={isContact ? 'Voir le message complet' : 'Voir'}
                          >
                            <img src="/icon/Eye.svg" alt="" aria-hidden="true" />
                          </button>

                          <div className={styles.notificationBody}>
                            <strong className={styles.notificationMessage}>{notificationMessage}</strong>
                            <span className={styles.notificationMeta}>
                              {new Date(notification.createdAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={styles.notificationDeleteButton}
                            aria-label="Supprimer cette notification"
                            title="Supprimer"
                            onClick={(event) => removeNotification(event, notification)}
                          >
                            <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })()
                  ))}
                </ul>
              ) : null}

              {openedContactMessageNotification ? (
                <div
                  className={styles.notificationMessageOverlay}
                  onClick={() => setOpenedContactMessageNotification(null)}
                >
                  <div
                    className={styles.notificationMessageModal}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <h3 className={styles.notificationMessageTitle}>Message de contact</h3>

                    <p className={styles.notificationMessageBody}>
                      {openedContactMessageNotification.message}
                    </p>

                    <p className={styles.notificationMessageMeta}>
                      {new Date(openedContactMessageNotification.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    <div className={styles.notificationMessageActions}>
                      <button
                        type="button"
                        className={styles.notificationMessageCloseButton}
                        onClick={() => setOpenedContactMessageNotification(null)}
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : isLoading ? (
            <StatusBlock
              variant="loading"
              title="Chargement de vos recettes"
              className={styles.panelState}
            />
          ) : (
            <>
              <form
                className={styles.recipeSearchRow}
                onSubmit={(event) => event.preventDefault()}
              >
                <div className={styles.recipeSearchField}>
                  <span className={styles.recipeSearchFieldIcon} aria-hidden="true" />
                  <input
                    className={styles.recipeSearchInput}
                    type="search"
                    aria-label="Rechercher une recette"
                    placeholder="Rechercher une recette"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                </div>
              </form>

              {!isPendingRecipesView ? (
                <button
                  type="button"
                  className={styles.addRecipeButton}
                  onClick={openCreateRecipeForm}
                >
                  <span className={styles.addRecipeIcon} aria-hidden="true">+</span>
                  <span className={styles.addRecipeText}>Ajouter une recette</span>
                </button>
              ) : null}

              <div className={styles.filtersScroller}>
                <div className={styles.filters}>
                  {categories.map(cat => (
                    <div key={cat.label} className={styles.filterItem}>
                      <span className={`${styles.filterCount} ${styles[cat.color]}`}>
                        {cat.count}
                      </span>
                      <button
                        className={`${styles.filterBtn} ${activeFilter === cat.label ? styles[`active_${cat.color}`] : ''}`}
                        aria-label={`Filtrer les recettes: ${cat.label}`}
                        onClick={() => setActiveFilter(cat.label)}
                      >
                        {cat.label}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.recipeSummaryRow}>
                <p className={styles.recipeSummaryText}>
                  <strong className={styles.summaryStrong}>{totalRecipes}</strong> recette{totalRecipes > 1 ? 's' : ''} trouvée{totalRecipes > 1 ? 's' : ''}.
                </p>
                <div className={styles.recipeSummaryMeta}>
                  <label className={styles.limitControl}>
                    <span>Par page</span>
                    <select
                      className={styles.limitSelect}
                      value={currentLimit}
                      onChange={(event) => setCurrentLimit(Number(event.target.value))}
                    >
                      {LIMIT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={styles.mobileLimitControl} aria-label="Nombre de recettes par page">
                    <div className={styles.mobileLimitPills}>
                      {LIMIT_OPTIONS.map((option) => {
                        const isActive = currentLimit === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            className={`${styles.mobileLimitPill} ${isActive ? styles.mobileLimitPillActive : ''}`.trim()}
                            onClick={() => setCurrentLimit(option)}
                            aria-pressed={isActive}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {!error && !hasVisibleRecipes ? (
                <StatusBlock
                  variant="empty"
                  title="Aucune recette à afficher"
                  message={activeFilter === 'Tous'
                    ? (isPendingRecipesView
                      ? 'Aucune recette en cours de validation pour le moment.'
                      : 'Commencez par ajouter une recette à votre espace membre.')
                    : `Aucune recette ${activeFilter.toLowerCase()} n'est disponible dans votre espace pour le moment.`}
                  className={styles.panelState}
                />
              ) : null}

              {hasVisibleRecipes ? (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Liste des recettes</h3>
                  <div className={styles.grid}>
                    {paginatedRecipes.map(recette => (
                      <div key={recette.id} className={styles.cardShell}>
                        <RecipeCard
                          recipe={mapMemberRecipeToCard(recette)}
                          to={`/recipes/${recette.slug || recette.id}`}
                          linkState={{
                            fromMemberRecipes: true,
                            openEditRecipeId: recette.id,
                          }}
                        />
                        {(() => {
                          const moderationBadge = getRecipeModerationBadge(recette);
                          const isRejected = moderationBadge.tone === 'rejected' && Boolean(recette?.rejectionReason);
                          const isTooltipOpen = openRejectionReasonId === recette.id;

                          return (
                            <div className={styles.moderationBadgeGroup}>
                              <span
                                className={`${styles.moderationBadge} ${styles[`moderationBadge_${moderationBadge.tone}`]}`}
                                title={moderationBadge.title}
                              >
                                {moderationBadge.label}
                              </span>

                              {isRejected && (
                                <>
                                  <button
                                    type="button"
                                    className={styles.rejectionInfoButton}
                                    aria-label={`Voir le motif de refus de la recette ${recette.titre}`}
                                    aria-expanded={isTooltipOpen}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      toggleRejectionReason(recette.id);
                                    }}
                                  >
                                    i
                                  </button>

                                  {isTooltipOpen && (
                                    <div className={styles.rejectionTooltip} role="status">
                                      <strong className={styles.rejectionTooltipTitle}>Motif du refus</strong>
                                      <p className={styles.rejectionTooltipText}>{recette.rejectionReason}</p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })()}
                        <div className={styles.cardActionsFloating}>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            aria-label={`Supprimer la recette ${recette.titre}`}
                            onClick={() => handleDeleteClick(recette)}
                          >
                            <img src="/icon/Trash.svg" alt="" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                            aria-label={`Modifier la recette ${recette.titre}`}
                            onClick={() => handleEditClick(recette)}
                          >
                            <img src="/icon/Edit_duotone_line.svg" alt="" aria-hidden="true" />
                          </button>
                          {String(recette.status || '').toUpperCase() === 'DRAFT' && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionBtnSubmit}`}
                              aria-label={`Soumettre la recette ${recette.titre} pour validation`}
                              onClick={() => handleSubmitRecipe(recette.id)}
                            >
                              Soumettre
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 ? (
                    <div className={styles.pagination}>
                      <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                        disabled={!hasPreviousPage}
                      >
                        Précédent
                      </button>
                      <span className={styles.paginationStatus}>Page {currentPage} / {totalPages}</span>
                      <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                        disabled={!hasNextPage}
                      >
                        Suivant
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </section>
    </>
  );
}
