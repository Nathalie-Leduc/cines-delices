import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { successResponse, asyncHandler } from '../lib/responseHelper.js';

// Helper : signe un JWT
function signToken(user) {
  return jwt.sign(
    { id: user.id, pseudo: user.pseudo, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
  );
}

// Helper : formate un user sans passwordHash
function safeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST / api/auth/register
// ZOD va validé et normalisé email, pseudo et password
export const register = asyncHandler(async (req, res) => {
  const { email, pseudo, password } = req.body;

  // Vérification de  l'unicité email + pseudo en une seule requête
  const existing  = await prisma.user.findFirst({
    where: { OR: [{ email }, { pseudo }]},
  });
  if (existing) {
    const field = existing.email === email ? 'email' : 'pseudo';
    const err = new Error(`Ce ${field} est déjà utilisé`);
    err.statusCode = 409;
    throw err;
  }

  // Hashage du MDP avec argon2
  const passwordHash = await argon2.hash(password);

  // Création de l'utilisateur
  const user = await prisma.user.create({
    data: { email, pseudo, passwordHash },
  });

  // Génération du JWT et renvoi sans le hash
  const token = signToken(user);
  res.status(201).json({
    ...successResponse(
      {
        token,
        user: safeUser(user),
      },
      'Compte créé avec succès 🎬',
      201
    ),
  });
});

// POST / api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Récupération de l'utilisateur
  const user = await prisma.user.findUnique({ where: { email } });

  // Vérification du MDP avec argon2
  const isValid = user && await argon2.verify(user.passwordHash, password);
  if (!isValid) {
    const err = new Error('Email ou mot de passe incorrect');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user);
  res.json(
    successResponse(
      { token, user: safeUser(user) },
      'Connexion réussie'
    )
  );
});
  

// GET / api/auth/logout
export const logout = (_req, res) => {
  res.json(successResponse(null, 'Déconnecté avec succès'))
};


// GET / api/auth/me
// Route protégée - req.user injecté par authMiddleware
export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user.id },
    select: {
      id:        true,
      email:     true,
      pseudo:    true,
      role:      true,
      createdAt: true,
      _count:    { select: { recipes: true } },
    },
  });

  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 404;
    throw err;
  }

  res.json(successResponse(user, 'Profil récupéré'));
});

// PATCH / api/auth/me
// Zod valide au moins un champ présent et email normalisé
export const updateMe = asyncHandler(async (req, res) => {
  const { pseudo, email } = req.body;

  const data = {};
  if (pseudo) data.pseudo = pseudo;
  if (email) data.email = email;

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: {
      id:        true,
      email:     true,
      pseudo:    true,
      role:      true,
      createdAt: true,
    },
  });

  res.json(successResponse(updated, 'Profil mis à jour'));
});

// DELETE /api/auth/me
export const deleteMe = asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: req.user.id } });
  res.json(successResponse(null, 'Compte supprimé'));
})
