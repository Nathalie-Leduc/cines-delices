// SHEMAS de validation zod pour les routes auth
// Centralisé ici pour être partagé entre register et
// un futur changePassword si besoin.
//
// Règles :
//   ✅ 8 caractères minimum
//   ✅ 1 majuscule minimum  (A-Z)
//   ✅ 1 chiffre minimum    (0-9)
//   ✅ 1 caractère spécial  (!@#$%^&*...)
//   ✅ 72 caractères max    (limite argon2)



import { z } from 'zod';

// Password
// Centralisé ici pour être partagé entre register et
// un futur changePassword si besoin.
//
// Règles :
//   ✅ 8 caractères minimum
//   ✅ 1 majuscule minimum  (A-Z)
//   ✅ 1 chiffre minimum    (0-9)
//   ✅ 1 caractère spécial  (!@#$%^&*...)
//   ✅ 72 caractères max    (limite argon2)

// On utilise .refine() chaîné plutôt qu'une seule .regex()
// pour avoir un message d'erreur précis par règle manquante.
export const passwordSchema = z
  .string({ required_error: 'Le mot de passe est obligatoire' })
  .min(8,  'Le mot de passe doit contenir au moins 8 caractères')
  .max(72, 'Le mot de passe ne peut pas dépasser 72 caractères')
  .refine(
    pwd => /[A-Z]/.test(pwd),
    'Le mot de passe doit contenir au moins 1 majuscule'
  )
  .refine(
    pwd => /[0-9]/.test(pwd),
    'Le mot de passe doit contenir au moins 1 chiffre'
  )
  .refine(
    pwd => /[^A-Za-z0-9]/.test(pwd),
    'Le mot de passe doit contenir au moins 1 caractère spécial (!@#$%...)'
  );


// Register
// POST/ api/auth/register
export const registerSchema = z.object({
  body: z.object({

    email: z
      .string({ required_error: 'L\'email est obligatoire' })
      .email('Format email invalide (ex: marie@cinesdelices.fr)')
      .toLowerCase()      // normalise automatiquement en minuscules
      .trim(),

    nom: z
      .string({ required_error: 'Le nom est obligatoire' })
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(60, 'Le nom ne peut pas dépasser 60 caractères')
      .trim(),

    prenom: z
      .string({ required_error: 'Le prénom est obligatoire' })
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .max(60, 'Le prénom ne peut pas dépasser 60 caractères')
      .trim(),

    pseudo: z
      .string()
      .min(2,  'Le pseudo doit contenir au moins 2 caractères')
      .max(30, 'Le pseudo ne peut pas dépasser 30 caractères')
      .trim()
      .optional(),

    password: passwordSchema,

    acceptedPolicies: z
      .boolean({ required_error: 'Vous devez accepter la politique de confidentialité et la politique de cookies' })
      .refine(value => value === true, 'Vous devez accepter la politique de confidentialité et la politique de cookies'),
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
      // et Donc on n'applique pas le shema Password
  }),
});

//  Update Me
// PATCH /api/auth/me
export const updateMeSchema = z.object({
  body: z.object({

    nom: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(60, 'Le nom ne peut pas dépasser 60 caractères')
      .trim()
      .optional(),

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
    data => data.nom !== undefined || data.pseudo !== undefined || data.email !== undefined,
    { message: 'Au moins un champ (nom, pseudo ou email) est requis' }
  ),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({ required_error: 'Le mot de passe actuel est obligatoire' })
      .min(1, 'Le mot de passe actuel est obligatoire'),

    newPassword: passwordSchema,

    confirmPassword: z
      .string({ required_error: 'La confirmation du mot de passe est obligatoire' })
      .min(1, 'La confirmation du mot de passe est obligatoire'),
  }).refine(
    data => data.currentPassword !== data.newPassword,
    { message: 'Le nouveau mot de passe doit être différent de l\'ancien', path: ['newPassword'] }
  ).refine(
    data => data.newPassword === data.confirmPassword,
    { message: 'La confirmation du mot de passe ne correspond pas', path: ['confirmPassword'] }
  ),
});
