// ──────────────────────────────────────────────────────────────────────────
//  MODIFICATIONS F-07 :
//   1. Import useAuth + logout via contexte (même fix que MemberInterface)
//   2. Ajout fonction handleSubmitRecipe pour soumettre un brouillon
//   3. Bouton "Soumettre" visible uniquement si status === 'DRAFT'
//   4. Bouton "Modifier" désactivé si status === 'PENDING'
// ──────────────────────────────────────────────────────────────────────────


import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './MemberRecipes.module.scss';
import { deleteMyRecipe, getMyRecipes, updateMyRecipe } from '../../services/recipesService';
import RecipeCard from '../../components/RecipeCard';
// ──────────────────────────────────────────────────────────────────────────
//  MODIF 1 : import du hook useAuth
//  Avant  : pas d'import, le logout se faisait manuellement via localStorage
//  Après  : on passe par le contexte AuthContext (même pattern que Navbar
//             et MemberInterface) pour que la déconnexion soit cohérente partout.
// ──────────────────────────────────────────────────────────────────────────
import { useAuth } from '../../contexts/AuthContext.jsx' 

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const FILM_SEARCH_API = import.meta.env.VITE_TMDB_SEARCH_API
  || import.meta.env.VITE_FILM_SEARCH_API
  || `${API_BASE_URL}/api/tmdb/medias/search`;
const INGREDIENT_SEARCH_API = import.meta.env.VITE_INGREDIENT_SEARCH_API
  || import.meta.env.VITE_INGREDIENT_SEARCH_API_URL
  || `${API_BASE_URL}/api/ingredients/search`;
const INGREDIENT_CREATE_API = import.meta.env.VITE_INGREDIENT_CREATE_API
  || (import.meta.env.VITE_INGREDIENT_SEARCH_API_URL
    ? import.meta.env.VITE_INGREDIENT_SEARCH_API_URL.replace(/\/search$/, '')
    : '')
  || `${API_BASE_URL}/api/ingredients`;
