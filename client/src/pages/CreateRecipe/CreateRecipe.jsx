// ============================================================
// PAGE CRÉATION DE RECETTE — Ciné Délices
// ============================================================
// Formulaire complet pour créer une recette :
//   - Titre, film/série (recherche TMDB), catégorie
//   - Image (upload fichier ou URL)
//   - Ingrédients (recherche API + création à la volée)
//   - Étapes de préparation
//   - Soumission avec validation des champs obligatoires
//
// Système d'ingrédients :
//   Un seul champ de saisie (ingredientDraft) pour composer
//   un ingrédient (nom + quantité + unité), puis bouton
//   "Ajouter" pour l'insérer dans la liste form.ingredients.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './CreateRecipe.module.scss';
import Alert from '../../components/Alert/Alert.jsx';
import { buildApiUrl } from '../../services/api.js';
import {
  getMediaSuggestionMeta,
  MEDIA_SUGGESTION_POSTER_FALLBACK,
  normalizeTmdbSearchResult,
} from '../../utils/mediaSearch.js';


const defaultCategoriesOptions = ['Entrée', 'Plat', 'Dessert', 'Boisson'];
const unitesOptions = ['g', 'kg', 'ml', 'L', 'cl', 'pièce(s)', 'cuillère(s) à soupe', 'cuillère(s) à café', 'pincée(s)', 'tasse'];
const INGREDIENT_SEARCH_API = import.meta.env.VITE_INGREDIENT_SEARCH_API
  || import.meta.env.VITE_INGREDIENT_SEARCH_API_URL
  || buildApiUrl('/api/ingredients/search');
const INGREDIENT_CREATE_API = import.meta.env.VITE_INGREDIENT_CREATE_API
  || (import.meta.env.VITE_INGREDIENT_SEARCH_API_URL ? import.meta.env.VITE_INGREDIENT_SEARCH_API_URL.replace(/\/search$/, '') : '')
  || buildApiUrl('/api/ingredients');
const RECIPE_CREATE_API = import.meta.env.VITE_RECIPE_CREATE_API
  || import.meta.env.VITE_RECIPE_API_URL
  || buildApiUrl('/api/recipes');
const CATEGORIES_API = buildApiUrl('/api/categories');
const TMDB_SEARCH_API = import.meta.env.VITE_TMDB_SEARCH_API
  || buildApiUrl('/api/tmdb/medias/search');

const INITIAL_FORM = {
  titre: '',
  film: '',
  filmId: null,
  type: '',
  image: null,
  imageUrl: '',
  categorie: '',
  tempsPréparation: '',
  tempsCuisson: '',
  nbPersonnes: '',
  ingredients: [],
  etapes: [''],
};

const INITIAL_INGREDIENT_DRAFT = {
  ingredientId: null,
  nom: '',
  quantite: '',
  unite: '',
};

