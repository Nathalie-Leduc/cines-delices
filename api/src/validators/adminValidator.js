import { z } from 'zod';

const recipeIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de recette invalide'),
  }),
});

export const publishRecipeSchema = recipeIdParamSchema;

export const rejectRecipeSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de recette invalide'),
  }),
  body: z.object({
    rejectionReason: z
      .string({ required_error: 'Le motif de refus est obligatoire.' })
      .trim()
      .min(10, 'Le motif de refus doit contenir au moins 10 caractères.'),
  }),
});
