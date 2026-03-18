// SHEMAS de validation zod pour les routes auth

import { z } from 'zod';

// Register
// POST/ api/auth/register
export const registerSchema = z.object({
  body: z.object({

    email: z
      .string({ required_error: 'L\'email est obligatoire' })
      .email('Format email invalide (ex: marie@cinedelices.fr)')
      .toLowerCase()      // normalise automatiquement en minuscules
      .trim(),

    pseudo: z
      .string({ required_error: 'Le pseudo est obligatoire' })
      .min(2,  'Le pseudo doit contenir au moins 2 caractères')
      .max(30, 'Le pseudo ne peut pas dépasser 30 caractères')
      .trim(),

    password: z
      .string({ required_error: 'Le mot de passe est obligatoire' })
      .min(8,  'Le mot de passe doit contenir au moins 8 caractères')
      .max(72, 'Le mot de passe ne peut pas dépasser 72 caractères'),
      // 72 = limite de argon2 (au-delà les caractères sont ignorés)
  }),
});

// Login
// POST /api/auth/login
 export const loginSchema = z.object({
  body: z.object({

    email: z
      .string({ required_error: 'L\'email est obligatoire' })
      .email('Format email invalide')
      .toLowerCase()
      .trim(),

    password: z
      .string({ required_error: 'Le mot de passe est obligatoire' })
      .min(1, 'Le mot de passe est obligatoire'),
      // Pas de min(8) ici : on ne révèle pas les règles à un attaquant
  }),
});

//  Update Me
// PATCH /api/auth/me
export const updateMeSchema = z.object({
  body: z.object({

    pseudo: z
      .string()
      .min(2,  'Le pseudo doit contenir au moins 2 caractères')
      .max(30, 'Le pseudo ne peut pas dépasser 30 caractères')
      .trim()
      .optional(),

    email: z
      .string()
      .email('Format email invalide')
      .toLowerCase()
      .trim()
      .optional(),

  // Règle custom : au moins un champ doit être fourni
  }).refine(
    data => data.pseudo !== undefined || data.email !== undefined,
    { message: 'Au moins un champ (pseudo ou email) est requis' }
  ),
});
