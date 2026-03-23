// Validators Zod pour les routes de recettes

import { z } from 'zod';

const optionalIntFromInput = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().int().positive().optional());

const optionalTrimmedString = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized === '' ? undefined : normalized;
}, z.string().optional());

// Schéma pour un ingrédient dans une recette
const ingredientSchema = z.object({
  nom: z
    .string({ required_error: 'Le nom d\'ingrédient est obligatoire' })
    .min(1, 'Le nom d\'ingrédient ne peut pas être vide')
    .trim(),
  quantity: z.union([z.string(), z.number()]).optional().nullable(),
  quantite: z.union([z.string(), z.number()]).optional().nullable(),
  unit: z.string().optional().nullable(),
  unite: z.string().optional().nullable(),
});

// POST /api/recipes - Créer une nouvelle recette
export const createRecipeSchema = z.object({
  body: z.object({
    titre: z
      .string({ required_error: 'Le titre est obligatoire' })
      .min(3, 'Le titre doit contenir au moins 3 caractères')
      .max(100, 'Le titre ne peut pas dépasser 100 caractères')
      .trim(),

    instructions: z
      .string()
      .min(1, 'Les instructions sont obligatoires')
      .max(5000, 'Les instructions ne peuvent pas dépasser 5000 caractères')
      .trim(),

    etapes: z.array(z.string().trim().min(1)).optional(),

    categoryId: z
      .string()
      .uuid('ID de catégorie invalide')
      .optional(),

    categorie: z
      .string()
      .min(1, 'La catégorie est obligatoire')
      .optional(),

    mediaId: z
      .string()
      .uuid('ID de média invalide')
      .optional(),

    filmId: optionalIntFromInput,

    film: z.string().trim().optional(),

    type: z.enum(['F', 'S', 'movie', 'tv', 'series']).optional(),

    nombrePersonnes: optionalIntFromInput,

    nbPersonnes: optionalIntFromInput,

    tempsPreparation: optionalIntFromInput,

    tempsCuisson: optionalIntFromInput,

    imageUrl: z.string().url().optional().or(z.literal('')),

    ingredients: z
      .array(ingredientSchema)
      .optional(),
  })
    .refine((data) => Boolean(data.categoryId || data.categorie), {
      message: 'La catégorie est obligatoire',
      path: ['categoryId'],
    })
    .refine((data) => Boolean(data.mediaId || data.filmId), {
      message: 'Le média est obligatoire',
      path: ['mediaId'],
    })
    .refine((data) => {
      if (typeof data.instructions === 'string' && data.instructions.trim().length >= 1) {
        return true;
      }

      if (Array.isArray(data.etapes)) {
        const merged = data.etapes.map((step) => step.trim()).filter(Boolean).join(' ');
        return merged.length >= 1;
      }

      return false;
    }, {
      message: 'Les instructions sont obligatoires.',
      path: ['instructions'],
    }),
});

// PATCH /api/recipes/:id - Mettre à jour une recette
export const updateRecipeSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'L\'ID de la recette est obligatoire' })
      .uuid('ID de recette invalide'),
  }),
  body: z.object({
    titre: z
      .string()
      .min(3, 'Le titre doit contenir au moins 3 caractères')
      .max(100, 'Le titre ne peut pas dépasser 100 caractères')
      .trim()
      .optional(),

    instructions: z
      .string()
      .min(1, 'Les instructions sont obligatoires')
      .max(5000, 'Les instructions ne peuvent pas dépasser 5000 caractères')
      .trim()
      .optional(),

    categoryId: z
      .string()
      .uuid('ID de catégorie invalide')
      .optional(),

    mediaId: z
      .string()
      .uuid('ID de média invalide')
      .optional(),

    nombrePersonnes: z
      .number()
      .int('Le nombre de personnes doit être un entier')
      .positive('Le nombre de personnes doit être positif')
      .optional(),

    tempsPreparation: z
      .number()
      .int('Le temps de préparation doit être un entier (en minutes)')
      .positive('Le temps de préparation doit être positif')
      .optional(),

    tempsCuisson: z
      .number()
      .int('Le temps de cuisson doit être un entier (en minutes)')
      .positive('Le temps de cuisson doit être positif')
      .optional(),

    ingredients: z
      .array(ingredientSchema)
      .optional(),
  }),
});

// GET /api/recipes/:id
export const getRecipeSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'L\'ID de la recette est obligatoire' })
      .uuid('ID de recette invalide'),
  }),
});

// GET /api/recipes?page=&limit=&category=&q=
export const listRecipesSchema = z.object({
  query: z.object({
    page: optionalIntFromInput.default(1),
    limit: optionalIntFromInput.default(12),
    category: optionalTrimmedString,
    q: optionalTrimmedString,
  }),
});

// DELETE /api/recipes/:id
export const deleteRecipeSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'L\'ID de la recette est obligatoire' })
      .uuid('ID de recette invalide'),
  }),
});
