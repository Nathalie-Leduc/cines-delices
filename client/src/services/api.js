/**
 * Effectue une requête HTTP vers l'API avec injection automatique du token.
 * @param {string} endpoint - Chemin de la route (ex: '/api/recipes')
 * @param {object} [options={}] - Options fetch : method, body, headers...
 * @returns {Promise<any>} Réponse JSON, ou null sur 204 No Content
 */
export async function request(endpoint, options = {}) {
  try {
    // 🔹 Récupérer le token depuis le localStorage
    const token = localStorage.getItem('auth_token');
 
    // 🔹 Détecter si le body est un FormData (upload de fichiers)
    //    → pas de JSON.stringify, pas de Content-Type manuel (boundary auto)
    const isFormData = options.body instanceof FormData;
 
    // 🔹 Déterminer si la requête transporte un body
    //    GET et HEAD n'en ont pas — certains serveurs rejettent Content-Type sur ces méthodes
    const method = options.method?.toUpperCase() ?? 'GET';
    const hasBody = options.body != null && !['GET', 'HEAD'].includes(method);
 
    // 🔹 Construire les headers
    const headers = {
      ...(!isFormData && hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),           // fusion avec les headers passés en param
      ...(token ? { Authorization: `Bearer ${token}` } : {}), // token si présent
    };
 
    // 🔹 Construire l'URL complète via la variable d'environnement Vite
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}${endpoint}`;
 
    // 🔹 Envoyer la requête
    const response = await fetch(url, {
      ...options,
      method,
      headers,
      // FormData envoyé tel quel ; objet plain → stringify ; pas de body sur GET/HEAD
      body: hasBody
        ? isFormData ? options.body : JSON.stringify(options.body)
        : undefined,
    });
 
    // 🔹 Réponse non OK → erreur enrichie avec le status HTTP
    //    Le front peut réagir différemment selon le code (401, 422, 500…)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || 'Erreur API inconnue');
      error.status = response.status; // ex : 401, 403, 422, 500
      error.data   = errorData;       // payload complet pour les erreurs de validation
      throw error;
    }
 
    // 🔹 204 No Content → pas de body JSON à parser
    if (response.status === 204) return null;
 
    // 🔹 Retourner la réponse désérialisée
    return await response.json();
 
  } catch (error) {
    console.error('API request error:', error);
    throw error; // Propager pour que le composant gère l'erreur
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// AUTH — /api/auth
// Gestion de l'authentification : inscription, connexion, profil connecté
// ─────────────────────────────────────────────────────────────────────────────
 
/**
 * Inscrit un nouvel utilisateur.
 * @param {{ name: string, email: string, password: string }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
export const register = (data) =>
  request('/api/auth/register', { method: 'POST', body: data });
 
/**
 * Connecte un utilisateur et retourne un token JWT.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: object }>}
 */
export const login = (credentials) =>
  request('/api/auth/login', { method: 'POST', body: credentials });
 
/**
 * Déconnecte l'utilisateur courant (invalide la session côté serveur).
 * @returns {Promise<null>}
 */
export const logout = () =>
  request('/api/auth/logout');
 
/**
 * Récupère le profil de l'utilisateur authentifié via son token.
 * @returns {Promise<object>} Données de l'utilisateur connecté
 */
export const getMe = () =>
  request('/api/auth/me');
 
/**
 * Met à jour les informations du profil connecté.
 * @param {{ name?: string, email?: string, password?: string }} data
 * @returns {Promise<object>} Profil mis à jour
 */
export const updateMe = (data) =>
  request('/api/auth/me', { method: 'PATCH', body: data });
 
/**
 * Supprime définitivement le compte de l'utilisateur connecté.
 * @returns {Promise<null>}
 */
export const deleteMe = () =>
  request('/api/auth/me', { method: 'DELETE' });
 
// ─────────────────────────────────────────────────────────────────────────────
// USERS — /api/users
// Données de l'utilisateur connecté : profil et recettes personnelles
// ─────────────────────────────────────────────────────────────────────────────
 
/**
 * Récupère le profil public de l'utilisateur connecté.
 * @returns {Promise<object>}
 */
export const getMyProfile = () =>
  request('/api/users/me');
 
/**
 * Récupère toutes les recettes créées par l'utilisateur connecté.
 * @returns {Promise<object[]>}
 */
export const getMyRecipes = () =>
  request('/api/users/me/recipes');
 
// ─────────────────────────────────────────────────────────────────────────────
// RECIPES — /api/recipes
// CRUD des recettes publiées — certaines routes nécessitent d'être connecté
// ─────────────────────────────────────────────────────────────────────────────
 
/**
 * Récupère toutes les recettes publiées (accès public).
 * @returns {Promise<object[]>}
 */
export const getAllPublishedRecipes = () =>
  request('/api/recipes');
 
/**
 * Récupère une recette par son identifiant.
 * @param {string|number} id - ID de la recette
 * @returns {Promise<object>}
 */
export const getRecipe = (id) =>
  request(`/api/recipes/${id}`);
 
/**
 * Crée une nouvelle recette (authentification requise).
 * @param {object} data - Données de la recette
 * @returns {Promise<object>} Recette créée
 */
export const createRecipe = (data) =>
  request('/api/recipes', { method: 'POST', body: data });
 
/**
 * Met à jour une recette existante (authentification requise).
 * @param {string|number} id - ID de la recette à modifier
 * @param {object} data - Champs à mettre à jour
 * @returns {Promise<object>} Recette mise à jour
 */
export const updateRecipe = (id, data) =>
  request(`/api/recipes/${id}`, { method: 'PATCH', body: data });
 
/**
 * Supprime une recette (authentification requise, auteur ou admin).
 * @param {string|number} id - ID de la recette à supprimer
 * @returns {Promise<null>}
 */
export const deleteRecipe = (id) =>
  request(`/api/recipes/${id}`, { method: 'DELETE' });
 
// ─────────────────────────────────────────────────────────────────────────────
// TMDB — /api/tmdb
// Recherche et récupération de médias depuis l'API TMDB (films, séries…)
// ─────────────────────────────────────────────────────────────────────────────
 
/**
 * Récupère tous les médias, avec filtre optionnel par type.
 * @param {string} [type] - Type de média (ex: 'movie', 'tv') — optionnel
 * @returns {Promise<object[]>}
 */
export const getAllMedias = (type) =>
  request(type ? `/api/tmdb/medias/${type}` : '/api/tmdb/medias');
 
/**
 * Récupère un média précis par type et identifiant TMDB.
 * @param {string} type - Type de média (ex: 'movie', 'tv')
 * @param {string|number} id - ID TMDB du média
 * @returns {Promise<object>}
 */
export const getMediaById = (type, id) =>
  request(`/api/tmdb/medias/${type}/${id}`);
 
/**
 * Recherche des médias par mot-clé ou critères.
 * @param {object} query - Paramètres de recherche (ex: { q: 'inception' })
 * @returns {Promise<object[]>}
 */
export const searchMedia = (query) =>
  request(`/api/tmdb/medias/search?${new URLSearchParams(query)}`);
 
// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — /api/admin
// Routes réservées aux administrateurs : modération et gestion du contenu
// ─────────────────────────────────────────────────────────────────────────────
 
// ── Recettes ─────────────────────────────────────────────────────────────────
 
/**
 * Récupère toutes les recettes (publiées et en attente).
 * @returns {Promise<object[]>}
 */
export const getAdminRecipes = () =>
  request('/api/admin/recipes');
 
/**
 * Récupère les recettes en attente de validation.
 * @returns {Promise<object[]>}
 */
export const getPendingRecipes = () =>
  request('/api/admin/recipes/pending');
 
/**
 * Approuve une recette en attente de modération.
 * @param {string|number} id - ID de la recette
 * @returns {Promise<object>} Recette approuvée
 */
export const approveRecipe = (id) =>
  request(`/api/admin/recipes/${id}/approve`, { method: 'PATCH' });
 
/**
 * Rejette une recette en attente de modération.
 * @param {string|number} id - ID de la recette
 * @returns {Promise<object>} Recette rejetée
 */
export const rejectRecipe = (id) =>
  request(`/api/admin/recipes/${id}/reject`, { method: 'PATCH' });
 
/**
 * Supprime définitivement une recette (action admin).
 * Nommée adminDeleteRecipe pour éviter le conflit avec deleteRecipe (user).
 * @param {string|number} id - ID de la recette
 * @returns {Promise<null>}
 */
export const adminDeleteRecipe = (id) =>
  request(`/api/admin/recipes/${id}`, { method: 'DELETE' });
 
// ── Utilisateurs ─────────────────────────────────────────────────────────────
 
/**
 * Récupère la liste de tous les utilisateurs.
 * @returns {Promise<object[]>}
 */
export const getAdminUsers = () =>
  request('/api/admin/users');
 
/**
 * Supprime un utilisateur par son identifiant.
 * @param {string|number} id - ID de l'utilisateur
 * @returns {Promise<null>}
 */
export const deleteUser = (id) =>
  request(`/api/admin/users/${id}`, { method: 'DELETE' });
 
// ── Catégories ───────────────────────────────────────────────────────────────
 
/**
 * Récupère toutes les catégories de recettes.
 * @returns {Promise<object[]>}
 */
export const getAdminCategories = () =>
  request('/api/admin/categories');
 
/**
 * Crée une nouvelle catégorie.
 * @param {{ name: string }} data
 * @returns {Promise<object>} Catégorie créée
 */
export const createCategory = (data) =>
  request('/api/admin/categories', { method: 'POST', body: data });
 
/**
 * Met à jour une catégorie existante.
 * @param {string|number} id - ID de la catégorie
 * @param {{ name?: string }} data
 * @returns {Promise<object>} Catégorie mise à jour
 */
export const updateCategory = (id, data) =>
  request(`/api/admin/categories/${id}`, { method: 'PATCH', body: data });
 
/**
 * Supprime une catégorie.
 * @param {string|number} id - ID de la catégorie
 * @returns {Promise<null>}
 */
export const deleteCategory = (id) =>
  request(`/api/admin/categories/${id}`, { method: 'DELETE' });
 
// ── Ingrédients ──────────────────────────────────────────────────────────────
 
/**
 * Récupère tous les ingrédients (y compris non approuvés).
 * @returns {Promise<object[]>}
 */
export const getAdminIngredients = () =>
  request('/api/admin/ingredients');
 
/**
 * Met à jour les informations d'un ingrédient.
 * @param {string|number} id - ID de l'ingrédient
 * @param {object} data - Champs à mettre à jour
 * @returns {Promise<object>} Ingrédient mis à jour
 */
export const updateIngredient = (id, data) =>
  request(`/api/admin/ingredients/${id}`, { method: 'PATCH', body: data });
 
/**
 * Approuve un ingrédient soumis par un utilisateur.
 * @param {string|number} id - ID de l'ingrédient
 * @returns {Promise<object>} Ingrédient approuvé
 */
export const approveIngredient = (id) =>
  request(`/api/admin/ingredients/${id}/approve`, { method: 'PATCH' });
 
/**
 * Supprime définitivement un ingrédient.
 * @param {string|number} id - ID de l'ingrédient
 * @returns {Promise<null>}
 */
export const deleteIngredient = (id) =>
  request(`/api/admin/ingredients/${id}`, { method: 'DELETE' });
 