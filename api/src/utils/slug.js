// Convertit un titre en slug URL-friendly.

import slugify from 'slugify';

/**
 * Génère un slug à partir d'un titre.
 * @param {string} titre
 * @returns {string}
 */
export function generateSlug(titre) {
  return slugify(titre, {
    lower:       true,   // tout en minuscules
    strict:      true,   // supprime les caractères non alphanumériques
    locale:      'fr',   // gestion des accents français
    trim:        true,   // supprime les tirets en début/fin
  });
}

/**
 * Génère un slug unique en ajoutant un suffixe si nécessaire.
 * Vérifie l'unicité via une fonction de recherche BDD.
 * @param {string} titre
 * @param {Function} findBySlug - async (slug) => record | null
 * @returns {Promise<string>}
*/
export async function generateUniqueSlug(titre, findBySlug) {
  const base = generateSlug(titre);
  let slug    = base;
  let counter = 1;

  // Tant qu'un enregistrement avec ce slug existe → ajouter un suffixe
  while (await findBySlug(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}