export default function CreerRecette() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTitleFromNavigation = typeof location.state?.initialTitle === 'string'
    ? location.state.initialTitle.trim()
    : '';
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: 'info', message: '' });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [filmSearchResults, setFilmSearchResults] = useState([]);
  const [filmSearchLoading, setFilmSearchLoading] = useState(false);
  const [filmSearchError, setFilmSearchError] = useState('');
  const [ingredientDraft, setIngredientDraft] = useState(INITIAL_INGREDIENT_DRAFT);
  const [ingredientAlreadyExists, setIngredientAlreadyExists] = useState(false);
  const [ingredientSearchResults, setIngredientSearchResults] = useState([]);
  const [ingredientSearchLoading, setIngredientSearchLoading] = useState(false);
  const [ingredientSearchError, setIngredientSearchError] = useState('');
  const [creatingIngredient, setCreatingIngredient] = useState(false);
  const filmSearchTimeoutRef = useRef(null);
  const ingredientSearchTimeoutRef = useRef(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [categoriesOptions, setCategoriesOptions] = useState(defaultCategoriesOptions);
  const [lastSubmittedSignature, setLastSubmittedSignature] = useState('');
  //Média sélectionné depuis TMDB
  const [selectedMedia, setSelectedMedia] = useState(null); // état pour stocker le média choisi

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') {
      return;
    }

    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) {
      return;
    }

    try {
      window.scrollTo(0, 0);
    } catch {
      // Certains environnements de test ne supportent pas scrollTo.
    }
  }, []);

  useEffect(() => {
    if (!initialTitleFromNavigation) {
      return;
    }

    setForm(prev => ({
      ...prev,
      titre: prev.titre || initialTitleFromNavigation,
    }));
  }, [initialTitleFromNavigation]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await fetch(CATEGORIES_API);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const categoryList = (Array.isArray(payload) ? payload : payload?.data || [])
          .map((category) => String(category?.name || '').trim())
          .filter(Boolean);

        if (!isMounted || categoryList.length === 0) {
          return;
        }

        setCategoriesOptions(categoryList);
      } catch {
        if (isMounted) {
          setCategoriesOptions(defaultCategoriesOptions);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);


  // ===== HANDLERS GÉNÉRAUX =====
  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

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

  function isAllowedImageUrl(url) {
    if (!url) {
      return false;
    }

    const normalizedUrl = url.trim().toLowerCase();
    if (normalizedUrl.startsWith('data:image/png') || normalizedUrl.startsWith('data:image/jpeg') || normalizedUrl.startsWith('data:image/webp')) {
      return true;
    }

    try {
      const parsedUrl = new URL(url.trim());
      const pathname = parsedUrl.pathname.toLowerCase();
      return pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.jpeg') || pathname.endsWith('.webp');
    } catch {
      return false;
    }
  }

  function handleImageSelection(file) {
    if (!file) {
      return;
    }

    if (!isAllowedImageFile(file)) {
      setImageError('Veuillez utiliser une image au format .png, .jpg, .jpeg ou .webp.');
      setForm(prev => ({ ...prev, image: null }));
      return;
    }

    setImageError('');
    setForm(prev => ({ ...prev, image: file, imageUrl: '' }));
  }

  function handleImageUrlChange(value) {
    setForm(prev => ({ ...prev, imageUrl: value }));
    if (value.trim() === '') {
      setImageError('');
    }
  }

  function validateImageUrl() {
    if (form.imageUrl.trim() === '') {
      return;
    }

    if (!isAllowedImageUrl(form.imageUrl)) {
      setImageError('Veuillez coller une URL valide qui pointe vers une image .png, .jpg, .jpeg ou .webp.');
      return;
    }

    setImageError('');
    setForm(prev => ({ ...prev, image: null }));
  }

  // ===== FILM / SÉRIE (TMDB) =====
  async function searchFilms(query) {
    const trimmed = query.trim(); // On enlève les espaces avant et après la saisie
    // Si l'utilisateur tape moins de 2 caractères, on ne lance pas la recherche
    if (trimmed.length < 2) {
      setFilmSearchResults([]); // vide les résultats
      setFilmSearchError(''); // pas d'erreur
      setFilmSearchLoading(false);// arrêt du loading
      return;
    }

    setFilmSearchLoading(true);
    setFilmSearchError('');// réinitialise l'erreur

    try {
      // Appel API TMDB (ou ton endpoint qui fait le proxy vers TMDB)
      const response = await fetch(`${TMDB_SEARCH_API}?searchTerm=${encodeURIComponent(trimmed)}`);
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
      // Normalisation des résultats : on garde id, titre et type
      const normalized = rawList
        .map(normalizeTmdbSearchResult)
        .filter(item => item.title); // on garde uniquement ceux qui ont un titre

      setFilmSearchResults(normalized.slice(0, 8)); // on limite à 8 résultats
    } catch (error) {
      setFilmSearchResults([]);
      setFilmSearchError(error?.message || "Impossible de rechercher les films/séries pour l'instant.");
    } finally {
      setFilmSearchLoading(false);
    }
  }

  // Fonction appelée à chaque frappe dans l'input
  function handleFilmInput(value) {
    // Mise à jour du formulaire
    setForm((prev) => ({
      ...prev,
      film: value, // valeur affichée dans l'input
      filmId: null,// on réinitialise l'id sélectionné
    }));
    searchFilms(value);// On lance la recherche immédiatement
    // Debounce : on relance la recherche après 300ms si l'utilisateur continue de taper
    clearTimeout(filmSearchTimeoutRef.current);
    filmSearchTimeoutRef.current = setTimeout(() => {
      searchFilms(value);
    }, 300);
  }

  // Fonction pour sélectionner un film ou une série depuis la liste
  function selectFilm(media) {
    setSelectedMedia(media);// on stocke le média choisi pour l'enregistrer plus tard
    // Met à jour le formulaire avec le titre et l'id du média
    setForm((prev) => ({
      ...prev,
      film: media.title,
      filmId: media.id ?? null,
    }));
    setFilmSearchResults([]);// on vide la liste
    // On déduit le type de média pour le formulaire : 'F' = film, 'S' = série
    const normalizedType = String(media.type || '').toLowerCase();
    if (normalizedType === 'movie') {
      handleChange('type', 'F');
    } else if (normalizedType === 'tv' || normalizedType === 'series') {
      handleChange('type', 'S');
    }

    setFilmSearchResults([]);// on vide la liste
    setFilmSearchError('');// on réinitialise l'erreur
  }

  // ===== INGRÉDIENTS =====

  // ─────────────────────────────────────────────────────────────
  // normalizeIngredientName — force le singulier + minuscule
  // Analogie : le carnet de recettes accepte uniquement "citron",
  // jamais "Citrons" — on standardise dès la saisie.
  // ─────────────────────────────────────────────────────────────
  function normalizeIngredientName(name) {
    const str = String(name || '').trim().toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // CORRECTIF — noms composés (avec espace) : pas de singularisation.
    // "fraise des bois" → "fraise des bois" ✅ (était "fraise des boi" ❌)
    // "fraises"         → "fraise"          ✅ (inchangé)
    if (str.includes(' ')) return str;

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

  function clearIngredientSearchState() {
    setIngredientSearchResults([]);
    setIngredientSearchLoading(false);
    setIngredientSearchError('');
  }

  // ─────────────────────────────────────────────────────────────────────
  // FUZZY SEARCH — détecte les fautes de frappe par distance de Levenshtein
  //
  // Analogie : c'est comme un correcteur orthographique de cuisine.
  // Tu tapes "citon" → il comprend que tu voulais dire "citron" (1 lettre manquante).
  //
  // Distance de Levenshtein = nombre minimal d'opérations pour passer d'un mot
  // à l'autre (ajout, suppression, substitution d'un caractère).
  // Exemples :
  //   "citon"    → "citron"    : distance 1 (ajouter 'r')
  //   "tomattes" → "tomates"   : distance 1 (supprimer un 't')
  //   "aubrgin"  → "aubergine" : distance 3 (trop éloigné → pas de fuzzy)
  // ─────────────────────────────────────────────────────────────────────
  function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) =>
      Array.from({ length: a.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = a[j - 1] === b[i - 1]
          ? matrix[i - 1][j - 1]
          : 1 + Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]);
      }
    }
    return matrix[b.length][a.length];
  }

  // Normalise pour la comparaison : minuscule + sans accents
  function normalizeForFuzzy(str) {
    return String(str || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // Seuil de distance selon la longueur du mot :
  //   ≤ 3 lettres → pas de fuzzy (trop de faux positifs sur les mots courts)
  //   4-5 lettres → distance max 1  ("citon" → "citron" ✅)
  //   ≥ 6 lettres → distance max 2  ("tomattes" → "tomates" ✅)
  function isFuzzyMatch(query, candidate) {
    const q = normalizeForFuzzy(query);
    const c = normalizeForFuzzy(candidate);
    if (q.length <= 3) return false;
    const maxDist = q.length <= 5 ? 1 : 2;
    return levenshtein(q, c) <= maxDist;
  }

  async function searchIngredients(query) {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      clearIngredientSearchState();
      return;
    }

    setIngredientSearchLoading(true);
    setIngredientSearchError('');

    try {
      // ─── Requête 1 : recherche normale (contains) ───────────────────
      const response = await fetch(`${INGREDIENT_SEARCH_API}?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      const rawList = Array.isArray(payload) ? payload : payload.data || [];
      let normalized = rawList.map(item => ({
        id: item.id,
        name: item.name || item.nom || '',
      })).filter(item => item.name);

      // Vérifier d'abord un match exact dans les résultats normaux
      const normalizedQuery = trimmed.toLowerCase();
      // On compare avec trimmed (texte brut saisi) et non normalizedQuery (singulier).
      // "fraise des bois" !== "fraise" → pas de sélection automatique erronée.
      const exactMatch = normalized.find(
        item => item.name.trim().toLowerCase() === trimmed.toLowerCase(),
      );
      if (exactMatch) {
        // Met l'exact match en tête de liste sans verrouiller le champ.
        // L'utilisateur reste libre de continuer à taper (ex: "fraise" → "fraise des bois")
        const others = normalized.filter(item => item.id !== exactMatch.id);
        setIngredientSearchResults([exactMatch, ...others]);
        return;
      }

      // ─── Requête 2 : fuzzy — si peu/pas de résultats ──────────────────
      // Analogie : "citon" ne contient pas "citron", donc la 1ère recherche
      // revient vide. On relance avec les 3 premières lettres ("cit") pour
      // ramener des candidats ("citron", "citronnade"...) que le fuzzy
      // peut alors comparer et classer.
      // On fait cette 2ème requête si la 1ère a renvoyé moins de 3 résultats.
      if (normalized.length < 3 && trimmed.length >= 3) {
        const prefix = trimmed.slice(0, 3); // ex: "citon" → "cit"
        try {
          const fuzzyResponse = await fetch(
            `${INGREDIENT_SEARCH_API}?q=${encodeURIComponent(prefix)}`
          );
          if (fuzzyResponse.ok) {
            const fuzzyPayload = await fuzzyResponse.json();
            const fuzzyRaw = Array.isArray(fuzzyPayload) ? fuzzyPayload : fuzzyPayload.data || [];
            const fuzzyList = fuzzyRaw.map(item => ({
              id: item.id,
              name: item.name || item.nom || '',
            })).filter(item => item.name);

            // Fusionner sans doublons (par id)
            const existingIds = new Set(normalized.map(i => i.id));
            const extras = fuzzyList.filter(i => !existingIds.has(i.id));
            normalized = [...normalized, ...extras];
          }
        } catch {
          // La 2ème requête est optionnelle — on continue sans elle
        }
      }

      // ─── Tri final : fuzzy matches en tête ───────────────────────────
      // Parmi tous les candidats récupérés, on met en premier ceux qui
      // ressemblent le plus à ce que l'utilisateur a tapé.
      const fuzzyFirst = [
        ...normalized.filter(item => isFuzzyMatch(trimmed, item.name)),
        ...normalized.filter(item => !isFuzzyMatch(trimmed, item.name)),
      ];
      setIngredientSearchResults(fuzzyFirst);
    } catch {
      setIngredientSearchResults([]);
      setIngredientSearchError("Impossible de rechercher les ingrédients pour l'instant.");
    } finally {
      setIngredientSearchLoading(false);
    }
  }

  function handleIngredientNameInput(value) {
    // ✅ Normaliser dès la frappe : "Citrons" devient "citron" en temps réel
    const normalized = normalizeIngredientName(value);
    setIngredientDraft(prev => ({
      ...prev,
      nom: normalized,
      ingredientId: null,
    }));
    setIngredientAlreadyExists(false);

    clearTimeout(ingredientSearchTimeoutRef.current);
    ingredientSearchTimeoutRef.current = setTimeout(() => {
      searchIngredients(value);
    }, 300);
  }

  function handleIngredientDraftChange(field, value) {
    setIngredientDraft(prev => ({ ...prev, [field]: value }));
  }

  function selectIngredient(ingredient) {
    setIngredientDraft(prev => ({
      ...prev,
      ingredientId: ingredient.id || null,
      nom: ingredient.name,
    }));
    setIngredientAlreadyExists(true);
    clearIngredientSearchState();
  }

  async function createIngredient() {
    const name = String(ingredientDraft.nom || '').trim();
    if (!name) {
      return;
    }

    setCreatingIngredient(true);
    setIngredientSearchError('');

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
      selectIngredient({
        id: created.id,
        name: created.name || created.nom || name,
      });
      setIngredientAlreadyExists(true);
    } catch {
      setIngredientSearchError("Impossible de créer l'ingrédient pour l'instant.");
    } finally {
      setCreatingIngredient(false);
    }
  }

  function addIngredientToList() {
    const ingredientName = String(ingredientDraft.nom || '').trim();
    if (!ingredientName) {
      setIngredientSearchError("Saisis au moins le nom de l'ingrédient.");
      return;
    }

    setForm(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredientId: ingredientDraft.ingredientId || null,
          nom: ingredientName,
          quantite: String(ingredientDraft.quantite || '').trim(),
          unite: String(ingredientDraft.unite || '').trim(),
        },
      ],
    }));

    setIngredientDraft(INITIAL_INGREDIENT_DRAFT);
    setIngredientAlreadyExists(false);
    clearIngredientSearchState();
  }

  function removeIngredient(index) {
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  }

  function formatAddedIngredient(item) {
    const quantite = String(item?.quantite || '').trim();
    const unite = String(item?.unite || '').trim();
    const nom = String(item?.nom || '').trim();

    const prefix = [quantite, unite].filter(Boolean).join(' ').trim();
    const suffix = [prefix, nom].filter(Boolean).join(' ').trim();

    return suffix || nom;
  }

  // ===== ÉTAPES =====
  function handleEtapeChange(index, value) {
    const updated = [...form.etapes];
    updated[index] = value;
    setForm(prev => ({ ...prev, etapes: updated }));
  }

  function addEtape() {
    setForm(prev => ({ ...prev, etapes: [...prev.etapes, ''] }));
  }

  function removeEtape(index) {
    setForm(prev => ({
      ...prev,
      etapes: prev.etapes.filter((_, i) => i !== index)
    }));
  }

  function getApiMessage(payload) {
    if (!payload || typeof payload !== 'object') {
      return '';
    }

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      const detailed = payload.errors
        .map(err => err?.message || err?.msg || err)
        .filter(Boolean)
        .join(' ');

      if (detailed) {
        return detailed;
      }
    }

    if (typeof payload.message === 'string') {
      return payload.message;
    }

    if (typeof payload.error === 'string') {
      return payload.error;
    }

    return '';
  }

  function scrollToTopForNotification() {
    if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') {
      return;
    }

    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  }

  function showAlertAtTop(type, message) {
    setAlert({ type, message });
    scrollToTopForNotification();
  }

  function buildRecipePayload() {
    // ✅ parseTimeToMinutes — comprend "1h10", "1:10", "70min", "70" → minutes entières
    // Analogie : un assistant qui comprend toutes les façons de dire un temps.
    const parseTimeToMinutes = (value) => {
      if (value === '' || value === null || value === undefined) return undefined;
      const str = String(value).trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
      const hMatch = str.match(/^(\d+(?:\.\d+)?)h(?:(\d+)(?:min)?)?$/);
      if (hMatch) {
        const total = Math.round(parseFloat(hMatch[1]) * 60 + parseInt(hMatch[2] || '0', 10));
        return total > 0 ? total : undefined;
      }
      const colonMatch = str.match(/^(\d+):(\d+)(?::\d+)?$/);
      if (colonMatch) {
        const total = parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
        return total > 0 ? total : undefined;
      }
      const minMatch = str.match(/^(\d+(?:\.\d+)?)(?:min|mn|m)?$/);
      if (minMatch) {
        const parsed = Math.round(parseFloat(minMatch[1]));
        return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
      }
      return undefined;
    };

    // Reste utilisé pour nbPersonnes (entier simple)
    const parseNullableNumber = (value) => {
      if (value === '' || value === null || value === undefined) return undefined;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const normalizedSteps = form.etapes.map(step => step.trim()).filter(Boolean);

    return {
      titre: form.titre.trim(),
      film: form.film.trim(),
      filmId: form.filmId,
      type: form.type,
      categorie: form.categorie,
      imageUrl: form.imageUrl.trim(),
      instructions: normalizedSteps.join('\n'),
      etapes: normalizedSteps,
      tempsPreparation: parseTimeToMinutes(form.tempsPréparation),
      tempsCuisson: parseTimeToMinutes(form.tempsCuisson),
      nbPersonnes: parseNullableNumber(form.nbPersonnes),
      ingredients: form.ingredients
        .map(item => {
          const quantite = String(item.quantite || '').trim();
          const unite = String(item.unite || '').trim();

          return {
            ingredientId: item.ingredientId,
            nom: String(item.nom || '').trim(),
            quantity: quantite || null,
            unit: unite || null,
          };
        })
        .filter(item => item.nom),
    };
  }

  function buildSubmissionSignature(payload) {
    return JSON.stringify({
      titre: payload.titre,
      filmId: payload.filmId,
      type: payload.type,
      categorie: payload.categorie,
      instructions: payload.instructions,
      tempsPreparation: payload.tempsPreparation ?? null,
      tempsCuisson: payload.tempsCuisson ?? null,
      nbPersonnes: payload.nbPersonnes ?? null,
      ingredients: payload.ingredients,
      etapes: payload.etapes,
    });
  }

  // ===== SUBMIT =====
  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    const payload = buildRecipePayload();

    const missingFields = [];

    if (!payload.titre) {
      missingFields.push('titre');
    }

    if (!payload.filmId) {
      missingFields.push('film/série (sélection dans la liste)');
    }

    if (!payload.categorie) {
      missingFields.push('catégorie');
    }

    if (payload.ingredients.length === 0) {
      missingFields.push('au moins un ingrédient');
    }

    if (payload.etapes.length === 0) {
      missingFields.push('au moins une étape de préparation');
    }

    if (missingFields.length > 0) {
      showAlertAtTop('error', `Champs obligatoires manquants : ${missingFields.join(', ')}.`);
      setShowSubmitModal(false);
      return;
    }

    const submissionSignature = buildSubmissionSignature(payload);
    if (submissionSignature === lastSubmittedSignature) {
      setShowSubmitModal(false);
      showAlertAtTop('error', 'Cette recette a deja ete soumise. Modifie-la avant de valider de nouveau.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const hasImageFile = form.image instanceof File;
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const requestInit = {
        method: 'POST',
        headers,
      };

      if (hasImageFile) {
        const formData = new FormData();

        formData.append('titre', payload.titre);
        formData.append('film', payload.film);
        formData.append('filmId', String(payload.filmId));
        formData.append('type', payload.type);
        formData.append('categorie', payload.categorie);
        formData.append('instructions', payload.instructions);

        if (payload.tempsPreparation !== undefined) {
          formData.append('tempsPreparation', String(payload.tempsPreparation));
        }

        if (payload.tempsCuisson !== undefined) {
          formData.append('tempsCuisson', String(payload.tempsCuisson));
        }

        if (payload.nbPersonnes !== undefined) {
          formData.append('nbPersonnes', String(payload.nbPersonnes));
        }

        formData.append('ingredients', JSON.stringify(payload.ingredients));
        formData.append('etapes', JSON.stringify(payload.etapes));
        formData.append('image', form.image);

        requestInit.body = formData;
      } else {
        requestInit.headers = {
          ...headers,
          'Content-Type': 'application/json',
        };
        requestInit.body = JSON.stringify(payload);
      }

      const response = await fetch(RECIPE_CREATE_API, requestInit);

      let responsePayload = null;
      try {
        responsePayload = await response.json();
      } catch {
        responsePayload = null;
      }

      if (!response.ok) {
        const apiMessage = getApiMessage(responsePayload);

        if (response.status === 400 || response.status === 422) {
          setShowSubmitModal(false);
          showAlertAtTop('error', apiMessage || 'Champs manquants ou invalides. Vérifie le formulaire.');
        } else if (response.status === 401 || response.status === 403) {
          setShowSubmitModal(false);
          showAlertAtTop('error', apiMessage || 'Vous devez être connecté(e) pour créer une recette.');
        } else {
          setShowSubmitModal(false);
          showAlertAtTop('error', apiMessage || 'Erreur serveur lors de la création de la recette.');
        }

        return;
      }

      showAlertAtTop('success', 'La recette a bien été enregistrée. Elle apparaîtra après validation.');
      setLastSubmittedSignature(submissionSignature);
      setShowSubmitModal(false);
      setImageError('');
      setIngredientDraft(INITIAL_INGREDIENT_DRAFT);
      setIngredientAlreadyExists(false);
      setIngredientSearchResults([]);
      setIngredientSearchLoading(false);
      setIngredientSearchError('');
      setCreatingIngredient(false);
      setForm(INITIAL_FORM);
      navigate('/membre/mes-recettes/recettes-en-validation', { replace: true });
    } catch {
      setShowSubmitModal(false);
      showAlertAtTop('error', 'Impossible de joindre le serveur. Réessaie dans quelques instants.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openSubmitModal() {
    if (isSubmitting) {
      return;
    }

    setShowSubmitModal(true);
  }

  return (
    <div className={styles.creerRecette}>
      {showSubmitModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Publier la recette</h2>
            <p className={styles.modalText}>
              Voulez-vous confirmer l&apos;envoi de cette recette pour validation ?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                aria-label="Annuler la création de la recette"
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(false)}
              >
                Annuler
              </button>
              <button
                className={styles.confirmBtn}
                aria-label="Valider la création de la recette"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className={styles.title}>Créer une recette</h1>
      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(prev => ({ ...prev, message: '' }))}
      />

      {/* TITRE */}
      <p className={`${styles.label} ${styles.titleRequiredLabel}`}>
        Titre de la recette <span className={styles.requiredMark}>*</span>
      </p>
      <div className={styles.titreBlock}>
        <span className={styles.titreDash}>—</span>
        <input
          className={styles.titreInput}
          type="text"
          aria-label="Titre de la recette"
          placeholder="Spaghetti de Tony & Joe"
          value={form.titre}
          onChange={e => handleChange('titre', e.target.value)}
        />
        <span className={styles.titreDash}>—</span>
      </div>

      {/* FILM / SÉRIE */}
      <div className={styles.field}>
        <label className={styles.label}>
          Choisir un film ou une série <span className={styles.requiredMark}>*</span>
        </label>
        <div className={styles.inputIcon}>
          <input
            className={styles.input}
            type="text"
            aria-label="Film ou série"
            placeholder="Rechercher un film ou une série"
            value={form.film}
            onChange={e => handleFilmInput(e.target.value)}
          />
          <span className={styles.inputIconRight}>🔍</span>
        </div>

        {(filmSearchLoading || filmSearchError || filmSearchResults.length > 0 || form.film.trim().length >= 2) && (
          <div className={styles.ingredientSearchBox}>
            {filmSearchLoading && (
              <p className={styles.ingredientSearchText}>Recherche en cours...</p>
            )}

            {filmSearchError && (
              <p className={styles.ingredientSearchError}>{filmSearchError}</p>
            )}

            {!filmSearchLoading && !filmSearchError && filmSearchResults.length > 0 && (
              <ul className={styles.ingredientSuggestionList}>
                {filmSearchResults.map(result => (
                  <li key={`${result.id}-${result.type}`}>
                    <button
                      type="button"
                      className={styles.mediaSuggestionBtn}
                      aria-label={`Sélectionner ${result.title}`}
                      onClick={() => selectFilm(result)}
                    >
                      <img
                        src={result.poster || MEDIA_SUGGESTION_POSTER_FALLBACK}
                        alt=""
                        aria-hidden="true"
                        className={styles.mediaSuggestionPoster}
                      />
                      <span className={styles.mediaSuggestionCopy}>
                        <span className={styles.mediaSuggestionTitle}>{result.title}</span>
                        <span className={styles.mediaSuggestionMeta}>{getMediaSuggestionMeta(result)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className={styles.hint}>* Recherche connectée à l'API TMDB</p>
      </div>

      {/* TYPE */}
      <div className={styles.field}>
        <label className={styles.label}>Type</label>
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            aria-label="Type de contenu, film ou série"
            value={form.type}
            onChange={e => handleChange('type', e.target.value)}
          >
            <option value="">Sélectionner</option>
            <option value="F">Film</option>
            <option value="S">Série</option>
          </select>
        </div>
      </div>

      {/* IMAGE */}
      <div className={styles.field}>
        <label className={styles.label}>Ajouter une image</label>
        <div
          className={`${styles.dropZone} ${isDraggingImage ? styles.dropZoneActive : ''}`}
          onDragOver={e => {
            e.preventDefault();
            setIsDraggingImage(true);
          }}
          onDragLeave={() => setIsDraggingImage(false)}
          onDrop={e => {
            e.preventDefault();
            setIsDraggingImage(false);
            const droppedFile = e.dataTransfer.files?.[0];
            handleImageSelection(droppedFile);
          }}
        >
          <input
            id="create-recipe-image"
            className={styles.hiddenFileInput}
            type="file"
            aria-label="Choisir une image PNG, JPG ou WEBP"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={e => handleImageSelection(e.target.files?.[0])}
          />
          <span className={styles.inputPlaceholder}>
            {form.image ? form.image.name : 'Glisser un .png/.jpg/.webp ici ou choisir un fichier'}
          </span>
          <label htmlFor="create-recipe-image" className={styles.iconBtn}>
            +
          </label>
        </div>
        <div className={styles.inputIcon}>
          <input
            className={styles.input}
            type="url"
            aria-label="URL de l'image PNG, JPG ou WEBP"
            placeholder="Ou collez l'URL d'une image .png/.jpg/.webp"
            value={form.imageUrl}
            onChange={e => handleImageUrlChange(e.target.value)}
            onBlur={validateImageUrl}
          />
        </div>
        {imageError && <p className={styles.errorText}>{imageError}</p>}
      </div>

      {/* CATÉGORIE */}
      <div className={styles.field}>
        <label className={styles.label}>
          Catégorie <span className={styles.requiredMark}>*</span>
        </label>
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            aria-label="Catégorie de la recette"
            value={form.categorie}
            onChange={e => handleChange('categorie', e.target.value)}
          >
            <option value="">Sélectionner</option>
            {categoriesOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TEMPS PRÉPARATION */}
      <div className={styles.field}>
        <label className={styles.label}>Temps de préparation</label>
        <div className={styles.selectWrapper}>
          <input
            className={styles.input}
            type="text"
            aria-label="Temps de préparation"
            placeholder="15 min"
            value={form.tempsPréparation}
            onChange={e => handleChange('tempsPréparation', e.target.value)}
          />
        </div>
      </div>

      {/* TEMPS CUISSON */}
      <div className={styles.field}>
        <label className={styles.label}>Temps de cuisson</label>
        <div className={styles.selectWrapper}>
          <input
            className={styles.input}
            type="text"
            aria-label="Temps de cuisson"
            placeholder="30 min"
            value={form.tempsCuisson}
            onChange={e => handleChange('tempsCuisson', e.target.value)}
          />
        </div>
      </div>

      {/* NOMBRE DE PERSONNES */}
      <div className={styles.field}>
        <label className={styles.label}>Nombre de personnes</label>
        <div className={styles.selectWrapper}>
          <input
            className={styles.input}
            type="number"
            aria-label="Nombre de personnes"
            placeholder="5"
            value={form.nbPersonnes}
            onChange={e => handleChange('nbPersonnes', e.target.value)}
          />
        </div>
      </div>

      {/* INGRÉDIENTS */}
      <div className={styles.field}>
        <label className={styles.label}>
          Ingrédients <span className={styles.requiredMark}>*</span>
        </label>
        <div className={styles.ingredientComposer}>
          <div className={styles.ingredientComposerGrid}>
            <div className={styles.inputIcon}>
              <input
                className={styles.input}
                type="text"
                aria-label="Nom de l'ingredient"
                placeholder="Ingrédient"
                value={ingredientDraft.nom}
                onChange={e => handleIngredientNameInput(e.target.value)}
              />
              <span className={styles.inputIconRight}>🔍</span>
            </div>

            <div className={styles.inputIcon}>
              <input
                className={styles.input}
                type="text"
                aria-label="Quantite de l'ingredient"
                placeholder="Quantité"
                value={ingredientDraft.quantite}
                onChange={e => handleIngredientDraftChange('quantite', e.target.value)}
              />
            </div>

            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                aria-label="Unite de l'ingredient"
                value={ingredientDraft.unite}
                onChange={e => handleIngredientDraftChange('unite', e.target.value)}
              >
                <option value="">Unité</option>
                {unitesOptions.map(unite => (
                  <option key={unite} value={unite}>{unite}</option>
                ))}
              </select>
            </div>
          </div>

          {(ingredientSearchLoading
            || ingredientSearchResults.length > 0
            || ingredientSearchError
            || (ingredientDraft.nom.trim().length >= 2
              && !ingredientSearchLoading
              && !ingredientDraft.ingredientId
              && ingredientSearchResults.length === 0)) && (
            <div className={styles.ingredientSearchBox}>
              {ingredientSearchLoading && (
                <p className={styles.ingredientSearchText}>Recherche en cours...</p>
              )}

              {ingredientSearchError && (
                <p className={styles.ingredientSearchError}>{ingredientSearchError}</p>
              )}

              {ingredientSearchResults.length > 0 && (
                <ul className={styles.ingredientSuggestionList}>
                  {ingredientSearchResults.map(result => (
                    <li key={result.id || result.name}>
                      <button
                        type="button"
                        className={styles.ingredientSuggestionBtn}
                        aria-label={`Selectionner l'ingredient ${result.name}`}
                        onClick={() => selectIngredient(result)}
                      >
                        {result.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!ingredientSearchLoading
                && !ingredientSearchError
                && ingredientDraft.nom.trim().length >= 2
                && !ingredientAlreadyExists
                && ingredientSearchResults.length === 0 && (
                  <button
                    type="button"
                    className={styles.createIngredientBtn}
                    aria-label={`Creer l'ingredient ${ingredientDraft.nom.trim()}`}
                    onClick={createIngredient}
                    disabled={creatingIngredient}
                  >
                    {creatingIngredient
                      ? 'Creation...'
                      : `Creer l'ingredient "${ingredientDraft.nom.trim()}"`}
                  </button>
                )}
            </div>
          )}

          <div className={styles.ingredientBottom}>
            <button
              type="button"
              className={styles.addIngredientBtn}
              aria-label="Ajouter l'ingredient a la liste"
              onClick={addIngredientToList}
              disabled={!String(ingredientDraft.nom || '').trim()}
            >
              + Ajouter l'ingredient
            </button>
          </div>
        </div>

        {form.ingredients.length > 0 && (
          <ul className={styles.addedIngredientsList}>
            {form.ingredients.map((ingredient, index) => (
              <li key={`${ingredient.nom}-${index}`} className={styles.addedIngredientItem}>
                <span className={styles.addedIngredientText}>{formatAddedIngredient(ingredient)}</span>
                <button
                  type="button"
                  className={styles.addedIngredientRemove}
                  aria-label={`Supprimer l'ingredient ajoute ${index + 1}`}
                  onClick={() => removeIngredient(index)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ÉTAPES */}
      <div className={styles.field}>
        <label className={styles.label}>
          Étapes de préparation <span className={styles.requiredMark}>*</span>
        </label>

        {form.etapes.map((etape, index) => (
          <div key={index} className={styles.etapeRow}>
            <div className={styles.etapeNumber}>{index + 1}</div>
            <textarea
              className={styles.textarea}
              aria-label={`Etape de preparation ${index + 1}`}
              placeholder={`Étape ${index + 1}...`}
              value={etape}
              onChange={e => handleEtapeChange(index, e.target.value)}
              rows={2}
            />
            {form.etapes.length > 1 && (
              <button
                className={styles.removeBtn}
                aria-label={`Supprimer l'etape ${index + 1}`}
                onClick={() => removeEtape(index)}
              >
                −
              </button>
            )}
          </div>
        ))}

        <div className={styles.inputIcon}>
          <span className={styles.inputPlaceholder}>Étape {form.etapes.length + 1}...</span>
          <button className={styles.iconBtn} aria-label="Ajouter une etape" onClick={addEtape}>+</button>
        </div>
      </div>

      {/* SUBMIT */}
      <button
        className={styles.submitBtn}
        aria-label="Ouvrir la confirmation de creation de recette"
        onClick={openSubmitModal}
        disabled={isSubmitting}
      >
        Valider
      </button>

    </div>
  );
}