const PROFILE_API = import.meta.env.VITE_PROFILE_API || `${API_BASE_URL}/api/auth/me`;
const unitesOptions = ['g', 'kg', 'ml', 'L', 'cl', 'pièce(s)', 'cuillère(s) à soupe', 'cuillère(s) à café', 'pincée(s)'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    image: rawRecipe?.image || rawRecipe?.imageURL || rawRecipe?.imageUrl || rawRecipe?.media?.posterUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400',
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
  const primaryImage = recipe?.image || '/img/hero-home.png';
  const mediaPoster = recipe?.media?.posterUrl || '';
  const fallbackImage = mediaPoster && mediaPoster !== primaryImage ? mediaPoster : '/img/hero-home.png';

  return {
    id: recipe?.id,
    slug: recipe?.slug,
    title: recipe?.titre || 'Recette sans titre',
    category: recipe?.categorie || 'Autre',
    mediaTitle: recipe?.film || 'Sans média',
    mediaType,
    duration,
    image: primaryImage,
    fallbackImage,
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
  // ──────────────────────────────────────────────────────────────────────
  //  MODIF 1 (suite) : on récupère logout depuis le contexte
  //  Avant  : pas de useAuth()
  //  Après  : logout() vide le state React ET le localStorage d'un coup
  // ──────────────────────────────────────────────────────────────────────
  const { logout } = useAuth ();
  const [recipes, setRecipes] = useState([]);
  const [userDisplayName, setUserDisplayName] = useState(localStorage.getItem('displayName') || '');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [newRecipeName, setNewRecipeName] = useState('');
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

  // Récupérer le profil au montage pour afficher un nom/e-mail dynamiques.
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          return;
        }

        const response = await fetch(PROFILE_API, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const user = payload?.data ?? payload;
        const rawName = (typeof user?.prenom === 'string' && user.prenom.trim())
          ? user.prenom
          : (typeof user?.pseudo === 'string' && user.pseudo.trim())
            ? user.pseudo
            : '';

        if (rawName) {
          const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
          setUserDisplayName(normalizedName);
          localStorage.setItem('displayName', normalizedName);
          window.dispatchEvent(new Event('user-display-name-updated'));
        }

        if (typeof user?.email === 'string') {
          setUserEmail(user.email);
        }
      } catch {
        // Le fallback localStorage/displayName reste actif.
      }
    };

    fetchProfile();
  }, []);

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

  // Navigation latérale du compte membre.
  const accountItems = [
    {
      icon: '/icon/Recipes.svg',
      label: 'Mes recettes',
      sub: `${recipes.length} recettes`,
      path: '/membre/mes-recettes',
      active: true,
    },
    {
      icon: '/icon/Message_fill.svg',
      label: 'Notifications',
      sub: 'Voir mes alertes',
      path: '/membre',
      active: false,
    },
    {
      icon: '/icon/User.svg',
      label: 'Mes informations',
      sub: userEmail,
      path: '/membre/profil',
      active: false,
    },
    {
      icon: '/icon/Contact.svg',
      label: 'Contact',
      sub: 'help@support.cine-delices.com',
      path: '/contact',
      active: false,
    },
  ];
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
  const categories = [
    { label: 'Tous', count: recipes.length, color: 'tous' },
    { label: 'Entrée', count: recipes.filter(r => r.categorie === 'Entrée').length, color: 'entree' },
    { label: 'Plat', count: recipes.filter(r => r.categorie === 'Plat').length, color: 'plat' },
    { label: 'Dessert', count: recipes.filter(r => r.categorie === 'Dessert').length, color: 'dessert' },
    { label: 'Boisson', count: recipes.filter(r => r.categorie === 'Boisson').length, color: 'boisson' },
  ];

  // Application du filtre actif.
  const filtered = activeFilter === 'Tous'
    ? recipes
    : recipes.filter(r => r.categorie === activeFilter);

  // Grouper par catégorie
  const grouped = filtered.reduce((acc, recette) => {
    if (!acc[recette.categorie]) acc[recette.categorie] = [];
    acc[recette.categorie].push(recette);
    return acc;
  }, {});

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
      const normalized = rawList.map(item => ({
        id: item.id,
        title: item.title || item.titre || item.name || item.nom || '',
        type: item.type || item.mediaType || item.media_type || '',
      })).filter(item => item.title);

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
      tempsPreparation: parseOptionalPositiveInteger(editForm.tempsPreparation),
      tempsCuisson: parseOptionalPositiveInteger(editForm.tempsCuisson),
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

  // Déconnexion utilisateur locale.
  // ──────────────────────────────────────────────────────────────────────
  //  MODIF 1 (fin) : handleLogout passe par le contexte AuthContext
  //
  //   Avant  : localStorage.removeItem('token') → ne vidait pas le state
  //             React → la Navbar affichait toujours "Bonjour Marie"
  //
  //   Après  : logout() du contexte fait tout d'un coup :
  //             - supprime token, auth_user, displayName du localStorage
  //             - remet isAuthenticated à false dans le state React
  //             - la Navbar se re-rend automatiquement avec "Se connecter"
  // ──────────────────────────────────────────────────────────────────────
  function handleLogout() {
    logout()
    navigate('/');
  }

 // ──────────────────────────────────────────────────────────────────────
  //  MODIF 2 : nouvelle fonction handleSubmitRecipe
  //
  //   Permet de soumettre un brouillon (DRAFT) pour validation admin.
  //   Envoie un PATCH à l'API avec le status 'PENDING', puis met à jour
  //   la recette localement pour un feedback immédiat sans recharger.
  //   Le ticket passe de "en préparation"
  //    (DRAFT) à "en attente de validation" (PENDING).
  // ──────────────────────────────────────────────────────────────────────
  async function handleSubmitRecipe(recipeId) {
  try {
    await updateMyRecipe(recipeId, { status: 'PENDING' });
    setRecipes(prev => prev.map(r =>
      r.id === recipeId ? { ...r, status: 'PENDING' } : r
    ));
  } catch (err) {
    setError(err?.message || 'Impossible de soumettre la recette.');
  }
}


  return (
    <div className={styles.mesRecettes}>

      {/* MODALE SUPPRESSION */}
      {showDeleteModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
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
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${styles.editModal}`}>
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
                  <option value="Entrée">Entrée</option>
                  <option value="Plat">Plat</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Boisson">Boisson</option>
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
                            {result.title}
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

              <label className={styles.editLabel}>
                Temps de préparation
                <input
                  className={styles.editInput}
                  type="text"
                  value={editForm.tempsPreparation}
                  onChange={e => handleEditChange('tempsPreparation', e.target.value)}
                />
              </label>

              <label className={styles.editLabel}>
                Temps de cuisson
                <input
                  className={styles.editInput}
                  type="text"
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
        <div className={`${styles.overlay} ${styles.confirmOverlay}`}>
          <div className={`${styles.modal} ${styles.confirmModal}`}>
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

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mon compte</h1>
      </div>
      <p className={styles.welcomeText}>
        Bonjour <strong>{userDisplayName || 'toi'}</strong>, bienvenue chez Cine Delices !
      </p>

      <div className={styles.desktopLayout}>
        <aside className={styles.accountPanel}>
          <div className={styles.accountLinks}>
            {accountItems.map(item => (
              <button
                key={item.path}
                type="button"
                className={`${styles.accountItem} ${item.active ? styles.accountItemActive : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className={styles.accountIcon}>
                  <img src={item.icon} alt="" aria-hidden="true" />
                </span>
                <span className={styles.accountContent}>
                  <strong>{item.label}</strong>
                  <small>{item.path === '/membre/mes-recettes' ? `${recipes.length} recettes` : item.sub}</small>
                </span>
                <span className={styles.accountArrow}>›</span>
              </button>
            ))}
          </div>

          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.logoutIcon}>
              <img src="/icon/Logout.svg" alt="" aria-hidden="true" />
            </span>
            <span>Se déconnecter</span>
            <span>›</span>
          </button>
        </aside>

        <section className={styles.recipesPanel}>
          <h2 className={styles.title}>Mes recettes</h2>
          {error && <p className={styles.errorText}>{error}</p>}

          {/* CRÉER UNE RECETTE */}
          <div className={styles.createBlock}>
            <p className={styles.createLabel}>Créer une nouvelle recette</p>
            <div className={styles.createInput}>
              <input
                className={styles.createNameInput}
                type="text"
                aria-label="Nom de la nouvelle recette"
                placeholder="Entrer son nom"
                value={newRecipeName}
                onChange={e => setNewRecipeName(e.target.value)}
              />
              <button className={styles.createBtn} aria-label="Aller au formulaire de création de recette" onClick={() => navigate('/membre/creer-recette')}>
                +
              </button>
            </div>
          </div>

          {/* FILTRES */}
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

          {/* RECETTES GROUPÉES */}
          {Object.entries(grouped).map(([categorie, recettes]) => (
            <div key={categorie} className={styles.section}>
              <h2 className={styles.sectionTitle}>{categorie}s</h2>
              <div className={styles.grid}>
                {recettes.map(recette => (
                  <div key={recette.id} className={styles.cardShell}>
                    <RecipeCard recipe={mapMemberRecipeToCard(recette)} />
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
                      {/* ──────────────────────────────────────────────────
                           MODIF 3 : bouton "Soumettre" visible si DRAFT
                          
                          Affiche un bouton pour soumettre la recette à
                          l'admin quand elle est en brouillon. Le clic
                          appelle handleSubmitRecipe qui envoie un PATCH
                          et met à jour le badge localement.
                      ────────────────────────────────────────────────── */}
                      {String(recette.status || '').toUpperCase() === 'DRAFT' && (
                        <button
                          type="button"
                          className={styles.actionBtn}
                          aria-label={`Soumettre la recette ${recette.titre} pour validation`}
                          onClick={() => handleSubmitRecipe(recette.id)}
                        >
                          Soumettre
                        </button>
                      )}

                      {/* ──────────────────────────────────────────────────
                           MODIF 4 : bouton "Modifier" désactivé si PENDING
                          
                          Avant  : toujours cliquable
                          Après  : disabled quand status === 'PENDING'
                          
                          On ne peut pas modifier une recette qui est en
                          cours de validation par l'admin.
                      ────────────────────────────────────────────────── */}

                       <button
                        type="button"
                        className={styles.actionBtn}
                        aria-label={`Modifier la recette ${recette.titre}`}
                        onClick={() => handleEditClick(recette)}
                        disabled={String(recette.status || '').toUpperCase() === 'PENDING'}
                      >
                        <img src="/icon/Edit.svg" alt="" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        aria-label={`Supprimer la recette ${recette.titre}`}
                        onClick={() => handleDeleteClick(recette)}
                      >
                        <img src="/icon/close_menu.svg" alt="" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

    </div>
  );
}
