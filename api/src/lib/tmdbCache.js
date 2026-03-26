import NodeCache from 'node-cache';

// ============================================================
// CACHE MÉMOIRE — Réponses TMDB
// ============================================================
//
//
// Pourquoi mettre en cache ?
//   1. Performance : évite des appels réseau inutiles (TMDB ~200-500ms)
//   2. Quota : réduit le nombre d'appels réels vers TMDB
//   3. Résilience : si TMDB est temporairement down, les données
//      en cache restent disponibles pendant le TTL
//
// Configuration :
//   - stdTTL : 600 secondes = 10 minutes (durée de vie par défaut)
//   - checkperiod : 120 secondes = purge des entrées expirées toutes les 2 min
//   - useClones : false = retourne la référence directe (plus rapide,
//     on ne modifie jamais les données en cache donc c'est safe)
// ============================================================

const tmdbCache = new NodeCache({
  stdTTL: 600,        // 10 minutes
  checkperiod: 120,   // vérification toutes les 2 minutes
  useClones: false,    // performance : pas de deep clone
});

// ─────────────────────────────────────────────
// Helpers pour utiliser le cache facilement
// ─────────────────────────────────────────────

/**
 * Génère une clé de cache unique à partir du pathname et des params.
 *
 * Exemple :
 *   buildCacheKey('/search/movie', { query: 'ratatouille', page: 1 })
 *   → "tmdb:/search/movie?page=1&query=ratatouille"
 *
 * Les params sont triés alphabétiquement pour que
 * { query: 'a', page: 1 } et { page: 1, query: 'a' }
 * donnent la même clé (même résultat TMDB = même clé cache).
 */
export function buildCacheKey(pathname, params = {}) {
  const sorted = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `tmdb:${pathname}${sorted ? `?${sorted}` : ''}`;
}

/**
 * Récupère une valeur du cache, ou exécute la fonction fetchFn
 * et stocke le résultat si absent.
 *
 *
 * @param {string} key     - Clé de cache (générée par buildCacheKey)
 * @param {Function} fetchFn - Fonction async qui fait l'appel TMDB réel
 * @param {number} [ttl]   - TTL custom en secondes (optionnel, défaut = 600)
 * @returns {Promise<any>}  - Les données (du cache ou fraîches)
 */
export async function getOrFetch(key, fetchFn, ttl) {
  // 1. Vérifier le cache
  const cached = tmdbCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  // 2. Cache miss → appel réel
  const freshData = await fetchFn();

  // 3. Stocker en cache pour les prochaines requêtes
  if (ttl !== undefined) {
    tmdbCache.set(key, freshData, ttl);
  } else {
    tmdbCache.set(key, freshData); // utilise le stdTTL par défaut (600s)
  }

  return freshData;
}

/**
 * Vide tout le cache TMDB.
 * Utile si on veut forcer un rafraîchissement (admin, debug).
 */
export function flushTmdbCache() {
  tmdbCache.flushAll();
}

/**
 * Retourne les stats du cache (hits, misses, keys count).
 * Pratique pour le monitoring / debug.
 */
export function getCacheStats() {
  return tmdbCache.getStats();
}

export default tmdbCache;
